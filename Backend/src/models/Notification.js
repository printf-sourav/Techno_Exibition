import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
{
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  type: {
    type: String,
    enum: [
      "offer_created",
      "request_matched",
      "donation_update",
      "pickup_assigned",
      "verification_update"
    ]
  },
  title: String,
  message: String,
  entityType: {
    type: String,
    enum: ["offer","request","donation","pickup","user"]
  },
  entityId: mongoose.Schema.Types.ObjectId,
  isRead: {
    type: Boolean,
    default: false
  }
},
{ timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);