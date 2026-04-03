import jwt from "jsonwebtoken";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

const authMiddleware = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new ApiError(401, "No token");
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    throw new ApiError(401, "No token");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new ApiError(401, "Invalid token");
  }

  const user = await User.findById(decoded.id).select("-passwordHash");
  if (!user) {
    throw new ApiError(401, "User not found");
  }

  req.user = user;
  next();
});

export default authMiddleware;