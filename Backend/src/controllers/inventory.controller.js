import mongoose from "mongoose";
import InventoryItem from "../models/InventoryItem.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

const getInventoryStatus = (expiryDate) => {
  if (!expiryDate) {
    return "safe";
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const expiry = new Date(expiryDate);
  if (Number.isNaN(expiry.getTime())) {
    throw new ApiError(400, "Invalid expiry date");
  }
  expiry.setHours(0, 0, 0, 0);

  const timeDifference = expiry.getTime() - now.getTime();
  const daysToExpiry = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));

  if (daysToExpiry < 10) {
    return "critical";
  }

  if (daysToExpiry < 30) {
    return "warning";
  }

  return "safe";
};

const validateInventoryId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid inventory id");
  }
};

const parsePositiveNumber = (value, fieldName) => {
  const parsedValue = Number(value);
  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    throw new ApiError(400, `${fieldName} must be a valid non-negative number`);
  }
  return parsedValue;
};

export const getInventory = asyncHandler(async (req, res) => {
  const inventoryItems = await InventoryItem.find({
    retailerId: req.user.id,
  }).sort({ expiryDate: 1, createdAt: -1 });

  const updates = [];

  inventoryItems.forEach((item) => {
    const recalculatedStatus = getInventoryStatus(item.expiryDate);
    if (item.status !== recalculatedStatus) {
      item.status = recalculatedStatus;
      updates.push({
        updateOne: {
          filter: { _id: item._id, retailerId: req.user.id },
          update: { $set: { status: recalculatedStatus } },
        },
      });
    }
  });

  if (updates.length > 0) {
    await InventoryItem.bulkWrite(updates);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, inventoryItems, "Inventory fetched successfully"));
});

export const addInventory = asyncHandler(async (req, res) => {
  const { name, batchNumber, quantity, expiryDate, mrp, gstPercent } = req.body;

  if (!name || !batchNumber || quantity === undefined || !expiryDate || mrp === undefined) {
    throw new ApiError(400, "Missing required inventory fields");
  }

  const trimmedName = String(name).trim();
  const trimmedBatchNumber = String(batchNumber).trim();

  if (!trimmedName || !trimmedBatchNumber) {
    throw new ApiError(400, "Name and batch number are required");
  } 

  const parsedExpiryDate = new Date(expiryDate);
  if (Number.isNaN(parsedExpiryDate.getTime())) {
    throw new ApiError(400, "Invalid expiry date");
  }

  const parsedQuantity = parsePositiveNumber(quantity, "Quantity");
  const parsedMrp = parsePositiveNumber(mrp, "MRP");
  const parsedGstPercent =
    gstPercent === undefined ? 18 : parsePositiveNumber(gstPercent, "GST percent");

  const status = getInventoryStatus(parsedExpiryDate);

  const inventoryItem = await InventoryItem.create({
    retailerId: req.user.id,
    name: trimmedName,
    batchNumber: trimmedBatchNumber,
    quantity: parsedQuantity,
    expiryDate: parsedExpiryDate,
    mrp: parsedMrp,
    gstPercent: parsedGstPercent,
    status,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, inventoryItem, "Inventory added successfully"));
});

export const updateInventory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateInventoryId(id);

  const { name, batchNumber, quantity, expiryDate, mrp, gstPercent } = req.body;
  const updateData = {};

  if (name !== undefined) {
    const trimmedName = String(name).trim();
    if (!trimmedName) {
      throw new ApiError(400, "Name cannot be empty");
    }
    updateData.name = trimmedName;
  }

  if (batchNumber !== undefined) {
    const trimmedBatchNumber = String(batchNumber).trim();
    if (!trimmedBatchNumber) {
      throw new ApiError(400, "Batch number cannot be empty");
    }
    updateData.batchNumber = trimmedBatchNumber;
  }

  if (quantity !== undefined) {
    updateData.quantity = parsePositiveNumber(quantity, "Quantity");
  }

  if (mrp !== undefined) {
    updateData.mrp = parsePositiveNumber(mrp, "MRP");
  }

  if (gstPercent !== undefined) {
    updateData.gstPercent = parsePositiveNumber(gstPercent, "GST percent");
  }

  if (expiryDate !== undefined) {
    const parsedExpiryDate = new Date(expiryDate);
    if (Number.isNaN(parsedExpiryDate.getTime())) {
      throw new ApiError(400, "Invalid expiry date");
    }
    updateData.expiryDate = parsedExpiryDate;
    updateData.status = getInventoryStatus(parsedExpiryDate);
  }

  if (Object.keys(updateData).length === 0) {
    throw new ApiError(400, "No valid fields provided for update");
  }

  const updatedInventory = await InventoryItem.findOneAndUpdate(
    { _id: id, retailerId: req.user.id },
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (!updatedInventory) {
    throw new ApiError(404, "Inventory item not found");
  }

  if (expiryDate === undefined && updatedInventory.expiryDate) {
    const recalculatedStatus = getInventoryStatus(updatedInventory.expiryDate);
    if (updatedInventory.status !== recalculatedStatus) {
      updatedInventory.status = recalculatedStatus;
      await updatedInventory.save();
    }
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedInventory, "Inventory updated successfully"));
});

export const deleteInventory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateInventoryId(id);

  const deletedInventory = await InventoryItem.findOneAndDelete({
    _id: id,
    retailerId: req.user.id,
  });

  if (!deletedInventory) {
    throw new ApiError(404, "Inventory item not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, deletedInventory, "Inventory deleted successfully"));
});