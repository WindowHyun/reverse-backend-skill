const router = require("express").Router();
const { requireAuth, requireAdmin } = require("../middleware/auth");
const Order = require("../models/order");
const User = require("../models/user");

router.get("/stats", requireAuth, requireAdmin, async (req, res) => {
  const [orders, users] = await Promise.all([Order.countDocuments(), User.countDocuments()]);
  res.json({ orders, users });
});

router.post("/reset-orders", requireAuth, async (req, res) => {
  await Order.deleteMany({});
  res.json({ ok: true });
});

module.exports = router;
