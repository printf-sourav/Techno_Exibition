import mongoose from "mongoose";

const wastePickupRequestSchema = new mongoose.Schema(
{
  requesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  wasteType: String,

  amount: Number,

  unit: {
    type: String,
    enum: ["kg","packets"]
  },

  pickupDate: Date,

  pickupTime: String,

  location: String,

  status: {
    type: String,
    enum: ["pending","assigned","in_progress","completed","cancelled"],
    default: "pending"
  },

  agencyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  assignedByAdminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  certUrl: String,

  requestedAt: Date
},
{ timestamps: true }
);

export default mongoose.model("WastePickupRequest", wastePickupRequestSchema);