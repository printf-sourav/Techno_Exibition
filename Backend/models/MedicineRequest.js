import mongoose from "mongoose";
const medicineRequestSchema = new mongoose.Schema(
{
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  medicineName: {
    type: String,
    required: true
  },
  quantity: Number,
  priority: {
    type: String,
    enum: ["low","medium","high"],
    default: "medium"
  },
  notes: String,
  status: {
    type: String,
    enum: ["pending","matched","accepted","rejected","completed"],
    default: "pending"
  }
},
{ timestamps: true }
);
export default mongoose.model("MedicineRequest", medicineRequestSchema);