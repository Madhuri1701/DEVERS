const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const multer = require("multer");  // ⬅️ for file uploads

const app = express();
const PORT = 5000;

// ---------------- MongoDB Connection ----------------
const MONGODB_URI = "mongodb+srv://AFIFA:csITEmGqh5biwiet@devers.ydixk3s.mongodb.net/DeversDB?retryWrites=true&w=majority&appName=Devers";

mongoose.connect(MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err.message));

// ---------------- Middleware ----------------
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ---------------- Session ----------------
app.use(session({
  secret: "super-secret-key",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: "lax",
    secure: false
  }
}));

// ---------------- Schemas ----------------
const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

// 🔔 Notification Schema
const notificationSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  message: { type: String, required: true },
  time: { type: Date, default: Date.now },
  read: { type: Boolean, default: false }
});
const Notification = mongoose.model("Notification", notificationSchema);

// ---------------- Tool Schema (NEW) ----------------
const toolSchema = new mongoose.Schema({
  toolName: String,
  shortDesc: String,
  detailedDesc: String,
  category: String,
  tags: String,
  toolLink: String,
  version: String,
  pricing: String,
  price: Number,
  compatibility: String,
  license: String,
  author: String,
  demoLink: String,
  codePreview: String,
  logoFile: String,
  docFile: String,
  toolFile: String,
  status: { type: String, default: "pending" }, // pending until verification
}, { timestamps: true });

const Tool = mongoose.model("Tool", toolSchema);

// ---------------- Multer Setup ----------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

// ---------------- Signup Route ----------------
app.post("/signup", async (req, res) => {
  try {
    const { id, name, email, password } = req.body;
    if (!id || !name || !email || !password) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const existingUser = await User.findOne({ $or: [{ id }, { email }] });
    if (existingUser) {
      return res.status(400).json({ error: "This ID or email is already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ id, name, email, password: hashedPassword });
    await newUser.save();

    req.session.user = { id: newUser.id, name: newUser.name, email: newUser.email };

    await Notification.create({
      userId: newUser.id,
      message: "Welcome to Devers! Your account has been created."
    });

    res.json({ success: true, message: "Signup successful", redirect: "/mainpage.html" });
  } catch (err) {
    console.error("❌ Signup error:", err.message);
    res.status(500).json({ error: "Server error during signup." });
  }
});

// ---------------- Login Route ----------------
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid email or password." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid email or password." });

    req.session.user = { id: user.id, name: user.name, email: user.email };

    await Notification.create({
      userId: user.id,
      message: "You logged in successfully."
    });

    res.json({
      success: true,
      message: "Login successful",
      user: { id: user.id, name: user.name, email: user.email },
      redirect: "/mainpage.html"
    });
  } catch (err) {
    console.error("❌ Login error:", err.message);
    res.status(500).json({ error: "Server error during login." });
  }
});

// ---------------- Profile Data Route ----------------
app.get("/profile-data", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Not logged in" });
  }

  try {
    const user = await User.findOne({ email: req.session.user.email });
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt
    });
  } catch (err) {
    console.error("❌ Profile-data error:", err);
    res.status(500).json({ error: "Server error fetching profile." });
  }
});

// ---------------- Logout Route ----------------
app.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true, message: "Logged out" });
  });
});

// ---------------- Notifications Routes ----------------
app.get("/api/notifications", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Not logged in" });
  }
  const notifications = await Notification.find({ userId: req.session.user.id }).sort({ time: -1 });
  res.json(notifications);
});

app.put("/api/notifications/read", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Not logged in" });
  }
  await Notification.updateMany({ userId: req.session.user.id }, { $set: { read: true } });
  res.json({ success: true });
});

app.delete("/api/notifications", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Not logged in" });
  }
  await Notification.deleteMany({ userId: req.session.user.id });
  res.json({ success: true });
});

// ---------------- Upload Tool Route (NEW) ----------------
app.post("/upload-tool", upload.fields([
  { name: "toolFile" },
  { name: "logoFile" },
  { name: "docFile" }
]), async (req, res) => {
  try {
    const newTool = new Tool({
      toolName: req.body.toolName,
      shortDesc: req.body.shortDesc,
      detailedDesc: req.body.detailedDesc,
      category: req.body.category,
      tags: req.body.tags,
      toolLink: req.body.toolLink,
      version: req.body.version,
      pricing: req.body.pricing,
      price: req.body.price,
      compatibility: req.body.compatibility,
      license: req.body.license,
      author: req.body.author,
      demoLink: req.body.demoLink,
      codePreview: req.body.codePreview,
      toolFile: req.files?.toolFile ? req.files.toolFile[0].path : null,
      logoFile: req.files?.logoFile ? req.files.logoFile[0].path : null,
      docFile: req.files?.docFile ? req.files.docFile[0].path : null,
    });

    await newTool.save();
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Upload tool error:", err.message);
    res.json({ success: false, message: "Error saving tool." });
  }
});

// ---------------- Catch-all ----------------
app.use((req, res) => {
  res.status(404).json({ error: "Route not found." });
});

// ---------------- Start Server ----------------
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
