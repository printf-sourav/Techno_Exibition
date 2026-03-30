import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import rolesallowed from "../middleware/role.middleware.js";
import {
  acceptOffer,
  createOffer,
  createRequest,
  getIncomingOffers,
  getMedicines,
  getRequests,
  supplyRequest,
} from "../controllers/marketplace.controller.js";

const router = express.Router();

router.post("/offers", authMiddleware, rolesallowed("retailer"), createOffer);
router.get("/medicines", authMiddleware, rolesallowed("hospital"), getMedicines);
router.get("/offers/incoming", authMiddleware, rolesallowed("hospital"), getIncomingOffers);
router.patch("/offers/:id/accept", authMiddleware, rolesallowed("hospital"), acceptOffer);

router.post("/requests", authMiddleware, rolesallowed("hospital"), createRequest);
router.get("/requests", authMiddleware, getRequests);
router.post("/requests/:id/supply", authMiddleware, rolesallowed("retailer"), supplyRequest);

export default router;