import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import rolesallowed from "../middleware/role.middleware.js";
import {
	cancelRetailerRedistributionRequest,
	createRetailerRedistributionRequest,
	getRetailerMlInsights,
	getRetailerRedistributionRequests,
	respondRetailerRedistributionRequest,
} from "../controllers/ml.controller.js";

const router = express.Router();

router.get("/retailer-insights", authMiddleware, rolesallowed("retailer"), getRetailerMlInsights);
router.get(
	"/redistribution/requests",
	authMiddleware,
	rolesallowed("retailer"),
	getRetailerRedistributionRequests
);
router.post(
	"/redistribution/requests",
	authMiddleware,
	rolesallowed("retailer"),
	createRetailerRedistributionRequest
);
router.patch(
	"/redistribution/requests/:id/respond",
	authMiddleware,
	rolesallowed("retailer"),
	respondRetailerRedistributionRequest
);
router.patch(
	"/redistribution/requests/:id/cancel",
	authMiddleware,
	rolesallowed("retailer"),
	cancelRetailerRedistributionRequest
);

export default router;
