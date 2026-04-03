import mongoose from "mongoose";
import MedicineOffer from "../models/MedicineOffer.js";
import MedicineRequest from "../models/MedicineRequest.js";
import InventoryItem from "../models/InventoryItem.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

const validateObjectId = (id, fieldName) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid ${fieldName}`);
  }
};

const parsePositiveNumber = (value, fieldName) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new ApiError(400, `${fieldName} must be a valid number greater than 0`);
  }
  return parsed;
};

const parseNonNegativeNumber = (value, fieldName) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new ApiError(400, `${fieldName} must be a valid non-negative number`);
  }
  return parsed;
};

const getInventoryStatus = (expiryDate) => {
  if (!expiryDate) {
    return "safe";
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);

  const daysToExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysToExpiry < 10) {
    return "critical";
  }

  if (daysToExpiry < 30) {
    return "warning";
  }

  return "safe";
};

const isNearExpiry = (expiryDate) => {
  if (!expiryDate) {
    return false;
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);

  const daysToExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return daysToExpiry < 30;
};

export const createOffer = asyncHandler(async (req, res) => {
  const { inventoryItemId, medicineName, batchNumber, quantity, pricePerPacket } = req.body;

  if (!inventoryItemId || quantity === undefined || pricePerPacket === undefined) {
    throw new ApiError(400, "inventoryItemId, quantity and pricePerPacket are required");
  }

  validateObjectId(inventoryItemId, "inventory item id");

  const parsedQuantity = parsePositiveNumber(quantity, "Quantity");
  const parsedPricePerPacket = parseNonNegativeNumber(pricePerPacket, "Price per packet");

  const inventoryItem = await InventoryItem.findOne({
    _id: inventoryItemId,
    retailerId: req.user.id,
  });

  if (!inventoryItem) {
    throw new ApiError(404, "Inventory item not found");
  }

  if (inventoryItem.quantity < parsedQuantity) {
    throw new ApiError(400, "Insufficient inventory quantity");
  }

  const finalMedicineName =
    medicineName && String(medicineName).trim()
      ? String(medicineName).trim()
      : String(inventoryItem.name || "").trim();

  if (!finalMedicineName) {
    throw new ApiError(400, "medicineName is required");
  }

  const finalBatchNumber =
    batchNumber !== undefined && String(batchNumber).trim()
      ? String(batchNumber).trim()
      : String(inventoryItem.batchNumber || "").trim();

  const offer = await MedicineOffer.create({
    retailerId: req.user.id,
    inventoryItemId: inventoryItem._id,
    medicineName: finalMedicineName,
    batchNumber: finalBatchNumber,
    quantity: parsedQuantity,
    pricePerPacket: parsedPricePerPacket,
    totalPrice: parsedQuantity * parsedPricePerPacket,
    status: "pending",
  });

  return res.status(201).json(new ApiResponse(201, offer, "Offer created successfully"));
});

export const getMedicines = asyncHandler(async (req, res) => {
  const offers = await MedicineOffer.find({ status: "pending" })
    .populate("retailerId", "name organizationName")
    .populate("inventoryItemId", "expiryDate quantity status")
    .sort({ createdAt: -1 });

  const medicines = offers.filter((offer) => {
    if (!offer.inventoryItemId) {
      return false;
    }

    if (offer.inventoryItemId.quantity < offer.quantity) {
      return false;
    }

    return isNearExpiry(offer.inventoryItemId.expiryDate);
  });

  return res.status(200).json(new ApiResponse(200, medicines, "Medicines fetched successfully"));
});

export const getIncomingOffers = asyncHandler(async (req, res) => {
  const offers = await MedicineOffer.find({ status: "pending" })
    .populate("retailerId", "name organizationName")
    .populate("inventoryItemId", "expiryDate quantity status")
    .sort({ createdAt: -1 });

  const incomingOffers = offers.filter(
    (offer) => offer.inventoryItemId && offer.inventoryItemId.quantity >= offer.quantity
  );

  return res
    .status(200)
    .json(new ApiResponse(200, incomingOffers, "Incoming offers fetched successfully"));
});

export const acceptOffer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateObjectId(id, "offer id");

  const offer = await MedicineOffer.findById(id);

  if (!offer) {
    throw new ApiError(404, "Offer not found");
  }

  if (offer.status !== "pending") {
    throw new ApiError(400, "Offer is not pending");
  }

  const inventoryItem = await InventoryItem.findById(offer.inventoryItemId);

  if (!inventoryItem) {
    throw new ApiError(404, "Inventory item not found for this offer");
  }

  if (inventoryItem.quantity < offer.quantity) {
    throw new ApiError(400, "Insufficient inventory quantity");
  }

  inventoryItem.quantity -= offer.quantity;
  inventoryItem.status = getInventoryStatus(inventoryItem.expiryDate);
  await inventoryItem.save();

  offer.status = "accepted";
  offer.hospitalId = req.user.id;
  await offer.save();

  return res
    .status(200)
    .json(new ApiResponse(200, { offer, inventoryItem }, "Offer accepted successfully"));
});

export const createRequest = asyncHandler(async (req, res) => {
  const { medicineName, quantity, priority } = req.body;

  if (!medicineName || quantity === undefined) {
    throw new ApiError(400, "medicineName and quantity are required");
  }

  const finalMedicineName = String(medicineName).trim();
  if (!finalMedicineName) {
    throw new ApiError(400, "medicineName is required");
  }

  const parsedQuantity = parsePositiveNumber(quantity, "Quantity");

  const request = await MedicineRequest.create({
    hospitalId: req.user.id,
    medicineName: finalMedicineName,
    quantity: parsedQuantity,
    priority: priority || "medium",
    status: "pending",
  });

  return res.status(201).json(new ApiResponse(201, request, "Request created successfully"));
});

export const getRequests = asyncHandler(async (req, res) => {
  let requests;

  if (req.user.role === "hospital") {
    requests = await MedicineRequest.find({ hospitalId: req.user.id }).sort({ createdAt: -1 });
  } else if (req.user.role === "retailer") {
    requests = await MedicineRequest.find({ status: { $in: ["pending", "matched"] } }).sort({
      createdAt: -1,
    });
  } else {
    throw new ApiError(403, "Access denied");
  }

  return res.status(200).json(new ApiResponse(200, requests, "Requests fetched successfully"));
});

export const supplyRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { inventoryItemId, quantity, pricePerPacket } = req.body;

  validateObjectId(id, "request id");

  if (!inventoryItemId) {
    throw new ApiError(400, "inventoryItemId is required");
  }

  validateObjectId(inventoryItemId, "inventory item id");

  const request = await MedicineRequest.findById(id);

  if (!request) {
    throw new ApiError(404, "Request not found");
  }

  if (!["pending", "matched"].includes(request.status)) {
    throw new ApiError(400, "Request cannot be supplied in current status");
  }

  const inventoryItem = await InventoryItem.findOne({
    _id: inventoryItemId,
    retailerId: req.user.id,
  });

  if (!inventoryItem) {
    throw new ApiError(404, "Inventory item not found");
  }

  const suppliedQuantity =
    quantity === undefined ? request.quantity : parsePositiveNumber(quantity, "Quantity");

  if (inventoryItem.quantity < suppliedQuantity) {
    throw new ApiError(400, "Insufficient inventory quantity");
  }

  const finalPricePerPacket =
    pricePerPacket === undefined
      ? parseNonNegativeNumber(inventoryItem.mrp || 0, "Price per packet")
      : parseNonNegativeNumber(pricePerPacket, "Price per packet");

  const offer = await MedicineOffer.create({
    retailerId: req.user.id,
    hospitalId: request.hospitalId,
    requestId: request._id,
    inventoryItemId: inventoryItem._id,
    medicineName: request.medicineName,
    batchNumber: String(inventoryItem.batchNumber || "").trim(),
    quantity: suppliedQuantity,
    pricePerPacket: finalPricePerPacket,
    totalPrice: suppliedQuantity * finalPricePerPacket,
    status: "completed",
  });

  inventoryItem.quantity -= suppliedQuantity;
  inventoryItem.status = getInventoryStatus(inventoryItem.expiryDate);
  await inventoryItem.save();

  if (suppliedQuantity >= request.quantity) {
    request.status = "completed";
  } else {
    request.quantity -= suppliedQuantity;
    request.status = "matched";
  }

  await request.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        request,
        offer,
        inventoryItem,
      },
      "Request supplied successfully"
    )
  );
});