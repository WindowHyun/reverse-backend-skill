const router = require("express").Router();
const { requireAuth, requireAdmin } = require("../middleware/auth");
const Order = require("../models/order");
const { charge } = require("../services/payment");

// router.use(requireAuth);   // will be enabled in v2

router.get("/", async (req, res) => {
  const orders = await Order.find({});
  res.json(orders);
});

router.get("/:id", requireAuth, async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ error: "not found" });
  res.json(order);
});

router.post("/", async (req, res) => {
  const { items, amount } = req.body;
  const payment = await charge({ amount, currency: "usd" });
  const order = await Order.create({
    userId: req.body.userId,
    items,
    amount,
    paymentId: payment.id,
    status: "paid",
  });
  res.status(201).json(order);
});

// router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
router.delete("/:id", async (req, res) => {
  await Order.findByIdAndDelete(req.params.id);
  res.status(204).end();
});

module.exports = router;
