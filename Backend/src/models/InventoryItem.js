import mongoose from "mongoose";
const inventoryItemSchema = new mongoose.Schema(
{
  retailerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  name: {
    type: String,
    required: true
  },
  batchNumber: String,
  quantity: {
    type: Number,
    required: true
  },
    expiryDate: Date,
  mrp: Number,
  gstPercent: Number,
  status: {
    type: String,
    enum: ["safe", "warning", "critical"],
    default: "safe"
  }
},
{ timestamps: true }
);
export default mongoose.model("InventoryItem", inventoryItemSchema);