import mongoose from "mongoose";

const authSessionSchema = new mongoose.Schema(
{
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  refreshTokenHash: {
    type: String,
    required: true
  },

  userAgent: String,

  ipAddress: String,

  expiresAt: Date,

  revokedAt: Date
},
{ timestamps: true }
);

export default mongoose.model("AuthSession", authSessionSchema);