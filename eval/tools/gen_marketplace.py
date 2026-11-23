#!/usr/bin/env python3
"""Generate eval/fixtures/marketplace (a ~140-file Express monorepo) and eval/expected/marketplace.json.

Code and ground truth come from the same spec, so the endpoint list cannot drift from the code.
Usage: python3 eval/tools/gen_marketplace.py   (run from the repo root)
"""
import json, os, shutil, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUT = os.path.join(ROOT, "fixtures", "marketplace")
EXP = os.path.join(ROOT, "expected", "marketplace.json")

files = {}
def put(path, content):
    files[path] = content.lstrip("\n")

# ---------------------------------------------------------------- module specs
# route: (METHOD, path, action, guard, flags, extra_middleware)
# guard: none|auth|seller|admin   flags: owner, noval, raw, scoped
def R(m, p, a, g, flags="", mw=""):
    return dict(method=m, path=p, action=a, guard=g, flags=set(flags.split()), mw=mw)

MODULES = [
 dict(name="catalog", mount="catalog", version=1, public=True, entity="Product", table="products", owner="sellerId",
      fields=[("title","s"),("description","s"),("price","n"),("sku","s"),("sellerId","s"),("active","b")], hidden=[],
      routes=[R("GET","/","list","none"),R("GET","/:id","get","none"),R("POST","/","create","seller"),
              R("PUT","/:id","update","seller","owner"),R("DELETE","/:id","remove","seller","owner")]),
 dict(name="categories", mount="categories", version=1, public=True, entity="Category", table="categories", owner=None,
      fields=[("name","s"),("slug","s"),("parentId","s")], hidden=[],
      routes=[R("GET","/","list","none"),R("GET","/:id","get","none"),R("POST","/","create","admin"),
              R("PUT","/:id","update","admin"),R("DELETE","/:id","remove","admin")]),
 dict(name="inventory", mount="inventory", version=1, public=False, entity="StockItem", table="stock", owner="sellerId",
      fields=[("sku","s"),("quantity","n"),("warehouse","s"),("sellerId","s")], hidden=[],
      routes=[R("GET","/","list","seller","scoped"),R("GET","/:id","get","seller","owner"),R("POST","/","create","seller"),
              R("PUT","/:id","update","seller"),R("DELETE","/:id","remove","seller","owner")]),
 dict(name="orders", mount="orders", version=2, public=False, entity="Order", table="orders", owner="buyerId",
      fields=[("items","a"),("total","n"),("status","s"),("buyerId","s"),("shippingAddress","s")], hidden=[],
      routes=[R("GET","/","list","auth","scoped"),R("GET","/:id","get","auth","owner"),R("POST","/","create","auth"),
              R("PUT","/:id/status","setStatus","auth")],
      custom=dict(create="""
exports.create = async (req, res, next) => {
  try {
    const body = validate(schema.create, req.body);
    const prices = await service.priceItems(body.items);
    const total = prices.reduce((sum, p) => sum + p.unitPrice * p.qty, 0);
    const order = await service.create({ ...body, total, status: 'pending', buyerId: req.user.id });
    await callService('billing', '/reserve', { orderId: order.id, amount: total }, req.user);
    res.status(201).json(toPublic(order));
  } catch (e) { next(e); }
};
""", setStatus="""
exports.setStatus = async (req, res, next) => {
  try {
    const { status } = validate(schema.status, req.body);
    const order = await service.get(req.params.id);
    if (!order) return res.status(404).json({ error: 'not found' });
    order.status = status;
    await service.save(order);
    res.json(toPublic(order));
  } catch (e) { next(e); }
};
"""), extra_schema="exports.status = Joi.object({ status: Joi.string().valid('pending','paid','shipped','delivered','refunded','cancelled').required() });",
      uses_internal=True),
 dict(name="orders_legacy", mount="orders", version=1, public=False, entity="LegacyOrder", table="orders", owner="buyerId",
      fields=[("items","a"),("total","n"),("status","s"),("buyerId","s")], hidden=[],
      routes=[R("GET","/","list","auth"),R("GET","/:id","get","auth"),R("POST","/","create","auth","noval")]),
 dict(name="cart", mount="cart", version=1, public=False, entity="CartItem", table="cart_items", owner="userId",
      fields=[("sku","s"),("qty","n"),("price","n"),("userId","s")], hidden=[],
      routes=[R("GET","/","list","auth","scoped",mw="cache()"),R("POST","/items","addItem","auth"),
              R("DELETE","/items/:id","remove","auth","owner"),R("POST","/checkout","checkout","auth")],
      custom=dict(addItem="""
exports.addItem = async (req, res, next) => {
  try {
    const { sku, qty, price } = req.body;
    const item = await service.create({ sku, qty, price, userId: req.user.id });
    res.status(201).json(toPublic(item));
  } catch (e) { next(e); }
};
""", checkout="""
exports.checkout = async (req, res, next) => {
  try {
    const items = await service.list({ owner: req.user.id }, {});
    const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);
    const charge = await callService('billing', '/charge', { userId: req.user.id, amount: total }, req.user);
    res.json({ total, chargeId: charge.id });
  } catch (e) { next(e); }
};
"""), uses_internal=True),
 dict(name="payments", mount="payments", version=1, public=True, entity="Payment", table="payments", owner="userId",
      fields=[("orderId","s"),("amount","n"),("status","s"),("userId","s")], hidden=[],
      routes=[R("POST","/intent","create","auth"),R("GET","/:id","get","auth","owner"),
              R("POST","/webhook/:provider","webhook","none")],
      custom=dict(webhook="""
const providers = {
  stripe: require('./providers/stripe'),
  paypal: require('./providers/paypal'),
  legacy: require('./providers/legacy'),
};

exports.webhook = async (req, res, next) => {
  try {
    const provider = providers[req.params.provider];
    if (!provider) return res.status(404).json({ error: 'unknown provider' });
    const event = provider.parse(req);
    await service.markPaid(event.orderId);
    res.json({ ok: true });
  } catch (e) { next(e); }
};
""")),
 dict(name="shipping", mount="shipping", version=1, public=True, entity="Shipment", table="shipments", owner="sellerId",
      fields=[("orderId","s"),("trackingCode","s"),("carrier","s"),("recipientName","s"),("address","s"),("sellerId","s")], hidden=[],
      routes=[R("GET","/track/:code","track","none"),R("POST","/","create","seller"),R("PUT","/:id","update","seller","owner")],
      custom=dict(track="""
exports.track = async (req, res, next) => {
  try {
    const shipment = await service.byTrackingCode(req.params.code);
    if (!shipment) return res.status(404).json({ error: 'not found' });
    res.json(shipment);
  } catch (e) { next(e); }
};
""")),
 dict(name="reviews", mount="reviews", version=1, public=True, entity="Review", table="reviews", owner="userId",
      fields=[("productId","s"),("rating","n"),("body","s"),("userId","s")], hidden=[],
      routes=[R("GET","/","list","none"),R("POST","/","create","auth"),R("PUT","/:id","update","auth","owner"),
              R("DELETE","/:id","remove","none")]),
 dict(name="sellers", mount="sellers", version=1, public=False, entity="Seller", table="sellers", owner="userId",
      fields=[("displayName","s"),("bankAccount","s"),("userId","s"),("balance","n")], hidden=["bankAccount"],
      routes=[R("GET","/me","me","seller"),R("PUT","/me","updateMe","seller"),R("POST","/:id/payout","payout","seller"),
              R("GET","/:id/payouts","payouts","seller","owner")],
      custom=dict(me="""
exports.me = async (req, res, next) => {
  try {
    const seller = await service.byUser(req.user.id);
    res.json(toPublic(seller));
  } catch (e) { next(e); }
};
""", updateMe="""
exports.updateMe = async (req, res, next) => {
  try {
    const body = validate(schema.update, req.body);
    const seller = await service.byUser(req.user.id);
    Object.assign(seller, body);
    await service.save(seller);
    res.json(toPublic(seller));
  } catch (e) { next(e); }
};
""", payout="""
exports.payout = async (req, res, next) => {
  try {
    const seller = await service.get(req.params.id);
    if (!seller) return res.status(404).json({ error: 'not found' });
    const result = await service.createPayout(seller);
    res.status(201).json(result);
  } catch (e) { next(e); }
};
""", payouts="""
exports.payouts = async (req, res, next) => {
  try {
    const seller = await service.get(req.params.id);
    if (!seller) return res.status(404).json({ error: 'not found' });
    if (seller.userId !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
    res.json(await service.payoutsFor(seller.id));
  } catch (e) { next(e); }
};
""")),
 dict(name="users", mount="users", version=1, public=True, entity="User", table="users", owner=None,
      fields=[("email","s"),("name","s"),("passwordHash","s"),("role","s"),("resetToken","s"),("isVerified","b"),("phone","s")],
      hidden=["passwordHash","resetToken"],
      routes=[R("POST","/register","register","none"),R("POST","/login","login","none"),R("POST","/forgot","forgot","none"),
              R("GET","/me","me","auth",mw="cache()"),R("GET","/:id","get","auth","raw"),R("PUT","/:id","update","auth","noval")],
      custom=dict(register="""
exports.register = async (req, res, next) => {
  try {
    const body = validate(schema.register, req.body);
    const passwordHash = await bcrypt.hash(body.password, 10);
    const user = await service.create({ email: body.email, name: body.name, passwordHash, role: 'user', isVerified: false });
    res.status(201).json(toPublic(user));
  } catch (e) { next(e); }
};
""", login="""
exports.login = async (req, res, next) => {
  try {
    const { email, password } = validate(schema.login, req.body);
    const user = await service.byEmail(email);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ error: 'invalid credentials' });
    const token = jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, { expiresIn: '90d' });
    res.json({ token });
  } catch (e) { next(e); }
};
""", forgot="""
exports.forgot = async (req, res, next) => {
  try {
    const user = await service.byEmail(req.body.email);
    if (!user) return res.status(404).json({ error: 'unknown email' });
    user.resetToken = crypto.randomBytes(16).toString('hex');
    await service.save(user);
    res.json({ resetToken: user.resetToken });
  } catch (e) { next(e); }
};
""", me="""
exports.me = async (req, res, next) => {
  try {
    res.json(toPublic(await service.get(req.user.id)));
  } catch (e) { next(e); }
};
"""), extra_schema="exports.register = Joi.object({ email: Joi.string().email().required(), name: Joi.string().required(), password: Joi.string().min(8).required() });\nexports.login = Joi.object({ email: Joi.string().email().required(), password: Joi.string().required() });",
      extra_requires="const bcrypt = require('bcryptjs');\nconst jwt = require('jsonwebtoken');\nconst crypto = require('crypto');\nconst config = require('../../config');"),
 dict(name="coupons", mount="coupons", version=1, public=False, entity="Coupon", table="coupons", owner=None,
      fields=[("code","s"),("percent","n"),("active","b"),("usedBy","a")], hidden=["usedBy"],
      routes=[R("GET","/:code","byCode","auth"),R("POST","/apply","apply","auth"),R("POST","/","create","admin"),
              R("DELETE","/:id","remove","admin")],
      custom=dict(byCode="""
exports.byCode = async (req, res, next) => {
  try {
    const coupon = await service.byCode(req.params.code);
    if (!coupon || !coupon.active) return res.status(404).json({ error: 'not found' });
    res.json(toPublic(coupon));
  } catch (e) { next(e); }
};
""", apply="""
exports.apply = async (req, res, next) => {
  try {
    const { code, orderId } = req.body;
    const coupon = await service.byCode(code);
    if (!coupon || !coupon.active) return res.status(404).json({ error: 'invalid coupon' });
    const order = await service.orderFor(orderId);
    order.total = order.total * (100 - coupon.percent) / 100;
    await service.saveOrder(order);
    res.json({ total: order.total });
  } catch (e) { next(e); }
};
""")),
 dict(name="notifications", mount="notifications", version=1, public=False, entity="Notification", table="notifications", owner="userId",
      fields=[("message","s"),("read","b"),("userId","s")], hidden=[],
      routes=[R("GET","/","list","auth","scoped"),R("POST","/:id/read","markRead","auth"),R("POST","/webhook-test","webhookTest","auth")],
      custom=dict(markRead="""
exports.markRead = async (req, res, next) => {
  try {
    const item = await service.get(req.params.id);
    if (!item) return res.status(404).json({ error: 'not found' });
    if (item.userId !== req.user.id) return res.status(403).json({ error: 'forbidden' });
    item.read = true;
    await service.save(item);
    res.json(toPublic(item));
  } catch (e) { next(e); }
};
""", webhookTest="""
exports.webhookTest = async (req, res, next) => {
  try {
    const resp = await axios.post(req.body.url, { ping: true, user: req.user.id }, { timeout: 4000 });
    res.json({ status: resp.status });
  } catch (e) { next(e); }
};
"""), extra_requires="const axios = require('axios');"),
]

# ---------------------------------------------------------------- renderers
GUARD = {"none": "", "auth": "requireAuth, ", "seller": "requireRole('seller'), ", "admin": "requireRole('admin'), "}
SERVICE_EXTRAS = {
 "orders": "exports.priceItems = async (items) => {\n  const out = [];\n  for (const i of items) {\n    const p = await db.findOne('products', { sku: i.sku });\n    out.push({ sku: i.sku, qty: i.qty, unitPrice: p.price });\n  }\n  return out;\n};",
 "shipping": "exports.byTrackingCode = (code) => db.findOne(T, { trackingCode: code });",
 "sellers": "exports.byUser = (userId) => db.findOne(T, { userId });\nexports.createPayout = (seller) => db.insert('payouts', { sellerId: seller.id, amount: seller.balance, status: 'queued' });\nexports.payoutsFor = (sellerId) => db.find('payouts', { sellerId }, {});",
 "users": "exports.byEmail = (email) => db.findOne(T, { email });",
 "coupons": "exports.byCode = (code) => db.findOne(T, { code });\nexports.orderFor = (id) => db.findOne('orders', { id });\nexports.saveOrder = (order) => db.update('orders', order.id, order);",
 "payments": "exports.markPaid = (orderId) => db.update('orders', orderId, { status: 'paid' });",
}
JS_TYPE = {"s": "Joi.string()", "n": "Joi.number()", "b": "Joi.boolean()", "a": "Joi.array()"}

def owner_check(m, flags):
    if "owner" in flags and m["owner"]:
        return f"    if (item.{m['owner']} !== req.user.id && req.user.role !== 'admin') return res.status(403).json({{ error: 'forbidden' }});\n"
    return ""

def std_action(m, r):
    a, fl = r["action"], r["flags"]
    ser = "(x) => x" if "raw" in fl else "toPublic"       # used as a map() callback
    one = "item" if "raw" in fl else "toPublic(item)"     # used for a single item
    oc = owner_check(m, fl)
    if a == "list":
        scope = "{ owner: req.user.id }" if "scoped" in fl else "{}"
        return f"""
exports.list = async (req, res, next) => {{
  try {{
    const {{ limit, offset }} = paginate(req.query);
    const rows = await service.list({scope}, {{ limit, offset }});
    res.json(rows.map({ser}));
  }} catch (e) {{ next(e); }}
}};
"""
    if a == "get":
        return f"""
exports.get = async (req, res, next) => {{
  try {{
    const item = await service.get(req.params.id);
    if (!item) return res.status(404).json({{ error: 'not found' }});
{oc}    res.json({one});
  }} catch (e) {{ next(e); }}
}};
"""
    body = "req.body" if "noval" in fl else "validate(schema.create, req.body)"
    if a == "create":
        own = f", {m['owner']}: req.user.id" if m["owner"] and r["guard"] != "none" else ""
        return f"""
exports.create = async (req, res, next) => {{
  try {{
    const body = {body};
    const item = await service.create({{ ...body{own} }});
    res.status(201).json({one});
  }} catch (e) {{ next(e); }}
}};
"""
    if a == "update":
        ub = "req.body" if "noval" in fl else "validate(schema.update, req.body)"
        return f"""
exports.update = async (req, res, next) => {{
  try {{
    const item = await service.get(req.params.id);
    if (!item) return res.status(404).json({{ error: 'not found' }});
{oc}    Object.assign(item, {ub});
    await service.save(item);
    res.json({one});
  }} catch (e) {{ next(e); }}
}};
"""
    if a == "remove":
        return f"""
exports.remove = async (req, res, next) => {{
  try {{
    const item = await service.get(req.params.id);
    if (!item) return res.status(404).json({{ error: 'not found' }});
{oc}    await service.remove(req.params.id);
    res.status(204).end();
  }} catch (e) {{ next(e); }}
}};
"""
    raise SystemExit("no template for " + a)

def render_module(m):
    d = f"src/modules/{m['name']}"
    put(f"{d}/index.js", f"module.exports = {{ mount: '{m['mount']}', version: {m['version']}, public: {str(m['public']).lower()}, router: require('./routes') }};\n")
    uses_cache = any("cache" in r["mw"] for r in m["routes"])
    rl = ["const router = require('express').Router();", "const ctrl = require('./controller');",
          "const { requireAuth, requireRole } = require('../../lib/auth');"]
    if uses_cache: rl.append("const cache = require('../../lib/cache');")
    rl.append("")
    for r in m["routes"]:
        mw = GUARD[r["guard"]] + (r["mw"] + ", " if r["mw"] else "")
        rl.append(f"router.{r['method'].lower()}('{r['path']}', {mw}ctrl.{r['action']});")
    rl += ["", "module.exports = router;", ""]
    put(f"{d}/routes.js", "\n".join(rl))
    custom = m.get("custom", {})
    head = ["const service = require('./service');", "const { toPublic } = require('./model');",
            "const schema = require('./schema');", "const validate = require('../../lib/validate');",
            "const { paginate } = require('../../lib/pagination');"]
    if m.get("uses_internal"): head.append("const { callService } = require('../../internal/client');")
    if m.get("extra_requires"): head.append(m["extra_requires"])
    body = "\n".join(head) + "\n"
    for r in m["routes"]:
        a = r["action"]
        if a in custom:
            body += custom[a]
        else:
            body += std_action(m, r)
    # custom actions that are not routed twice
    put(f"{d}/controller.js", body)
    extra = SERVICE_EXTRAS.get(m["name"], "")
    own = m["owner"] or ""
    put(f"{d}/service.js", f"""const db = require('../../lib/db');

const T = '{m['table']}';
const OWNER = '{own}';

exports.list = (filter, opts) => db.find(T, filter.owner && OWNER ? {{ [OWNER]: filter.owner }} : {{}}, opts);
exports.get = (id) => db.findOne(T, {{ id }});
exports.create = (data) => db.insert(T, data);
exports.save = (item) => db.update(T, item.id, item);
exports.remove = (id) => db.remove(T, id);
{extra}
""")
    fields = ", ".join(f"'{f}'" for f, _ in m["fields"])
    hidden = ", ".join(f"'{h}'" for h in m["hidden"])
    put(f"{d}/model.js", f"""const FIELDS = [{fields}];
const HIDDEN = [{hidden}];

exports.toPublic = (item) => {{
  const out = {{ id: item.id }};
  for (const f of FIELDS) if (!HIDDEN.includes(f)) out[f] = item[f];
  return out;
}};
""")
    writable = [(f, t) for f, t in m["fields"] if f != m["owner"] and f not in m["hidden"] and f not in ("role", "isVerified", "balance")]
    cr = ",\n".join(f"  {f}: {JS_TYPE[t]}{'.required()' if i == 0 else ''}" for i, (f, t) in enumerate(writable))
    up = ",\n".join(f"  {f}: {JS_TYPE[t]}" for f, t in writable)
    put(f"{d}/schema.js", f"""const Joi = require('joi');

const opts = {{ stripUnknown: true }};
exports.create = Joi.object({{
{cr}
}}).options(opts);
exports.update = Joi.object({{
{up}
}}).options(opts);
{m.get('extra_schema', '')}
""")

for m in MODULES:
    render_module(m)

# payments providers
put("src/modules/payments/providers/stripe.js", """const crypto = require('crypto');

exports.parse = (req) => {
  const given = req.get('stripe-signature') || '';
  const expected = crypto.createHmac('sha256', process.env.STRIPE_WEBHOOK_SECRET || '').update(JSON.stringify(req.body)).digest('hex');
  if (given.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected))) {
    const err = new Error('bad signature');
    err.status = 401;
    throw err;
  }
  return { orderId: req.body.data.orderId };
};
""")
put("src/modules/payments/providers/paypal.js", """const crypto = require('crypto');

exports.parse = (req) => {
  const given = req.get('paypal-transmission-sig') || '';
  const expected = crypto.createHmac('sha256', process.env.PAYPAL_WEBHOOK_SECRET || '').update(JSON.stringify(req.body)).digest('base64');
  if (given.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected))) {
    const err = new Error('bad signature');
    err.status = 401;
    throw err;
  }
  return { orderId: req.body.resource.custom_id };
};
""")
put("src/modules/payments/providers/legacy.js", """// Old gateway callback format: { orderId, status }
exports.parse = (req) => ({ orderId: req.body.orderId });
""")

# ---- hand-written modules: admin / search / uploads
put("src/modules/admin/index.js", "module.exports = { mount: 'admin', version: 1, public: false, router: require('./routes') };\n")
put("src/modules/admin/routes.js", """const router = require('express').Router();
const ctrl = require('./controller');
const { requireRole } = require('../../lib/auth');

router.get('/stats', ctrl.stats);

router.use(requireRole('admin'));

router.get('/users/export', ctrl.exportUsers);
router.get('/audit', ctrl.audit);
router.post('/plugins/load', ctrl.loadPlugin);
// router.delete('/users/:id', ctrl.hardDelete);   // removed in v2

module.exports = router;
""")
put("src/modules/admin/controller.js", """const db = require('../../lib/db');
const plugins = require('../../plugins/loader');

exports.stats = async (req, res, next) => {
  try {
    const [revenue] = await db.query('SELECT COALESCE(SUM(total), 0) AS revenue, COUNT(*) AS orders FROM orders WHERE status = $1', ['paid']);
    res.json(revenue);
  } catch (e) { next(e); }
};

exports.exportUsers = async (req, res, next) => {
  try {
    const users = await db.find('users', {}, {});
    res.json(users.map((u) => ({ id: u.id, email: u.email, role: u.role })));
  } catch (e) { next(e); }
};

exports.audit = async (req, res, next) => {
  try {
    res.json(await db.find('audit_log', {}, { limit: 200, offset: 0 }));
  } catch (e) { next(e); }
};

exports.loadPlugin = async (req, res, next) => {
  try {
    res.json({ loaded: plugins.loadPlugin(req.body.name) });
  } catch (e) { next(e); }
};
""")
put("src/modules/search/index.js", "module.exports = { mount: 'search', version: 1, public: true, router: require('./routes') };\n")
put("src/modules/search/routes.js", """const router = require('express').Router();
const ctrl = require('./controller');

router.get('/', ctrl.search);

module.exports = router;
""")
put("src/modules/search/controller.js", """const db = require('../../lib/db');

exports.search = async (req, res, next) => {
  try {
    const q = String(req.query.q || '');
    const sort = req.query.sort || 'id';
    const rows = await db.query(
      `SELECT id, title, price FROM products WHERE active = true AND title ILIKE $1 ORDER BY ${sort} LIMIT 50`,
      [`%${q}%`],
    );
    res.json(rows);
  } catch (e) { next(e); }
};
""")
put("src/modules/uploads/index.js", "module.exports = { mount: 'uploads', version: 1, public: false, router: require('./routes') };\n")
put("src/modules/uploads/routes.js", """const router = require('express').Router();
const multer = require('multer');
const ctrl = require('./controller');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/', upload.single('file'), ctrl.save);

module.exports = router;
""")
put("src/modules/uploads/controller.js", """const fs = require('fs');
const path = require('path');
const config = require('../../config');

exports.save = async (req, res, next) => {
  try {
    const dest = path.join(config.uploadDir, req.body.path || req.file.originalname);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, req.file.buffer);
    res.status(201).json({ url: `/files/${path.relative(config.uploadDir, dest)}` });
  } catch (e) { next(e); }
};
""")

# ---------------------------------------------------------------- app skeleton / libs
put("package.json", json.dumps({
  "name": "marketplace-api", "version": "2.3.0", "main": "src/server.js",
  "scripts": {"start": "node src/server.js", "test": "jest"},
  "dependencies": {"axios": "^1.7.2", "bcryptjs": "^2.4.3", "express": "^4.19.2", "express-graphql": "^0.12.0",
                   "graphql": "^15.8.0", "joi": "^17.13.1", "jsonwebtoken": "^9.0.2", "multer": "^1.4.5-lts.1",
                   "node-cron": "^3.0.3", "pg": "^8.11.5"}}, indent=2) + "\n")
put("src/server.js", """const app = require('./app');
const config = require('./config');

app.listen(config.port, () => console.log(`marketplace api listening on ${config.port}`));
""")
put("src/app.js", """const express = require('express');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const { authenticate, requireAuth } = require('./lib/auth');
const requestId = require('./middleware/requestId');
const cors = require('./middleware/cors');
const logging = require('./middleware/logging');
const errorHandler = require('./middleware/errorHandler');
const graphql = require('./graphql');
const rpc = require('./rpc');
const plugins = require('./plugins/loader');

const app = express();
app.use(requestId);
app.use(cors);
app.use(express.json());
app.use(logging);
app.use(authenticate);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// every directory under src/modules is a feature module: { mount, version, public, router }
const modulesDir = path.join(__dirname, 'modules');
for (const name of fs.readdirSync(modulesDir)) {
  const meta = require(path.join(modulesDir, name));
  const base = `/api/v${meta.version}/${meta.mount}`;
  app.use(base, ...(meta.public ? [] : [requireAuth]), meta.router);
}

app.use('/files', express.static(config.uploadDir));
app.use('/graphql', graphql);
app.use('/rpc', rpc);

plugins.loadAll();
app.use(errorHandler);

module.exports = app;
""")
put("src/config/index.js", """const path = require('path');

module.exports = {
  port: process.env.PORT || 4000,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || 'dev',
  uploadDir: path.join(__dirname, '..', '..', 'uploads'),
  pluginsDir: path.join(__dirname, '..', 'plugins'),
};
""")
put("src/config/services.js", """module.exports = {
  billing: process.env.BILLING_URL || 'http://billing-svc:8080',
  warehouse: process.env.WAREHOUSE_URL || 'http://warehouse-svc:8080',
};
""")
put("src/lib/auth.js", """const jwt = require('jsonwebtoken');
const config = require('../config');

function authenticate(req, res, next) {
  // service-to-service calls carry the shared token plus the acting user id
  const internal = req.get('x-internal-call') === process.env.INTERNAL_TOKEN;
  if (internal) {
    req.user = { id: req.get('x-internal-user'), role: 'service' };
    return next();
  }
  const header = req.get('authorization') || '';
  if (header.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(header.slice(7), config.jwtSecret);
      req.user.id = req.user.sub;
    } catch (e) {
      // treated as anonymous
    }
  }
  next();
}

function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'unauthorized' });
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'unauthorized' });
    if (req.user.role === 'service' || req.user.role === 'admin' || roles.includes(req.user.role)) return next();
    res.status(403).json({ error: 'forbidden' });
  };
}

module.exports = { authenticate, requireAuth, requireRole };
""")
put("src/lib/db.js", """const { Pool } = require('pg');
const config = require('../config');

const pool = new Pool({ connectionString: config.databaseUrl });

const query = async (sql, params = []) => (await pool.query(sql, params)).rows;

const find = (table, where = {}, { limit = 50, offset = 0 } = {}) => {
  const keys = Object.keys(where);
  const clause = keys.length ? 'WHERE ' + keys.map((k, i) => `"${k}" = $${i + 1}`).join(' AND ') : '';
  return query(`SELECT * FROM ${table} ${clause} LIMIT ${Number(limit)} OFFSET ${Number(offset)}`, keys.map((k) => where[k]));
};
const findOne = async (table, where) => (await find(table, where, { limit: 1 }))[0];
const insert = async (table, data) => {
  const keys = Object.keys(data);
  const rows = await query(`INSERT INTO ${table} (${keys.map((k) => `"${k}"`).join(',')}) VALUES (${keys.map((_, i) => `$${i + 1}`).join(',')}) RETURNING *`, keys.map((k) => data[k]));
  return rows[0];
};
const update = async (table, id, data) => {
  const keys = Object.keys(data).filter((k) => k !== 'id');
  const rows = await query(`UPDATE ${table} SET ${keys.map((k, i) => `"${k}" = $${i + 1}`).join(',')} WHERE id = $${keys.length + 1} RETURNING *`, [...keys.map((k) => data[k]), id]);
  return rows[0];
};
const remove = (table, id) => query(`DELETE FROM ${table} WHERE id = $1`, [id]);

module.exports = { query, find, findOne, insert, update, remove };
""")
put("src/lib/validate.js", """module.exports = (schema, payload) => {
  const { value, error } = schema.validate(payload);
  if (error) {
    const err = new Error(error.message);
    err.status = 400;
    throw err;
  }
  return value;
};
""")
put("src/lib/pagination.js", """exports.paginate = (query) => {
  const limit = Math.min(parseInt(query.limit, 10) || 20, 100);
  const offset = Math.max(parseInt(query.offset, 10) || 0, 0);
  return { limit, offset };
};
""")
put("src/lib/cache.js", """const store = new Map();

// short-lived response cache for expensive GETs
module.exports = (ttlMs = 30000) => (req, res, next) => {
  const key = req.originalUrl;
  const hit = store.get(key);
  if (hit && hit.expires > Date.now()) return res.json(hit.body);
  const json = res.json.bind(res);
  res.json = (body) => {
    store.set(key, { body, expires: Date.now() + ttlMs });
    return json(body);
  };
  next();
};
""")
put("src/lib/logger.js", """exports.info = (msg, meta = {}) => console.log(JSON.stringify({ level: 'info', msg, ...meta }));
exports.error = (msg, meta = {}) => console.error(JSON.stringify({ level: 'error', msg, ...meta }));
""")
put("src/lib/errors.js", """class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
module.exports = { HttpError };
""")
put("src/middleware/requestId.js", """const crypto = require('crypto');

module.exports = (req, res, next) => {
  req.id = req.get('x-request-id') || crypto.randomUUID();
  res.set('x-request-id', req.id);
  next();
};
""")
put("src/middleware/cors.js", """module.exports = (req, res, next) => {
  res.set('access-control-allow-origin', req.get('origin') || '*');
  res.set('access-control-allow-credentials', 'true');
  res.set('access-control-allow-headers', 'authorization, content-type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  next();
};
""")
put("src/middleware/logging.js", """const logger = require('../lib/logger');

module.exports = (req, res, next) => {
  logger.info('request', { id: req.id, method: req.method, url: req.originalUrl, headers: req.headers });
  next();
};
""")
put("src/middleware/errorHandler.js", """const logger = require('../lib/logger');

module.exports = (err, req, res, next) => {
  logger.error('unhandled', { id: req.id, message: err.message });
  res.status(err.status || 500).json({ error: err.message, stack: err.stack });
};
""")
put("src/middleware/rateLimit.js", """const hits = new Map();

// fixed-window limiter: 100 requests / minute / ip
module.exports = (req, res, next) => {
  const key = req.ip;
  const now = Date.now();
  const entry = hits.get(key) || { count: 0, reset: now + 60000 };
  if (entry.reset < now) { entry.count = 0; entry.reset = now + 60000; }
  entry.count += 1;
  hits.set(key, entry);
  if (entry.count > 100) return res.status(429).json({ error: 'too many requests' });
  next();
};
""")
put("src/internal/client.js", """const axios = require('axios');
const services = require('../config/services');

// calls a sibling service; identity is forwarded in headers
exports.callService = async (name, path, body, user) => {
  const resp = await axios.post(`${services[name]}${path}`, body, {
    headers: { 'x-internal-call': process.env.INTERNAL_TOKEN, 'x-internal-user': user.id },
    timeout: 5000,
  });
  return resp.data;
};
""")

# ---- GraphQL
put("src/graphql/index.js", """const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const typeDefs = require('./schema');
const rootValue = require('./resolvers');

module.exports = graphqlHTTP((req) => ({
  schema: buildSchema(typeDefs),
  rootValue,
  context: { user: req.user },
  graphiql: true,
}));
""")
put("src/graphql/schema.js", """module.exports = `
  directive @admin on FIELD_DEFINITION

  type Product { id: ID!, title: String!, price: Float!, sellerId: ID }
  type User { id: ID!, email: String!, name: String, role: String, phone: String, passwordHash: String }
  type Order { id: ID!, buyerId: ID!, total: Float!, status: String! }
  type Review { id: ID!, productId: ID!, rating: Int!, body: String }

  input UserInput { name: String, phone: String, role: String }

  type Query {
    product(id: ID!): Product
    products(limit: Int): [Product!]!
    me: User
    user(id: ID!): User
    orders: [Order!]!
    order(id: ID!): Order
    allOrders: [Order!]! @admin
  }

  type Mutation {
    createOrder(items: [String!]!): Order
    cancelOrder(id: ID!): Order
    updateUser(id: ID!, input: UserInput!): User
    addReview(productId: ID!, rating: Int!, body: String): Review
  }
`;
""")
put("src/graphql/resolvers/index.js", """module.exports = {
  ...require('./catalog'),
  ...require('./users'),
  ...require('./orders'),
  ...require('./reviews'),
};
""")
put("src/graphql/resolvers/catalog.js", """const db = require('../../lib/db');

module.exports = {
  product: ({ id }) => db.findOne('products', { id }),
  products: ({ limit }) => db.find('products', { active: true }, { limit: Math.min(limit || 20, 100) }),
};
""")
put("src/graphql/resolvers/users.js", """const db = require('../../lib/db');

module.exports = {
  me: (args, ctx) => (ctx.user ? db.findOne('users', { id: ctx.user.id }) : null),
  user: ({ id }) => db.findOne('users', { id }),
  updateUser: ({ id, input }) => db.update('users', id, input),
};
""")
put("src/graphql/resolvers/orders.js", """const db = require('../../lib/db');

module.exports = {
  orders: (args, ctx) => db.find('orders', { buyerId: ctx.user.id }),
  order: async ({ id }, ctx) => {
    const order = await db.findOne('orders', { id });
    return order && order.buyerId === ctx.user.id ? order : null;
  },
  allOrders: () => db.find('orders', {}, { limit: 1000 }),
  createOrder: ({ items }, ctx) => db.insert('orders', { buyerId: ctx.user.id, items: JSON.stringify(items), total: 0, status: 'pending' }),
  cancelOrder: async ({ id }, ctx) => {
    const order = await db.findOne('orders', { id });
    if (!order || order.buyerId !== ctx.user.id) return null;
    return db.update('orders', id, { status: 'cancelled' });
  },
};
""")
put("src/graphql/resolvers/reviews.js", """const db = require('../../lib/db');

module.exports = {
  addReview: ({ productId, rating, body }, ctx) => db.insert('reviews', { productId, rating, body, userId: ctx.user.id }),
};
""")

# ---- RPC (handlers are discovered from the directory)
put("src/rpc/index.js", """const router = require('express').Router();
const { requireAuth } = require('../lib/auth');
const handlers = require('./handlers');

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const fn = handlers[req.body.action];
    if (!fn) return res.status(404).json({ error: 'unknown action' });
    res.json(await fn(req.user, req.body.params || {}));
  } catch (e) { next(e); }
});

module.exports = router;
""")
put("src/rpc/handlers/index.js", """const fs = require('fs');

// every sibling file exports { 'namespace.action': handler }
const handlers = {};
for (const file of fs.readdirSync(__dirname)) {
  if (file === 'index.js') continue;
  Object.assign(handlers, require(`./${file}`));
}
module.exports = handlers;
""")
put("src/rpc/handlers/catalog.js", """const db = require('../../lib/db');

module.exports = {
  'catalog.get': (user, { id }) => db.findOne('products', { id }),
};
""")
put("src/rpc/handlers/orders.js", """const db = require('../../lib/db');

module.exports = {
  'orders.get': async (user, { id }) => {
    const order = await db.findOne('orders', { id });
    if (!order || (order.buyerId !== user.id && user.role !== 'admin')) throw Object.assign(new Error('forbidden'), { status: 403 });
    return order;
  },
  'orders.cancel': async (user, { id }) => {
    const order = await db.findOne('orders', { id });
    if (!order || order.buyerId !== user.id) throw Object.assign(new Error('forbidden'), { status: 403 });
    return db.update('orders', id, { status: 'cancelled' });
  },
};
""")
put("src/rpc/handlers/users.js", """const db = require('../../lib/db');

module.exports = {
  // admin console action
  'users.setRole': (user, { id, role }) => db.update('users', id, { role }),
};
""")
put("src/rpc/handlers/debug.js", """const db = require('../../lib/db');

module.exports = {
  'debug.exportTable': (user, { table }) => db.query(`SELECT * FROM ${table} LIMIT 1000`),
};
""")

# ---- plugins
put("src/plugins/loader.js", """const fs = require('fs');
const path = require('path');
const config = require('../config');

const loaded = {};

exports.loadPlugin = (name) => {
  const file = path.join(config.pluginsDir, name);
  loaded[name] = require(file);
  return name;
};

exports.loadAll = () => {
  for (const f of fs.readdirSync(config.pluginsDir)) {
    if (f === 'loader.js') continue;
    exports.loadPlugin(f);
  }
};
""")
put("src/plugins/audit-log.js", """const db = require('../lib/db');

module.exports = { record: (actor, action) => db.insert('audit_log', { actor, action }) };
""")
put("src/plugins/metrics.js", """const counters = {};

module.exports = { inc: (name) => { counters[name] = (counters[name] || 0) + 1; }, snapshot: () => ({ ...counters }) };
""")

# ---- jobs (never required by server.js)
put("src/jobs/index.js", """const cron = require('node-cron');
const cleanup = require('./cleanup');
const reminders = require('./reminders');
const reports = require('./reports');

cron.schedule('0 * * * *', cleanup.expireCarts);
cron.schedule('*/15 * * * *', reminders.abandonedCarts);
cron.schedule('0 3 * * *', reports.dailyRevenue);
""")
put("src/jobs/cleanup.js", """const db = require('../lib/db');

exports.expireCarts = () => db.query("DELETE FROM cart_items WHERE created_at < now() - interval '7 days'");
""")
put("src/jobs/reminders.js", """const db = require('../lib/db');

exports.abandonedCarts = async () => {
  const rows = await db.query("SELECT DISTINCT \\"userId\\" FROM cart_items WHERE created_at < now() - interval '1 day'");
  for (const r of rows) await db.insert('notifications', { userId: r.userId, message: 'You left items in your cart', read: false });
};
""")
put("src/jobs/reports.js", """const db = require('../lib/db');

exports.dailyRevenue = () => db.query("INSERT INTO daily_revenue SELECT now()::date, SUM(total) FROM orders WHERE status = 'paid'");
""")

# ---- tests
for n, body in [
 ("auth", "describe('auth', () => { test('requireAuth rejects anonymous', () => expect(true).toBe(true)); });"),
 ("orders", "describe('orders', () => { test('total is computed server side', () => expect(true).toBe(true)); });"),
 ("catalog", "describe('catalog', () => { test('public read', () => expect(true).toBe(true)); });"),
 ("search", "describe('search', () => { test('returns active products', () => expect(true).toBe(true)); });"),
 ("rpc", "describe('rpc', () => { test('unknown action is 404', () => expect(true).toBe(true)); });"),
]:
    put(f"test/{n}.test.js", body + "\n")

# ---------------------------------------------------------------- ground truth
def fullpath(m, p):
    return f"/api/v{m['version']}/{m['mount']}" + ("" if p == "/" else p)

eps = []
for m in MODULES:
    for r in m["routes"]:
        eps.append((r["method"], fullpath(m, r["path"])))
eps += [("GET", "/api/v1/admin/stats"), ("GET", "/api/v1/admin/users/export"), ("GET", "/api/v1/admin/audit"),
        ("POST", "/api/v1/admin/plugins/load"), ("GET", "/api/v1/search"), ("POST", "/api/v1/uploads"),
        ("GET", "/files"), ("GET", "/health"), ("POST", "/graphql"), ("POST", "/rpc")]
endpoints = [{"id": f"E{i+1}", "method": m, "path": p} for i, (m, p) in enumerate(eps)]

def F(i, sev, ow, title, near=None, any_=None, also=None):
    d = {"id": i, "severity": sev, "owasp": ow, "title": title}
    if near: d["near"] = near
    if any_: d["any"] = any_
    if also: d["also"] = also
    return d
def T(i, title, near=None, any_=None, also=None):
    d = {"id": i, "title": title}
    if near: d["near"] = near
    if any_: d["any"] = any_
    if also: d["also"] = also
    return d

findings = [
 F("F1","critical","API2","authenticate(): `req.get('x-internal-call') === process.env.INTERNAL_TOKEN` — if INTERNAL_TOKEN is unset (config never loads .env/dotenv) both sides are undefined, so EVERY request is treated as an internal service call (role 'service' passes every guard); even when set it is a spoofable shared header",
   near=[r"(x-internal-call|INTERNAL_TOKEN)", r"(undefined|미설정|unset|우회|bypass|스푸핑|spoof|dotenv|위조|모든 요청)", 500]),
 F("F2","critical","API6/API2","POST /api/v1/payments/webhook/legacy: the legacy provider parse() does no signature check at all, so anyone can mark any order paid (stripe/paypal do verify a signature, but see F29)",
   near=[r"(webhook/:provider|webhook/legacy|legacy provider|providers/legacy|legacy)", r"(서명|signature|검증|unverified|무인증|인증 없|미검증)", 500]),
 F("F3","critical","API5","RPC action users.setRole is callable by any authenticated user (requireAuth only; no per-action authorization) => self-service admin",
   near=[r"users\.setRole", r"(권한|role|authz|admin|escalation|승격|가드|무인증|검증|any|누구나)", 500]),
 F("F4","critical","API8","RPC action debug.exportTable builds `SELECT * FROM ${table}` from a client-supplied table name => full database dump / SQL injection for any authenticated user",
   near=[r"debug\.exportTable", r"(SQL|exfil|전체|dump|덤프|테이블|table|인젝션|injection)", 500]),
 F("F5","critical","API3","PUT /api/v1/users/:id skips validation (req.body assigned wholesale) => a user can set role/isVerified on their own record (owner check exists but mass assignment remains)",
   any_=[r"PUT[^\n]{0,80}users/:id[^\n]{0,300}(role|mass|권한|승격|escalat)|users/:id[^\n]{0,80}PUT[^\n]{0,300}(role|mass|권한|승격|escalat)"]),
 F("F6","critical","API3/API2","POST /api/v1/users/forgot returns the reset token in the response (account takeover for any email)",
   near=[r"forgot", r"(token|토큰|응답|response|탈취|takeover)", 400]),
 F("F7","high","API3","GET /api/v1/users/:id returns the raw user row incl. passwordHash/resetToken (serializer bypassed)",
   near=[r"(users/:id|/users/)", r"(passwordHash|resetToken|해시|raw|직렬화|serializ)", 500]),
 F("F8","high","API1/API9","Legacy v1 orders module is unscoped (lists all orders, no owner check, unvalidated create) next to the correct v2 module",
   near=[r"(api/v1/orders|orders_legacy|legacy)", r"(BOLA|IDOR|소유자|owner|scope|스코프|전체|all orders|legacy|v2)", 500]),
 F("F9","high","API5","PUT /api/v2/orders/:id/status has no role/ownership check: any authenticated user can set any order to paid/refunded/delivered",
   near=[r"orders/:id/status", r"(role|권한|buyer|구매자|가드|any|누구나|소유자|owner|검증)", 500]),
 F("F10","high","API6","POST /api/v1/cart/items stores a client-supplied price and checkout totals from those stored prices",
   near=[r"(cart/items|addItem)", r"(price|가격)", 400], also=[r"(client|클라이언트|body|신뢰|trust)"],
   any_=[r"[Cc]lient-supplied (cart )?price|cart[^\n]{0,160}price[^\n]{0,160}(client|body|클라이언트)"]),
 F("F11","high","API6","POST /api/v1/coupons/apply has no single-use / per-user / stacking limit: repeated calls compound the discount (negative totals)",
   near=[r"(coupons/apply|/apply)", r"(single|한 번|1회|중복|stack|재사용|reuse|무제한|unlimited|usedBy|누적|반복)", 500],
   any_=[r"coupon[^\n]{0,250}(one-time|used-once|once|single-use|usedBy|1회|일회)"]),
 F("F12","high","API1","PUT /api/v1/inventory/:id has no owner check: any seller edits any seller's stock",
   near=[r"inventory", r"(owner|소유자|BOLA|IDOR|타 판매자|다른 판매자|sellerId)", 500]),
 F("F13","high","API1","POST /api/v1/sellers/:id/payout: any seller can trigger a payout for any other seller (no owner check)",
   near=[r"payout", r"(owner|소유자|BOLA|IDOR|다른 판매자|타 판매자|임의)", 500]),
 F("F14","high","API5","DELETE /api/v1/reviews/:id has no guard at all (module is public and this route omits requireAuth)",
   any_=[r"DELETE[^\n]{0,80}reviews[^\n]{0,250}(무인증|unauth|가드 없|인증 없|no guard|공개|anonymous|인증 불필요)|reviews[^\n]{0,80}DELETE[^\n]{0,250}(무인증|unauth|가드 없|인증 없|no guard|공개|anonymous|인증 불필요)"]),
 F("F15","high","API5","GET /api/v1/admin/stats is registered BEFORE router.use(requireRole('admin')) => reachable by any authenticated user (middleware order)",
   near=[r"(admin/stats|/stats)", r"(순서|order|before|이전|앞|requireRole|가드|any authenticated|일반|누구나)", 500]),
 F("F16","high","API3/API1","GET /api/v1/shipping/track/:code is public and returns the whole shipment incl. recipient name and address (enumerable tracking codes)",
   near=[r"(shipping/track|/track/)", r"(address|주소|PII|열거|enumerat|공개|무인증|public|recipient)", 500]),
 F("F17","high","API4/CWE-22","POST /api/v1/uploads writes to a client-supplied req.body.path (traversal), has no size/type limit, and the directory is served at /files (stored XSS)",
   near=[r"(uploads|req\.body\.path)", r"(traversal|경로 조작|\.\./|크기|size|XSS|static|정적)", 500]),
 F("F18","high","API8","GET /api/v1/search: q is parameterised but the `sort` query parameter is concatenated into ORDER BY (SQL injection)",
   near=[r"(search|ORDER BY)", r"(sort|SQL|인젝션|injection)", 400], also=[r"(ORDER BY|sort)"]),
 F("F19","high","API7","POST /api/v1/notifications/webhook-test requests a user-supplied URL (SSRF)",
   near=[r"webhook-test", r"(SSRF|API7)", 400], any_=[r"SSRF[^\n]{0,200}(webhook-test|notifications|callback|user-supplied|any URL)|(webhook-test|notifications/controller)[^\n]{0,250}SSRF"]),
 F("F20","high","API1/API3","cache() keys responses by originalUrl only and is applied to /users/me and /cart => the first caller's private data is served to everyone for 30s",
   near=[r"(cache|캐시)", r"(URL|originalUrl|사용자|user|cross|교차|공유|key|키)", 400], also=[r"(users/me|/cart|cart)"]),
 F("F21","high","API5","GraphQL: `allOrders` is marked @admin but the directive has no implementation (buildSchema ignores it) => any user lists all orders; user(id) has no owner check; updateUser accepts role in input (mass assignment)",
   near=[r"(@admin|allOrders)", r"(directive|디렉티브|구현|enforce|무효|미적용|any|누구나|ignored|무시)", 500]),
 F("F22","medium","API4","GraphQL: introspection/GraphiQL enabled and no depth/complexity limits",
   near=[r"(GraphQL|graphql)", r"(introspection|GraphiQL|depth|complexity|깊이|복잡도)", 500]),
 F("F23","medium","API4","middleware/rateLimit.js exists but is never mounted => no rate limiting anywhere (login, forgot, rpc)",
   near=[r"rateLimit", r"(mount|미사용|never|사용되지|dead|등록되지|적용되지|unused|연결되지)", 400]),
 F("F24","medium","API8","POST /api/v1/admin/plugins/load: name is joined into require(path) unsanitised (path traversal / arbitrary module load; admin-only)",
   near=[r"(plugins/load|loadPlugin)", r"(traversal|경로|require|임의|RCE|path)", 400]),
 F("F25","high","API8","tracked .env + hardcoded AWS-style key in orphan src/lib/s3legacy.js (values must not be shown)",
   near=[r"\.env", r"(git|추적|tracked)", 400], also=[r"(AKIA|AWS)[^\n]{0,200}s3legacy|s3legacy[^\n]{0,200}(AKIA|AWS)"]),
 F("F26","medium","API2","JWT: jwt.verify without algorithms pinned, secret falls back to 'dev', tokens live 90 days, no revocation",
   near=[r"(jwt\.verify|jwtSecret|JWT)", r"(algorithms|dev|90|fallback|폴백|만료|expir)", 300]),
 F("F27","medium","API8","logging middleware logs full request headers (incl. Authorization); CORS reflects any Origin with credentials",
   near=[r"(logging|logger)", r"(authorization|headers|헤더|토큰|민감)", 400]),
 F("F28","medium","API8","errorHandler returns err.stack to every client",
   near=[r"errorHandler", r"(stack|스택)", 400]),
 F("F29","high","API2/API6","stripe/paypal webhook HMAC is keyed with `process.env.X || ''`: because config never loads .env, an unset secret makes the expected signature computable by anyone (forgeable); it also signs JSON.stringify(req.body) (re-serialised, not the raw body) and has no replay protection. Found by a run, not planted on purpose — still a real flaw in the code.",
   near=[r"(stripe|paypal)", r"(''|빈 키|폴백|fallback|forg|위조|re-serial|JSON\.stringify|replay|재전송)", 500]),
 F("F30","medium","API6","POST /api/v2/orders: `items` is validated only as an array (Joi.array()), so qty can be zero or negative and shrink/negate the server-computed total. Found by a run, not planted on purpose — still a real flaw in the code.",
   near=[r"(수량|quantity|qty)", r"(검증|validat|negative|음수|unchecked|미검증|범위|bound)", 400]),
]
facts = [
 T("T1","Routes are mounted dynamically: app.js reads src/modules and mounts /api/v{version}/{mount}; `public` modules skip the global requireAuth and rely on per-route guards",
   near=[r"(readdirSync|동적|dynamic|디렉토리|자동)", r"(modules|mount|마운트)", 400],
   any_=[r"(every|each) directory (in|under) `?src/modules|mount rule|디렉토리[^\n]{0,30}마운트"]),
 T("T2","The `public` module flag semantics (catalog, categories, shipping, reviews, payments, users, search skip global auth) are explained",
   near=[r"public", r"(route|라우트|개별|per-route|route-level|라우트 단위)", 400]),
 T("T3","v1 (legacy) and v2 orders coexist under /api/v1/orders and /api/v2/orders",
   near=[r"(v2|/api/v2/orders)", r"(v1|legacy)", 300]),
 T("T4","stripe/paypal webhooks DO verify an HMAC signature with timingSafeEqual (unlike the legacy provider); weakness notes (empty-key fallback, re-serialised body, no replay protection) are valid extras, but they must not be reported as having no signature check",
   near=[r"(stripe|paypal)", r"(HMAC|timingSafeEqual|서명 검증|signature)", 500]),
 T("T5","Runnability = conditional (DATABASE_URL, secrets from env; no dotenv loader)",
   near=[r"(DATABASE_URL|dotenv)", r"(조건부|conditional)", 500], also=[r"(조건부|conditional)"]),
 T("T6","jobs/index.js (cron) is never required by server.js/app.js => scheduled jobs never run",
   near=[r"jobs", r"(require|never|미사용|사용되지|dead|연결되지|등록되지|서버)", 400], also=[r"(jobs/index|cron)"]),
 T("T7","Large-repo path: per-module analysis mentioned and merged into one numbering",
   near=[r"(분할|모듈 단위|per[- ]module|per[- ]app|module passes|module-by-module|split|partition)", r"(분석|analy|병합|merge|consolidat)", 300]),
 T("T8","RPC: one POST /rpc dispatches by req.body.action to handlers discovered from src/rpc/handlers (actions enumerated)",
   near=[r"(rpc|RPC)", r"(action|디스패치|dispatch|handlers)", 400], also=[r"(catalog\.get|orders\.get|orders\.cancel|users\.setRole|debug\.exportTable)"]),
 T("T9","GraphQL operations enumerated (queries: product, products, me, user, orders, order, allOrders; mutations: createOrder, cancelOrder, updateUser, addReview)",
   near=[r"(allOrders|updateUser)", r"(Query|Mutation|resolver)", 300]),
 T("T10","Plugins are loaded from src/plugins at startup via require (loader.loadAll)",
   near=[r"(plugins|loadAll)", r"(require|loader|플러그인)", 300]),
]
manual = [
 "catalog and categories are public for reads but writes are guarded (seller + owner check / admin): they must NOT be reported as unguarded.",
 "orders v2: list is scoped to req.user.id and create computes the total server-side from catalog prices (priceItems): must NOT be reported as client-trusted price or BOLA. Only PUT /:id/status is the v2 flaw.",
 "users: register forces role='user' and validates input (safe); only PUT /users/:id (no validation) and forgot/GET /:id are flawed.",
 "payments: stripe and paypal DO verify a signature (HMAC + timingSafeEqual); only the legacy provider has no verification at all. Noting that the stripe/paypal key falls back to '' when the env var is unset (forgeable), that the HMAC covers re-serialised JSON, or that there is no replay protection is a VALID extra finding (F29) — but saying they are 'unverified/unauthenticated' like legacy is wrong.",
 "Most generated modules have owner checks: the report must not claim blanket BOLA; it must pinpoint inventory PUT, sellers payout, legacy orders, and users GET /:id.",
 "The shared 'x-internal-call' bypass (F1) depends on INTERNAL_TOKEN being unset because config never loads .env: the report should explain the undefined===undefined condition or at least flag the spoofable header.",
 "Numbering: with ~140 files / ~75 endpoints, E-/F- ids must be one continuous scheme with no duplicates or gaps and one commit hash (split-analysis merge quality).",
 "No invented endpoints: the route table should list 63 entries (53 module routes + admin 4, search, uploads, health, graphql, rpc, /files static); GraphQL operations and RPC actions are separate inventories.",
 "Severity consistency: one flaw => one icon; bulk PII exposure and auth bypass are Critical, single-record BOLA High.",
]
expected = {"fixture": "marketplace",
  "notes": "Express monorepo (~140 files) with filesystem-mounted modules, per-module 'public' flag, RPC dispatch by action name, GraphQL with an unimplemented @admin directive, plugin loader, service-to-service calls, dead cron/rate-limit code. Generated by eval/tools/gen_marketplace.py.",
  "endpoints": endpoints, "findings": findings, "facts": facts,
  "leaks": ["EVALFIXTUREFAKE", "AKIAEVAL", "sk_live_EVAL"], "manual": manual}

# ---------------------------------------------------------------- write
if os.path.isdir(OUT):
    shutil.rmtree(OUT)
for rel, content in files.items():
    full = os.path.join(OUT, rel)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    open(full, "w", encoding="utf8").write(content)
os.makedirs(os.path.dirname(EXP), exist_ok=True)
json.dump(expected, open(EXP, "w", encoding="utf8"), ensure_ascii=False, indent=2)
open(EXP, "a").write("\n")
js = [p for p in files if p.endswith(".js")]
print(f"wrote {len(files)} files ({len(js)} .js), {len(endpoints)} HTTP endpoints, {len(findings)} findings, {len(facts)} facts")
