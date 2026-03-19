import mongoose from "mongoose";

const donationSchema = new mongoose.Schema(
{
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  recipientNgoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  inventoryItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "InventoryItem"
  },

  ngoNeedId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "NGONeed"
  },

  quantity: Number,

  status: {
    type: String,
    enum: ["pending","accepted","rejected","distributed"],
    default: "pending"
  },

  donatedAt: Date
},
{ timestamps: true }
);

export default mongoose.model("Donation", donationSchema);