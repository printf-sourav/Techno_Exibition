import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import {
  createNotification,
  getNotifications,
  markRead
} from "../controllers/notifications.controller.js";
const router = express.Router();
router.post("/",createNotification);
router.get("/", authMiddleware, getNotifications);
router.put("/:id", markRead);
export default router;