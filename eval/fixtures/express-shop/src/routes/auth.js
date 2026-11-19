const router = require("express").Router();
const bcrypt = require("bcryptjs");
const User = require("../models/user");

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const { password, ...rest } = req.body;
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ ...rest, passwordHash });
  res.status(201).json(user);
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(401).json({ error: "invalid credentials" });
  const ok = await bcrypt.compare(req.body.password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "invalid credentials" });
  // TODO: issue a real JWT
  res.json({ token: "..." });
});

module.exports = router;
