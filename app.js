const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();

// ── Ensure uploads directory exists ───────────
const uploadsDir = path.join(__dirname, "public", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ── Middleware ─────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ── Static files (uploaded images) ────────────
app.use("/uploads", express.static(path.join(__dirname, "public", "uploads")));

// ── Routes ─────────────────────────────────────
const blogRoutes = require("./routes/blogRoutes");
// const authRoutes = require("./routes/authRoutes"); // your existing auth

app.use("/api/blogs", blogRoutes);
// app.use("/api/auth", authRoutes);

// ── Health check ───────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Server is running" });
});

// ── Global error handler ───────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

module.exports = app;
