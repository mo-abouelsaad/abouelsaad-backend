import User from "../models/user.model.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "./token.service.js";
import jwt from "jsonwebtoken";
export const registerUser = async (data) => {
  const existingUser = await User.findOne({ email: data.email });
  if (existingUser) {
    throw new Error("Email already exists");
  }

  const user = await User.create(data);
  return user;
};
export const loginUser = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(password))) {
    throw new Error("Invalid email or password");
  }

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = refreshToken;
  await user.save();

  return { user, accessToken, refreshToken };
};

export const refreshAccessToken = async (token) => {
  if (!token) throw new Error("No refresh token");

  const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

  const user = await User.findById(decoded.userId);
  if (!user || user.refreshToken !== token) {
    throw new Error("Invalid refresh token");
  }

  const newAccessToken = generateAccessToken(user._id);
  return newAccessToken;
};

export const logoutUser = async (userId) => {
  await User.findByIdAndUpdate(userId, { refreshToken: null });
};
