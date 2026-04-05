import mongoose from "mongoose";
import User from "../models/User.js";
import WastePickupRequest from "../models/WastePickupRequest.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { notifyUser } from "../utils/notifications.js";

const ensureObjectId = (value, fieldName) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new ApiError(400, `Invalid ${fieldName}`);
  }
};

const updateUserVerificationStatus = async ({
  userId,
  verificationStatus,
  title,
  message,
  responseMessage
}) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { verificationStatus },
    { new: true }
  ).select("-passwordHash");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  await notifyUser({
    userId: user._id,
    type: "verification_update",
    title,
    message,
    entityType: "user",
    entityId: user._id
  });

  return new ApiResponse(200, user, responseMessage);
};

export const getPendingUsers = asyncHandler(async (req, res) => {
  const users = await User.find({ verificationStatus: "pending" })
    .select("-passwordHash")
    .sort({ createdAt: -1 });

  return res.status(200).json(new ApiResponse(200, users, "Pending users fetched"));
});

export const getUsers = asyncHandler(async (req, res) => {
  const { role, verificationStatus } = req.query;

  const filter = {};

  if (role) {
    filter.role = String(role);
  }

  if (verificationStatus) {
    filter.verificationStatus = String(verificationStatus);
  }

  const users = await User.find(filter)
    .select("-passwordHash")
    .sort({ createdAt: -1 });

  return res.status(200).json(new ApiResponse(200, users, "Users fetched"));
});

export const approveUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  ensureObjectId(id, "user id");

  const response = await updateUserVerificationStatus({
    userId: id,
    verificationStatus: "verified",
    title: "Profile Approved",
    message: "Your account has been approved by admin. You can now access the platform.",
    responseMessage: "User approved"
  });

  return res.status(200).json(response);
});

export const rejectUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  ensureObjectId(id, "user id");

  const response = await updateUserVerificationStatus({
    userId: id,
    verificationStatus: "rejected",
    title: "Profile Rejected",
    message: "Your account verification was rejected. Please update your details and try again.",
    responseMessage: "User rejected"
  });

  return res.status(200).json(response);
});

export const assignWastePickup = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { agencyId } = req.body;

  ensureObjectId(id, "pickup id");
  ensureObjectId(agencyId, "agency id");

  const agency = await User.findOne({ _id: agencyId, role: "waste" }).select("_id");
  if (!agency) {
    throw new ApiError(404, "Waste agency user not found");
  }

  const pickup = await WastePickupRequest.findByIdAndUpdate(
    id,
    {
      agencyId,
      assignedByAdminId: req.user.id,
      status: "assigned"
    },
    { new: true }
  )
    .populate("requesterId", "name organizationName")
    .populate("agencyId", "name organizationName");

  if (!pickup) {
    throw new ApiError(404, "Pickup request not found");
  }

  const requesterId = pickup.requesterId?._id || pickup.requesterId;
  const agencyName = pickup.agencyId?.organizationName || pickup.agencyId?.name || "assigned waste agency";

  await notifyUser({
    userId: requesterId,
    type: "pickup_assigned",
    title: "Waste Pickup Assigned",
    message: `Your waste pickup request has been assigned to ${agencyName}.`,
    entityType: "pickup",
    entityId: pickup._id
  });

  return res.status(200).json(new ApiResponse(200, pickup, "Pickup assigned to waste agency"));
});
