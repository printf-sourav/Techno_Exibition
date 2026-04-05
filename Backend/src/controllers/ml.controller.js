import crypto from "crypto";
import mongoose from "mongoose";
import InventoryItem from "../models/InventoryItem.js";
import MedicineOffer from "../models/MedicineOffer.js";
import Notification from "../models/Notification.js";
import RedistributionRequest from "../models/RedistributionRequest.js";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { predictWasteBatch, predictRedistributionBatch } from "../services/mlInference.service.js";

const MODEL_CATEGORIES = [
  "Antibiotics",
  "Analgesics",
  "Antipyretics",
  "Antiseptics",
  "Supplements",
];

const STORE_LABELS = ["Store_A", "Store_B", "Store_C", "Store_D"];

const normalizeText = (value) => String(value || "").trim().toLowerCase();

const toFiniteNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const validateObjectId = (value, fieldName) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new ApiError(400, `Invalid ${fieldName}`);
  }
};

const parsePositiveNumber = (value, fieldName) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new ApiError(400, `${fieldName} must be greater than 0`);
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

const safeCreateNotification = async (payload) => {
  try {
    await Notification.create(payload);
  } catch {
    // Notifications are non-blocking side effects for redistribution flow.
  }
};

const getDaysUntilExpiry = (expiryDate) => {
  if (!expiryDate) {
    return 365;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);

  const diff = expiry.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const mapRetailerToStore = (retailerId) => {
  const digest = crypto.createHash("md5").update(String(retailerId)).digest("hex");
  const index = Number.parseInt(digest.slice(0, 8), 16) % STORE_LABELS.length;
  return STORE_LABELS[index];
};

const inferCategoryFromName = (medicineName) => {
  const name = normalizeText(medicineName);

  if (
    [
      "amox",
      "cillin",
      "cef",
      "floxacin",
      "cycline",
      "azithro",
      "antibiotic",
      "clav",
    ].some((term) => name.includes(term))
  ) {
    return "Antibiotics";
  }

  if (["betadine", "iodine", "chlorhex", "antiseptic", "sanit", "povidone"].some((term) => name.includes(term))) {
    return "Antiseptics";
  }

  if (["vitamin", "supplement", "protein", "zinc", "calcium", "iron", "folic", "omega"].some((term) => name.includes(term))) {
    return "Supplements";
  }

  if (["acetaminophen", "paracetamol", "fever", "antipyretic"].some((term) => name.includes(term))) {
    return "Antipyretics";
  }

  if (["ibuprofen", "diclofenac", "naproxen", "analgesic", "pain", "tramadol"].some((term) => name.includes(term))) {
    return "Analgesics";
  }

  return "Analgesics";
};

const getAverageMonthlySalesMap = async (retailerId) => {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const rows = await MedicineOffer.aggregate([
    {
      $match: {
        retailerId,
        status: { $in: ["accepted", "completed"] },
        createdAt: { $gte: ninetyDaysAgo },
      },
    },
    {
      $group: {
        _id: { $toLower: "$medicineName" },
        soldQuantity: { $sum: "$quantity" },
      },
    },
  ]);

  const map = new Map();
  rows.forEach((row) => {
    map.set(row._id, Math.max(1, Math.round(row.soldQuantity / 3)));
  });

  return map;
};

const buildOtherRetailerStockMap = async (retailerIds) => {
  if (!retailerIds.length) {
    return new Map();
  }

  const rows = await InventoryItem.aggregate([
    {
      $match: {
        retailerId: { $in: retailerIds },
        quantity: { $gt: 0 },
      },
    },
    {
      $group: {
        _id: {
          retailerId: "$retailerId",
          medicineKey: { $toLower: "$name" },
        },
        totalQuantity: { $sum: "$quantity" },
      },
    },
  ]);

  const map = new Map();
  rows.forEach((row) => {
    const key = `${row._id.retailerId.toString()}:${row._id.medicineKey}`;
    map.set(key, row.totalQuantity);
  });

  return map;
};

export const getRetailerMlInsights = asyncHandler(async (req, res) => {
  const inventoryItems = await InventoryItem.find({
    retailerId: req.user.id,
    quantity: { $gt: 0 },
  }).sort({ expiryDate: 1, createdAt: -1 });

  if (!inventoryItems.length) {
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          summary: {
            totalItems: 0,
            highRiskItems: 0,
            projectedLoss: 0,
          },
          expiryPredictions: [],
          redistributionSuggestions: [],
          generatedAt: new Date().toISOString(),
        },
        "No inventory available for ML analysis"
      )
    );
  }

  const salesByMedicine = await getAverageMonthlySalesMap(req.user._id);

  const modelInputs = inventoryItems.map((item) => {
    const medicineKey = normalizeText(item.name);
    const daysUntilExpiry = getDaysUntilExpiry(item.expiryDate);
    const fallbackSales = Math.max(1, Math.round(item.quantity / Math.max(daysUntilExpiry / 30, 1)));
    const avgMonthlySales = salesByMedicine.get(medicineKey) || fallbackSales;
    const unitPrice = Math.max(0, toFiniteNumber(item.mrp, 0));
    const category = MODEL_CATEGORIES.includes(item.category) ? item.category : inferCategoryFromName(item.name);

    return {
      inventoryItemId: item._id.toString(),
      medicineName: item.name,
      medicineKey,
      batchNumber: item.batchNumber || "",
      quantity: toFiniteNumber(item.quantity, 0),
      daysUntilExpiry,
      avgMonthlySales,
      unitPrice,
      category,
      status: item.status,
      current_stock: toFiniteNumber(item.quantity, 0),
      avg_monthly_sales: avgMonthlySales,
      days_until_expiry: Math.max(daysUntilExpiry, 0),
      unit_price: unitPrice,
    };
  });

  const wastePredictions = await predictWasteBatch(
    modelInputs.map((item) => ({
      current_stock: item.current_stock,
      avg_monthly_sales: item.avg_monthly_sales,
      days_until_expiry: item.days_until_expiry,
      unit_price: item.unit_price,
    }))
  );

  const expiryPredictions = modelInputs
    .map((input, index) => {
      const modelResult = wastePredictions[index] || {
        risk_probability: 0,
        will_expire_unused: false,
      };
      const riskProbability = Math.min(Math.max(toFiniteNumber(modelResult.risk_probability, 0), 0), 1);
      const estimatedLoss = Math.round(input.quantity * input.unitPrice * riskProbability);

      return {
        inventoryItemId: input.inventoryItemId,
        medicineName: input.medicineName,
        batchNumber: input.batchNumber,
        quantity: input.quantity,
        daysUntilExpiry: input.daysUntilExpiry,
        riskProbability,
        willExpireUnused: Boolean(modelResult.will_expire_unused),
        estimatedLoss,
        avgMonthlySales: input.avgMonthlySales,
        unitPrice: input.unitPrice,
        category: input.category,
        status: input.status,
      };
    })
    .sort((a, b) => b.riskProbability - a.riskProbability);

  const candidateExpiryItems = expiryPredictions.filter(
    (item) => item.riskProbability >= 0.6 && item.quantity > 0 && item.daysUntilExpiry <= 150
  );

  const otherRetailers = await User.find({
    _id: { $ne: req.user._id },
    role: "retailer",
    verificationStatus: "verified",
  }).select("name organizationName");

  const otherRetailerIds = otherRetailers.map((retailer) => retailer._id);
  const stockMap = await buildOtherRetailerStockMap(otherRetailerIds);

  const redistributionPredictions = candidateExpiryItems.length
    ? await predictRedistributionBatch(
        candidateExpiryItems.map((item) => ({
          category: item.category,
          avgMonthlySales: item.avgMonthlySales,
          currentStock: item.quantity,
          daysUntilExpiry: item.daysUntilExpiry,
        }))
      )
    : [];

  const redistributionSuggestions = [];

  for (const [index, item] of candidateExpiryItems.entries()) {
    const redistModel = redistributionPredictions[index] || {
      target_store: STORE_LABELS[0],
      confidence: 0,
    };

    const lowStockThreshold = Math.max(5, Math.round(item.avgMonthlySales * 0.4));

    const targetRetailers = otherRetailers
      .map((retailer) => {
        const retailerId = retailer._id.toString();
        const stockKey = `${retailerId}:${normalizeText(item.medicineName)}`;
        const currentStock = toFiniteNumber(stockMap.get(stockKey), 0);
        const isStockFinished = currentStock === 0;
        const isLowStock = currentStock <= lowStockThreshold;

        if (!isStockFinished && !isLowStock) {
          return null;
        }

        const mappedStore = mapRetailerToStore(retailerId);

        let priorityScore = 0;
        if (isStockFinished) {
          priorityScore += 60;
        } else {
          priorityScore += 30;
        }

        if (mappedStore === redistModel.target_store) {
          priorityScore += 25;
        }

        priorityScore += Math.max(0, 20 - currentStock);

        return {
          retailerId,
          retailerName: retailer.organizationName || retailer.name || "Retailer",
          currentStock,
          isStockFinished,
          mappedStore,
          priorityScore,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .slice(0, 3);

    if (!targetRetailers.length) {
      continue;
    }

    const recommendedTransferQuantity = Math.min(
      item.quantity,
      Math.max(5, Math.round(item.quantity * Math.min(item.riskProbability, 0.55)))
    );

    redistributionSuggestions.push({
      inventoryItemId: item.inventoryItemId,
      medicineName: item.medicineName,
      batchNumber: item.batchNumber,
      quantity: item.quantity,
      daysUntilExpiry: item.daysUntilExpiry,
      riskProbability: item.riskProbability,
      modelSuggestedStore: redistModel.target_store,
      modelConfidence: toFiniteNumber(redistModel.confidence, 0),
      recommendedTransferQuantity,
      targetRetailers,
    });
  }

  const highRiskItems = expiryPredictions.filter((item) => item.riskProbability >= 0.7).length;
  const projectedLoss = expiryPredictions.reduce((total, item) => total + item.estimatedLoss, 0);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        summary: {
          totalItems: expiryPredictions.length,
          highRiskItems,
          projectedLoss,
        },
        expiryPredictions,
        redistributionSuggestions,
        generatedAt: new Date().toISOString(),
      },
      "ML retailer insights fetched successfully"
    )
  );
});

export const getRetailerRedistributionRequests = asyncHandler(async (req, res) => {
  const [incoming, outgoing] = await Promise.all([
    RedistributionRequest.find({ toRetailerId: req.user.id })
      .populate("fromRetailerId", "name organizationName")
      .populate("toRetailerId", "name organizationName")
      .sort({ createdAt: -1 })
      .limit(100),
    RedistributionRequest.find({ fromRetailerId: req.user.id })
      .populate("fromRetailerId", "name organizationName")
      .populate("toRetailerId", "name organizationName")
      .sort({ createdAt: -1 })
      .limit(100),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        incoming,
        outgoing,
      },
      "Redistribution requests fetched successfully"
    )
  );
});

export const createRetailerRedistributionRequest = asyncHandler(async (req, res) => {
  const {
    inventoryItemId,
    targetRetailerId,
    quantity,
    modelConfidence,
    modelSuggestedStore,
    reason,
  } = req.body;

  if (!inventoryItemId || !targetRetailerId || quantity === undefined) {
    throw new ApiError(400, "inventoryItemId, targetRetailerId and quantity are required");
  }

  validateObjectId(inventoryItemId, "inventory item id");
  validateObjectId(targetRetailerId, "target retailer id");

  if (String(targetRetailerId) === String(req.user.id)) {
    throw new ApiError(400, "Target retailer must be different from source retailer");
  }

  const transferQuantity = parsePositiveNumber(quantity, "Quantity");

  const [sourceInventory, targetRetailer] = await Promise.all([
    InventoryItem.findOne({
      _id: inventoryItemId,
      retailerId: req.user.id,
    }),
    User.findOne({
      _id: targetRetailerId,
      role: "retailer",
      verificationStatus: "verified",
    }).select("name organizationName"),
  ]);

  if (!sourceInventory) {
    throw new ApiError(404, "Inventory item not found");
  }

  if (!targetRetailer) {
    throw new ApiError(404, "Target retailer not found or not verified");
  }

  if (sourceInventory.quantity < transferQuantity) {
    throw new ApiError(400, "Insufficient inventory quantity for redistribution");
  }

  const existingPendingRequest = await RedistributionRequest.findOne({
    fromRetailerId: req.user.id,
    toRetailerId: targetRetailerId,
    inventoryItemId,
    status: "pending",
  });

  if (existingPendingRequest) {
    throw new ApiError(409, "A pending redistribution request already exists for this item and retailer");
  }

  const redistributionRequest = await RedistributionRequest.create({
    fromRetailerId: req.user.id,
    toRetailerId: targetRetailerId,
    inventoryItemId: sourceInventory._id,
    medicineName: sourceInventory.name,
    batchNumber: sourceInventory.batchNumber || "",
    quantity: transferQuantity,
    unitPrice: toFiniteNumber(sourceInventory.mrp, 0),
    gstPercent: toFiniteNumber(sourceInventory.gstPercent, 0),
    modelConfidence: Math.min(Math.max(toFiniteNumber(modelConfidence, 0), 0), 1),
    modelSuggestedStore: String(modelSuggestedStore || ""),
    reason: String(reason || "AI redistribution recommendation"),
    status: "pending",
  });

  await safeCreateNotification({
    userId: targetRetailer._id,
    type: "redistribution_update",
    title: "Redistribution Request Received",
    message: `${req.user.organizationName || req.user.name || "A retailer"} wants to transfer ${transferQuantity} units of ${sourceInventory.name}.`,
    entityType: "redistribution",
    entityId: redistributionRequest._id,
  });

  const populatedRequest = await RedistributionRequest.findById(redistributionRequest._id)
    .populate("fromRetailerId", "name organizationName")
    .populate("toRetailerId", "name organizationName");

  return res.status(201).json(
    new ApiResponse(201, populatedRequest, "Redistribution request created successfully")
  );
});

export const respondRetailerRedistributionRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { action } = req.body;

  validateObjectId(id, "redistribution request id");

  const normalizedAction = String(action || "").trim().toLowerCase();
  if (!["accept", "reject"].includes(normalizedAction)) {
    throw new ApiError(400, "action must be either accept or reject");
  }

  const requestDoc = await RedistributionRequest.findById(id);

  if (!requestDoc) {
    throw new ApiError(404, "Redistribution request not found");
  }

  if (String(requestDoc.toRetailerId) !== String(req.user.id)) {
    throw new ApiError(403, "Access denied for this redistribution request");
  }

  if (requestDoc.status !== "pending") {
    throw new ApiError(400, "Only pending requests can be updated");
  }

  if (normalizedAction === "reject") {
    requestDoc.status = "rejected";
    requestDoc.respondedAt = new Date();
    await requestDoc.save();

    await safeCreateNotification({
      userId: requestDoc.fromRetailerId,
      type: "redistribution_update",
      title: "Redistribution Request Rejected",
      message: `Your redistribution request for ${requestDoc.medicineName} was rejected.`,
      entityType: "redistribution",
      entityId: requestDoc._id,
    });

    const populatedRejected = await RedistributionRequest.findById(requestDoc._id)
      .populate("fromRetailerId", "name organizationName")
      .populate("toRetailerId", "name organizationName");

    return res
      .status(200)
      .json(new ApiResponse(200, populatedRejected, "Redistribution request rejected"));
  }

  const sourceInventory = await InventoryItem.findOneAndUpdate(
    {
      _id: requestDoc.inventoryItemId,
      retailerId: requestDoc.fromRetailerId,
      quantity: { $gte: requestDoc.quantity },
    },
    {
      $inc: {
        quantity: -requestDoc.quantity,
      },
    },
    {
      new: true,
    }
  );

  if (!sourceInventory) {
    requestDoc.status = "cancelled";
    requestDoc.respondedAt = new Date();
    await requestDoc.save();

    throw new ApiError(409, "Source retailer no longer has sufficient stock for this transfer");
  }

  sourceInventory.status = getInventoryStatus(sourceInventory.expiryDate);
  await sourceInventory.save();

  let targetInventory;

  try {
    targetInventory = await InventoryItem.findOne({
      retailerId: requestDoc.toRetailerId,
      name: requestDoc.medicineName,
      batchNumber: requestDoc.batchNumber || "",
    });

    if (targetInventory) {
      targetInventory.quantity += requestDoc.quantity;
      targetInventory.status = getInventoryStatus(targetInventory.expiryDate || sourceInventory.expiryDate);

      if (!targetInventory.expiryDate && sourceInventory.expiryDate) {
        targetInventory.expiryDate = sourceInventory.expiryDate;
      }

      if (!targetInventory.mrp && requestDoc.unitPrice) {
        targetInventory.mrp = requestDoc.unitPrice;
      }

      if (!targetInventory.gstPercent && requestDoc.gstPercent) {
        targetInventory.gstPercent = requestDoc.gstPercent;
      }

      await targetInventory.save();
    } else {
      targetInventory = await InventoryItem.create({
        retailerId: requestDoc.toRetailerId,
        name: requestDoc.medicineName,
        batchNumber: requestDoc.batchNumber || "",
        quantity: requestDoc.quantity,
        expiryDate: sourceInventory.expiryDate,
        mrp: requestDoc.unitPrice,
        gstPercent: requestDoc.gstPercent,
        status: getInventoryStatus(sourceInventory.expiryDate),
      });
    }
  } catch (error) {
    sourceInventory.quantity += requestDoc.quantity;
    sourceInventory.status = getInventoryStatus(sourceInventory.expiryDate);
    await sourceInventory.save();

    throw error;
  }

  requestDoc.status = "completed";
  requestDoc.respondedAt = new Date();
  requestDoc.completedAt = new Date();
  await requestDoc.save();

  await safeCreateNotification({
    userId: requestDoc.fromRetailerId,
    type: "redistribution_update",
    title: "Redistribution Completed",
    message: `${requestDoc.quantity} units of ${requestDoc.medicineName} were accepted and transferred.`,
    entityType: "redistribution",
    entityId: requestDoc._id,
  });

  const populatedCompleted = await RedistributionRequest.findById(requestDoc._id)
    .populate("fromRetailerId", "name organizationName")
    .populate("toRetailerId", "name organizationName");

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        request: populatedCompleted,
        sourceInventory,
        targetInventory,
      },
      "Redistribution request accepted and inventory transferred"
    )
  );
});

export const cancelRetailerRedistributionRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;

  validateObjectId(id, "redistribution request id");

  const requestDoc = await RedistributionRequest.findById(id);

  if (!requestDoc) {
    throw new ApiError(404, "Redistribution request not found");
  }

  if (String(requestDoc.fromRetailerId) !== String(req.user.id)) {
    throw new ApiError(403, "Access denied for this redistribution request");
  }

  if (requestDoc.status !== "pending") {
    throw new ApiError(400, "Only pending requests can be cancelled");
  }

  requestDoc.status = "cancelled";
  requestDoc.respondedAt = new Date();
  await requestDoc.save();

  await safeCreateNotification({
    userId: requestDoc.toRetailerId,
    type: "redistribution_update",
    title: "Redistribution Request Cancelled",
    message: `A redistribution request for ${requestDoc.medicineName} has been cancelled by sender.`,
    entityType: "redistribution",
    entityId: requestDoc._id,
  });

  const populatedCancelled = await RedistributionRequest.findById(requestDoc._id)
    .populate("fromRetailerId", "name organizationName")
    .populate("toRetailerId", "name organizationName");

  return res
    .status(200)
    .json(new ApiResponse(200, populatedCancelled, "Redistribution request cancelled"));
});
