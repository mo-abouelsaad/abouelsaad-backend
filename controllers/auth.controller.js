import {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
} from "../services/auth.service.js";

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { user, accessToken, refreshToken } =
      await loginUser(email, password);

    res.status(200).json({
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    res.status(401).json({ success: false });
  }
};
export const register = async (req, res) => {
  try {
    const user = await registerUser(req.body);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
    });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const accessToken = await refreshAccessToken(refreshToken);

    res.json({ accessToken });
  } catch (err) {
    res.status(403).json({ message: err.message });
  }
};

export const logout = async (req, res) => {
  await logoutUser(req.userId);
  res.json({ message: "Logged out successfully" });
};
