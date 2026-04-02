import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import rolesallowed from "../middleware/role.middleware.js";
import {
  createNeed,
  getNeeds,
  donate,
  getDonations,
  markDonationDistributed
} from "../controllers/donations.controller.js";

const router = express.Router();

router.get("/needs", authMiddleware, getNeeds);
router.post("/needs", authMiddleware, rolesallowed("ngo"), createNeed);
router.post("/", authMiddleware, rolesallowed("retailer"), donate);
router.get("/", authMiddleware, getDonations);
router.patch("/:id/distribute", authMiddleware, rolesallowed("ngo", "admin"), markDonationDistributed);

export default router;
