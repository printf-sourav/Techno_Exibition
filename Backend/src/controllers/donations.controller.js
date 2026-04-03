import mongoose from "mongoose";
import Donation from "../models/Donation.js";
import NGONeed from "../models/NGONeed.js";
import InventoryItem from "../models/InventoryItem.js";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { notifyUser } from "../utils/notifications.js";

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

export const createNeed = asyncHandler(async (req, res) => {
  if (req.user.role !== "ngo") {
    throw new ApiError(403, "Only NGOs can create medicine needs");
  }

  const { medicineName, quantity, urgency, location } = req.body;

  if (!medicineName || !location) {
    throw new ApiError(400, "medicineName and location are required");
  }

  const need = await NGONeed.create({
    ngoId: req.user.id,
    medicineName: String(medicineName).trim(),
    quantity: toPositiveNumber(quantity, "quantity"),
    urgency,
    location: String(location).trim()
  });

  return res.status(201).json(new ApiResponse(201, need, "Need created"));
});

export const getNeeds = asyncHandler(async (req, res) => {
  const allowedStatuses = ["open", "partially_fulfilled", "fulfilled", "closed"];
  const { status, onlyMine } = req.query;

  const filter = {};

  if (status) {
    if (!allowedStatuses.includes(status)) {
      throw new ApiError(400, "Invalid status filter");
    }
    filter.status = status;
  } else {
    filter.status = { $in: ["open", "partially_fulfilled"] };
  }

  if (String(onlyMine).toLowerCase() === "true") {
    filter.ngoId = req.user.id;
  }

  const needs = await NGONeed.find(filter)
    .sort({ createdAt: -1 })
    .populate("ngoId", "name organizationName location phone");

  return res
    .status(200)
    .json(new ApiResponse(200, needs, "Needs fetched successfully"));
});

export const donate = asyncHandler(async (req, res) => {
  if (req.user.role !== "retailer") {
    throw new ApiError(403, "Only retailers can donate from inventory");
  }

  const { recipientNgoId, inventoryItemId, quantity, ngoNeedId } = req.body;

  if (!recipientNgoId || !inventoryItemId || quantity === undefined) {
    throw new ApiError(400, "recipientNgoId, inventoryItemId and quantity are required");
  }

  ensureObjectId(recipientNgoId, "recipientNgoId");
  ensureObjectId(inventoryItemId, "inventoryItemId");
  if (ngoNeedId) {
    ensureObjectId(ngoNeedId, "ngoNeedId");
  }

  const qty = toPositiveNumber(quantity, "quantity");

  const ngoUser = await User.findOne({ _id: recipientNgoId, role: "ngo" }).select("_id");
  if (!ngoUser) {
    throw new ApiError(404, "Recipient NGO not found");
  }

  let ngoNeed = null;
  if (ngoNeedId) {
    ngoNeed = await NGONeed.findById(ngoNeedId);
    if (!ngoNeed) {
      throw new ApiError(404, "NGO need not found");
    }

    if (String(ngoNeed.ngoId) !== String(recipientNgoId)) {
      throw new ApiError(400, "NGO need does not belong to recipient NGO");
    }

    if (!["open", "partially_fulfilled"].includes(ngoNeed.status)) {
      throw new ApiError(400, "Selected need is not open for donations");
    }
  }

  const updatedInventory = await InventoryItem.findOneAndUpdate(
    {
      _id: inventoryItemId,
      retailerId: req.user.id,
      quantity: { $gte: qty }
    },
    { $inc: { quantity: -qty } },
    { new: true }
  );

  if (!updatedInventory) {
    const inventoryExists = await InventoryItem.findOne({
      _id: inventoryItemId,
      retailerId: req.user.id
    }).select("_id quantity");

    if (!inventoryExists) {
      throw new ApiError(404, "Inventory item not found for donor");
    }

    throw new ApiError(400, "Insufficient inventory quantity for donation");
  }

  const donation = await Donation.create({
    donorId: req.user.id,
    recipientNgoId,
    inventoryItemId,
    ngoNeedId: ngoNeedId || undefined,
    quantity: qty,
    donatedAt: new Date()
  });

  const donorLabel = req.user.organizationName || req.user.name || "A retailer";
  const medicineLabel = updatedInventory.name || "medicine";

  await notifyUser({
    userId: recipientNgoId,
    type: "donation_update",
    title: "New Donation Received",
    message: `${donorLabel} donated ${qty} units of ${medicineLabel}.`,
    entityType: "donation",
    entityId: donation._id
  });

  return res.status(201).json(new ApiResponse(201, donation, "Donation created"));
});

export const getDonations = asyncHandler(async (req, res) => {
  const allowedStatuses = ["pending", "accepted", "rejected", "distributed"];
  const { status } = req.query;

  const filter = {};

  if (status) {
    if (!allowedStatuses.includes(status)) {
      throw new ApiError(400, "Invalid donation status filter");
    }
    filter.status = status;
  }

  if (req.user.role === "ngo") {
    filter.recipientNgoId = req.user.id;
  } else if (["retailer", "hospital"].includes(req.user.role)) {
    filter.donorId = req.user.id;
  } else if (req.user.role !== "admin") {
    throw new ApiError(403, "You are not allowed to view donations");
  }

  const donations = await Donation.find(filter)
    .sort({ createdAt: -1 })
    .populate("donorId", "name organizationName")
    .populate("recipientNgoId", "name organizationName")
    .populate("inventoryItemId", "name batchNumber expiryDate")
    .populate("ngoNeedId", "medicineName quantity urgency status");

  return res
    .status(200)
    .json(new ApiResponse(200, donations, "Donations fetched successfully"));
});

export const markDonationDistributed = asyncHandler(async (req, res) => {
  const { id } = req.params;

  ensureObjectId(id, "donation id");

  const donation = await Donation.findById(id);
  if (!donation) {
    throw new ApiError(404, "Donation not found");
  }

  const isAdmin = req.user.role === "admin";
  const isRecipientNgo =
    req.user.role === "ngo" && String(donation.recipientNgoId) === String(req.user.id);

  if (!isAdmin && !isRecipientNgo) {
    throw new ApiError(403, "Only recipient NGO or admin can distribute donation");
  }

  donation.status = "distributed";
  await donation.save();

  if (donation.ngoNeedId) {
    const ngoNeed = await NGONeed.findById(donation.ngoNeedId);

    if (ngoNeed && ngoNeed.status !== "closed") {
      const [aggregation] = await Donation.aggregate([
        {
          $match: {
            ngoNeedId: ngoNeed._id,
            status: "distributed"
          }
        },
        {
          $group: {
            _id: null,
            totalQuantity: { $sum: "$quantity" }
          }
        }
      ]);

      const donatedQuantity = aggregation?.totalQuantity || 0;
      ngoNeed.status =
        donatedQuantity >= ngoNeed.quantity ? "fulfilled" : donatedQuantity > 0 ? "partially_fulfilled" : "open";
      await ngoNeed.save();
    }
  }

  return res
    .status(200)
    .json(new ApiResponse(200, donation, "Donation marked as distributed"));
});
