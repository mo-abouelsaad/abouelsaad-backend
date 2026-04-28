const Blog = require("../models/Blog");
const path = require("path");
const fs = require("fs");

// ─────────────────────────────────────────────
// @desc    Get all published blogs (paginated)
// @route   GET /api/blogs
// @access  Public
// ─────────────────────────────────────────────
const getAllBlogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const tag = req.query.tag;
    const search = req.query.search;

    const filter = { status: "published" };
    if (tag) filter.tags = { $in: [tag] };
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { excerpt: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    const [blogs, total] = await Promise.all([
      Blog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("-content") // exclude heavy content for listing
        .populate("author", "name"),
      Blog.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: blogs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// @desc    Get all blogs for admin (all statuses)
// @route   GET /api/blogs/admin
// @access  Private
// ─────────────────────────────────────────────
const getAdminBlogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status; // optional filter by status

    const filter = {};
    if (status) filter.status = status;

    const [blogs, total] = await Promise.all([
      Blog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("-content")
        .populate("author", "name"),
      Blog.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: blogs,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// @desc    Get single blog by slug (public)
// @route   GET /api/blogs/:slug
// @access  Public
// ─────────────────────────────────────────────
const getBlogBySlug = async (req, res) => {
  try {
    const blog = await Blog.findOne({
      slug: req.params.slug,
      status: "published",
    }).populate("author", "name");

    if (!blog) {
      return res.status(404).json({ success: false, message: "Article not found" });
    }

    // Increment view count (fire-and-forget)
    Blog.findByIdAndUpdate(blog._id, { $inc: { views: 1 } }).exec();

    res.status(200).json({ success: true, data: blog });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// @desc    Get single blog by ID (admin/edit)
// @route   GET /api/blogs/id/:id
// @access  Private
// ─────────────────────────────────────────────
const getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).populate("author", "name");

    if (!blog) {
      return res.status(404).json({ success: false, message: "Article not found" });
    }

    res.status(200).json({ success: true, data: blog });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// @desc    Create a new blog post
// @route   POST /api/blogs
// @access  Private
// ─────────────────────────────────────────────
const createBlog = async (req, res) => {
  try {
    const { title, content, excerpt, tags, status, coverImage } = req.body;

    // Handle uploaded cover image
    let coverImageData = { url: "", alt: "" };
    if (req.file) {
      coverImageData.url = `/uploads/${req.file.filename}`;
      coverImageData.alt = title;
    } else if (coverImage) {
      coverImageData = typeof coverImage === "string" ? JSON.parse(coverImage) : coverImage;
    }

    const blog = await Blog.create({
      title,
      content,
      excerpt,
      tags: Array.isArray(tags) ? tags : tags ? JSON.parse(tags) : [],
      status: status || "draft",
      coverImage: coverImageData,
      author: req.user._id,
    });

    res.status(201).json({ success: true, data: blog });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// @desc    Update a blog post
// @route   PUT /api/blogs/:id
// @access  Private
// ─────────────────────────────────────────────
const updateBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ success: false, message: "Article not found" });
    }

    const { title, content, excerpt, tags, status, coverImage } = req.body;

    // Handle uploaded cover image
    if (req.file) {
      // Remove old image if it was a local upload
      if (blog.coverImage?.url?.startsWith("/uploads/")) {
        const oldPath = path.join(__dirname, "..", "public", blog.coverImage.url);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      blog.coverImage = { url: `/uploads/${req.file.filename}`, alt: title || blog.title };
    } else if (coverImage) {
      blog.coverImage = typeof coverImage === "string" ? JSON.parse(coverImage) : coverImage;
    }

    if (title !== undefined) blog.title = title;
    if (content !== undefined) blog.content = content;
    if (excerpt !== undefined) blog.excerpt = excerpt;
    if (tags !== undefined) blog.tags = Array.isArray(tags) ? tags : JSON.parse(tags);
    if (status !== undefined) blog.status = status;

    await blog.save();

    res.status(200).json({ success: true, data: blog });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// @desc    Delete a blog post
// @route   DELETE /api/blogs/:id
// @access  Private
// ─────────────────────────────────────────────
const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);

    if (!blog) {
      return res.status(404).json({ success: false, message: "Article not found" });
    }

    // Remove associated local image
    if (blog.coverImage?.url?.startsWith("/uploads/")) {
      const imgPath = path.join(__dirname, "..", "public", blog.coverImage.url);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }

    res.status(200).json({ success: true, message: "Article deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// @desc    Get all unique tags
// @route   GET /api/blogs/tags
// @access  Public
// ─────────────────────────────────────────────
const getAllTags = async (req, res) => {
  try {
    const tags = await Blog.distinct("tags", { status: "published" });
    res.status(200).json({ success: true, data: tags.filter(Boolean).sort() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllBlogs,
  getAdminBlogs,
  getBlogBySlug,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
  getAllTags,
};
