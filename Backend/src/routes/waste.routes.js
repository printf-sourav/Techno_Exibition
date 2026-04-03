import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import { createPickup, getPickups, reschedulePickup } from "../controllers/waste.controller.js";

const router = express.Router();

router.post("/pickups", authMiddleware, createPickup);
router.get("/pickups", authMiddleware, getPickups);
router.patch("/pickups/:id/reschedule", authMiddleware, reschedulePickup);

export default router;
