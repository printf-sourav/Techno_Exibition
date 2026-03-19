import mongoose from "mongoose";

const ngoNeedSchema = new mongoose.Schema(
{
  ngoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  medicineName: String,
  quantity: Number,
  urgency: {
    type: String,
    enum: ["low","medium","high"],
    default: "medium"
  },
  location: String,
  status: {
    type: String,
    enum: ["open","partially_fulfilled","fulfilled","closed"],
    default: "open"
  }
},
{ timestamps: true }
);
export default mongoose.model("NGONeed", ngoNeedSchema);