import Blog from "../models/blog.model.js";
export const addBlog = async (data) => {
  const blog = await Blog.create(data);
  return true;
};