import express from "express";
import {
  login,
  register,
  refreshToken,
  logout,}from "../controllers/auth.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();


router.post("/register", register);

router.post("/login", login);
router.post("/refresh-token", refreshToken);
router.post("/logout", protect, logout);

export default router;
