import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const COOKIE_NAME = "smarttime_token";
const TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

export const getAuthCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: TOKEN_MAX_AGE,
  path: "/",
});

const getSafeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
});

const generateToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !isValidEmail(email.trim()) ||
      typeof password !== "string" ||
      password.length < 8
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, a valid email, and a password of at least 8 characters are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "A user with that email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "employee",
    });
    return res.status(201).json({
      success: true,
      user: getSafeUser(user),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A user with that email already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to register user",
    });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      !isValidEmail(email.trim()) ||
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid email and password are required",
      });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    const passwordMatches = user
      ? await bcrypt.compare(password, user.password)
      : false;

    if (!user || !passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = generateToken(user._id.toString());
    res.cookie(COOKIE_NAME, token, getAuthCookieOptions());

    return res.json({
      success: true,
      user: getSafeUser(user),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to log in",
    });
  }
};

export const getMe = (req, res) => {
  return res.json({
    success: true,
    user: getSafeUser(req.user),
  });
};

export const logoutUser = (req, res) => {
  res.clearCookie(COOKIE_NAME, getAuthCookieOptions());

  return res.json({
    success: true,
    message: "Logged out successfully",
  });
};
