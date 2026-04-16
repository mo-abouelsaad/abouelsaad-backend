import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const Blog = new mongoose.Schema(
  {
    title: String,
    desc: String,
    body: String,
    author: String,
    img: String,
});
;

export default mongoose.model("Blog", Blog);
