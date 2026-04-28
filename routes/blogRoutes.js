const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");

const {
  getAllBlogs,
  getAdminBlogs,
  getBlogBySlug,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
  getAllTags,
} = require("../controllers/blogController");

const { protect } = require("../middlewares/authMiddleware");

// ── Multer config ──────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "..", "public", "uploads"));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = crypto.randomBytes(16).toString("hex") + ext;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp/;
  const isValid = allowed.test(path.extname(file.originalname).toLowerCase()) &&
                  allowed.test(file.mimetype);
  if (isValid) cb(null, true);
  else cb(new Error("Only images are allowed (jpeg, jpg, png, gif, webp)"));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// ── Public routes ──────────────────────────────
router.get("/", getAllBlogs);
router.get("/tags", getAllTags);
router.get("/:slug", getBlogBySlug);

// ── Protected routes ───────────────────────────
router.get("/admin/all", protect, getAdminBlogs);
router.get("/id/:id", protect, getBlogById);
router.post("/", protect, upload.single("coverImage"), createBlog);
router.put("/:id", protect, upload.single("coverImage"), updateBlog);
router.delete("/:id", protect, deleteBlog);

module.exports = router;
