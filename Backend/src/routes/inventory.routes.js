import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import {
  addInventory,
  deleteInventory,
  getInventory,
  updateInventory,
} from "../controllers/inventory.controller.js";

const router = express.Router();

router.route("/").get(authMiddleware, getInventory).post(authMiddleware, addInventory);

router
  .route("/:id")
  .patch(authMiddleware, updateInventory)
  .delete(authMiddleware, deleteInventory);

export default router;