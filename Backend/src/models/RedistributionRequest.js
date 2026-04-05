import mongoose from "mongoose";

const redistributionRequestSchema = new mongoose.Schema(
  {
    fromRetailerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    toRetailerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    inventoryItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InventoryItem",
      required: true,
    },
    medicineName: {
      type: String,
      required: true,
    },
    batchNumber: {
      type: String,
      default: "",
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unitPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    gstPercent: {
      type: Number,
      default: 0,
      min: 0,
    },
    modelConfidence: {
      type: Number,
      default: 0,
      min: 0,
      max: 1,
    },
    modelSuggestedStore: {
      type: String,
      default: "",
    },
    reason: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "rejected", "cancelled", "completed"],
      default: "pending",
    },
    respondedAt: Date,
    completedAt: Date,
  },
  { timestamps: true }
);

const RedistributionRequest =
  mongoose.models.RedistributionRequest ||
  mongoose.model("RedistributionRequest", redistributionRequestSchema);

export default RedistributionRequest;
