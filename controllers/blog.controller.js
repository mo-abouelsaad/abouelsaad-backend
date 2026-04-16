import {
addBlog
} from "../services/blog.service.js";
export const addarticle = async (req, res) => {
  try {
    await addBlog(req.body)
    res.status(200).json({
      success :true
    });
  } catch (err) {
    res.status(401).json({ success: false });
  }
};