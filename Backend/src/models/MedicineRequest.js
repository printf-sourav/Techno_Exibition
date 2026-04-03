import mongoose from "mongoose";

const medicineRequestSchema = new mongoose.Schema(
	{
		hospitalId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		medicineName: {
			type: String,
			required: true,
		},
		quantity: {
			type: Number,
			required: true,
			min: 1,
		},
		priority: {
			type: String,
			enum: ["low", "medium", "high"],
			default: "medium",
		},
		status: {
			type: String,
			enum: ["pending", "matched", "accepted", "rejected", "completed"],
			default: "pending",
		},
	},
	{ timestamps: true }
);

const MedicineRequest =
	mongoose.models.MedicineRequest || mongoose.model("MedicineRequest", medicineRequestSchema);

export default MedicineRequest;