import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import rolesallowed from "../middleware/role.middleware.js";
import {
  getUsers,
  getPendingUsers,
  approveUser,
  rejectUser,
  assignWastePickup
} from "../controllers/admin.controller.js";

const router = express.Router();

router.use(authMiddleware, rolesallowed("admin"));

router.get("/users", getUsers);
router.get("/users/pending", getPendingUsers);
router.patch("/users/:id/approve", approveUser);
router.patch("/users/:id/reject", rejectUser);
router.patch("/waste/pickups/:id/assign", assignWastePickup);

export default router;
