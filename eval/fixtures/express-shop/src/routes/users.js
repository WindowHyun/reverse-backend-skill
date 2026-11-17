const router = require("express").Router();
const { requireAuth } = require("../middleware/auth");
const User = require("../models/user");

router.get("/:id", requireAuth, async (req, res) => {
  const user = await User.findById(req.params.id);
  res.json(user);
});

router.put("/:id", requireAuth, async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(user);
});

module.exports = router;
