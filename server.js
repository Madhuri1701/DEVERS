const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const multer = require("multer");

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

const notificationSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  message: { type: String, required: true },
  time: { type: Date, default: Date.now },
  read: { type: Boolean, default: false }
});
const Notification = mongoose.model("Notification", notificationSchema);

const toolSchema = new mongoose.Schema({
  toolName: { type: String, required: true },
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
  status: { type: String, default: "approved" }, // Auto-approved
  ownerId: { type: String, required: true }
}, { timestamps: true });
const Tool = mongoose.model("Tool", toolSchema);

// ---------------- Multer Setup ----------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

// ---------------- Signup ----------------
app.post("/signup", async (req, res) => {
  try {
    const { id, name, email, password } = req.body;
    if (!id || !name || !email || !password) return res.status(400).json({ error: "All fields are required." });

    const existingUser = await User.findOne({ $or: [{ id }, { email }] });
    if (existingUser) return res.status(400).json({ error: "This ID or email is already registered." });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ id, name, email, password: hashedPassword });
    await newUser.save();

    req.session.user = { id: newUser.id, name: newUser.name, email: newUser.email };
    await Notification.create({ userId: newUser.id, message: "Welcome to Devers! Your account has been created." });

    res.json({ success: true, message: "Signup successful", redirect: "/mainpage.html" });
  } catch (err) {
    console.error("❌ Signup error:", err.message);
    res.status(500).json({ error: "Server error during signup." });
  }
});

// ---------------- Login ----------------
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password are required." });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid email or password." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid email or password." });

    req.session.user = { id: user.id, name: user.name, email: user.email };
    await Notification.create({ userId: user.id, message: "You logged in successfully." });

    res.json({ success: true, message: "Login successful", user: { id: user.id, name: user.name, email: user.email }, redirect: "/mainpage.html" });
  } catch (err) {
    console.error("❌ Login error:", err.message);
    res.status(500).json({ error: "Server error during login." });
  }
});

// ---------------- Profile Data ----------------
app.get("/profile-data", async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: "Not logged in" });
  try {
    const user = await User.findOne({ email: req.session.user.email });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ id: user.id, name: user.name, email: user.email, createdAt: user.createdAt });
  } catch (err) {
    console.error("❌ Profile-data error:", err);
    res.status(500).json({ error: "Server error fetching profile." });
  }
});

// ---------------- Logout ----------------
app.post("/logout", (req, res) => req.session.destroy(() => res.json({ success: true, message: "Logged out" })));

// ---------------- Notifications ----------------
app.get("/api/notifications", async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: "Not logged in" });
  const notifications = await Notification.find({ userId: req.session.user.id }).sort({ time: -1 });
  res.json(notifications);
});

app.put("/api/notifications/read", async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: "Not logged in" });
  await Notification.updateMany({ userId: req.session.user.id }, { $set: { read: true } });
  res.json({ success: true });
});

app.delete("/api/notifications", async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: "Not logged in" });
  await Notification.deleteMany({ userId: req.session.user.id });
  res.json({ success: true });
});

// ---------------- Upload Tool (with filters, auto-approve) ----------------
app.post("/upload-tool", upload.fields([{ name: "toolFile" }, { name: "logoFile" }, { name: "docFile" }]), async (req, res) => {
  if (!req.session.user) return res.status(401).json({ success: false, message: "Not logged in" });
  try {
    const { toolName, shortDesc, detailedDesc, toolLink } = req.body;

    // --- Basic Filters ---
    if (!toolName || toolName.length < 3) return res.json({ success: false, message: "Tool name must be at least 3 characters." });
    if (!shortDesc || !detailedDesc) return res.json({ success: false, message: "Description fields cannot be empty." });
    if (toolLink && !/^https?:\/\//.test(toolLink)) return res.json({ success: false, message: "Tool link must start with http:// or https://." });

    // Prevent duplicate tool names
    const existingTool = await Tool.findOne({ toolName });
    if (existingTool) return res.json({ success: false, message: "A tool with this name already exists." });

    // Save Tool (auto-approved)
    const newTool = new Tool({
      ...req.body,
      toolFile: req.files?.toolFile ? req.files.toolFile[0].path : null,
      logoFile: req.files?.logoFile ? req.files.logoFile[0].path : null,
      docFile: req.files?.docFile ? req.files.docFile[0].path : null,
      ownerId: req.session.user.id,
      status: "approved"
    });

    await newTool.save();
    res.json({ success: true, message: "✅ Tool uploaded successfully!" });
  } catch (err) {
    console.error("❌ Upload tool error:", err.message);
    res.json({ success: false, message: "Error saving tool." });
  }
});

// ---------------- Get all approved tools ----------------
app.get("/api/tools", async (req, res) => {
  try {
    const tools = await Tool.find({ status: "approved" }).sort({ createdAt: -1 });
    res.json(tools);
  } catch (err) {
    console.error("❌ Fetch tools error:", err.message);
    res.status(500).json({ error: "Error fetching tools." });
  }
});

// ---------------- Catch-all ----------------
app.use((req, res) => res.status(404).json({ error: "Route not found." }));

// ---------------- Start Server ----------------
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
