import mongoose from "mongoose";
import WastePickupRequest from "../models/WastePickupRequest.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

const toPositiveNumber = (value, fieldName) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    throw new ApiError(400, `${fieldName} must be a positive number`);
  }
  return numericValue;
};

const ensureObjectId = (value, fieldName) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new ApiError(400, `Invalid ${fieldName}`);
  }
};

export const createPickup = asyncHandler(async (req, res) => {
  const { wasteType, amount, unit, pickupDate, pickupTime, location } = req.body;

  if (!wasteType || !unit || !pickupDate || !location) {
    throw new ApiError(400, "wasteType, unit, pickupDate and location are required");
  }

  const parsedDate = new Date(pickupDate);
  if (Number.isNaN(parsedDate.getTime())) {
    throw new ApiError(400, "pickupDate must be a valid date");
  }

  const pickup = await WastePickupRequest.create({
    requesterId: req.user.id,
    wasteType: String(wasteType).trim(),
    amount: toPositiveNumber(amount, "amount"),
    unit,
    pickupDate: parsedDate,
    pickupTime,
    location: String(location).trim(),
    requestedAt: new Date()
  });

  return res.status(201).json(new ApiResponse(201, pickup, "Pickup created"));
});

export const getPickups = asyncHandler(async (req, res) => {
  const allowedStatuses = ["pending", "assigned", "in_progress", "completed", "cancelled"];
  const { status } = req.query;

  const filter = {};

  if (status) {
    if (!allowedStatuses.includes(status)) {
      throw new ApiError(400, "Invalid pickup status filter");
    }
    filter.status = status;
  }

  if (req.user.role === "admin") {
    // Admin can view all pickup requests.
  } else if (req.user.role === "waste") {
    filter.$or = [{ agencyId: req.user.id }, { status: "pending" }];
  } else {
    filter.requesterId = req.user.id;
  }

  const pickups = await WastePickupRequest.find(filter)
    .sort({ createdAt: -1 })
    .populate("requesterId", "name organizationName role phone")
    .populate("agencyId", "name organizationName phone")
    .populate("assignedByAdminId", "name");

  return res.status(200).json(new ApiResponse(200, pickups, "Pickups fetched successfully"));
});

export const reschedulePickup = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { pickupDate, pickupTime, location } = req.body;

  ensureObjectId(id, "pickup id");

  if (!pickupDate && !pickupTime && !location) {
    throw new ApiError(400, "At least one field is required: pickupDate, pickupTime, location");
  }

  const pickup = await WastePickupRequest.findById(id);
  if (!pickup) {
    throw new ApiError(404, "Pickup request not found");
  }

  const isAdmin = req.user.role === "admin";
  const isOwner = String(pickup.requesterId) === String(req.user.id);

  if (!isAdmin && !isOwner) {
    throw new ApiError(403, "Only requester or admin can reschedule pickup");
  }

  if (["completed", "cancelled"].includes(pickup.status)) {
    throw new ApiError(400, "Completed or cancelled pickups cannot be rescheduled");
  }

  if (pickupDate) {
    const parsedDate = new Date(pickupDate);
    if (Number.isNaN(parsedDate.getTime())) {
      throw new ApiError(400, "pickupDate must be a valid date");
    }
    pickup.pickupDate = parsedDate;
  }

  if (pickupTime) {
    pickup.pickupTime = pickupTime;
  }

  if (location) {
    pickup.location = String(location).trim();
  }

  await pickup.save();

  return res.status(200).json(new ApiResponse(200, pickup, "Pickup rescheduled"));
});
