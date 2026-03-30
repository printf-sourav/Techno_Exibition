import mongoose from "mongoose";

const medicineOfferSchema = new mongoose.Schema(
	{
		retailerId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		hospitalId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
		},
		requestId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "MedicineRequest",
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
		pricePerPacket: {
			type: Number,
			required: true,
			min: 0,
		},
		totalPrice: {
			type: Number,
			required: true,
			min: 0,
		},
		status: {
			type: String,
			enum: ["pending", "accepted", "rejected", "completed"],
			default: "pending",
		},
	},
	{ timestamps: true }
);

const MedicineOffer =
	mongoose.models.MedicineOffer || mongoose.model("MedicineOffer", medicineOfferSchema);

export default MedicineOffer;
