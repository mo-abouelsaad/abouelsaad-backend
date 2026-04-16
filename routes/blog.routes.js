import express from "express";
import {
addarticle
} from "../controllers/blog.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();


router.post("/addarticle",protect, addarticle);

export default router;
