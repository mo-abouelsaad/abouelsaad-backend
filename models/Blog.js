const mongoose = require("mongoose");
const slugify = require("slugify");

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    excerpt: {
      type: String,
      trim: true,
      maxlength: [500, "Excerpt cannot exceed 500 characters"],
    },
    content: {
      type: String,
      required: [true, "Content is required"],
    },
    coverImage: {
      url: { type: String, default: "" },
      alt: { type: String, default: "" },
    },
    tags: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },
    readingTime: {
      type: Number, // in minutes
      default: 1,
    },
    views: {
      type: Number,
      default: 0,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate slug from title before saving
blogSchema.pre("save", async function (next) {
  if (!this.isModified("title")) return next();

  let baseSlug = slugify(this.title, { lower: true, strict: true });
  let slug = baseSlug;
  let count = 1;

  // Ensure slug uniqueness
  while (await mongoose.model("Blog").findOne({ slug, _id: { $ne: this._id } })) {
    slug = `${baseSlug}-${count}`;
    count++;
  }

  this.slug = slug;
  next();
});

// Auto-calculate reading time before saving
blogSchema.pre("save", function (next) {
  if (!this.isModified("content")) return next();
  // Strip HTML tags and count words (~200 words/minute)
  const plainText = this.content.replace(/<[^>]*>/g, "");
  const wordCount = plainText.split(/\s+/).filter(Boolean).length;
  this.readingTime = Math.max(1, Math.ceil(wordCount / 200));
  next();
});

// Auto-generate excerpt if not provided
blogSchema.pre("save", function (next) {
  if (!this.isModified("content") || this.excerpt) return next();
  const plainText = this.content.replace(/<[^>]*>/g, "").trim();
  this.excerpt = plainText.substring(0, 300) + (plainText.length > 300 ? "..." : "");
  next();
});

module.exports = mongoose.model("Blog", blogSchema);
