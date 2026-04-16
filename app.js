import express from "express";
import authRoutes from "./routes/auth.routes.js";
import blogRoutes from "./routes/blog.routes.js";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000/');
  next();
});
app.use(cors());
app.use("/api/auth", authRoutes);
app.use("/blog", blogRoutes);

export default app;
