import mongoose from "mongoose";
import InventoryItem from "./InventoryItem";
const medicineOfferSchema=new mongoose.Schema(
    {
        retailerId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"user",
            required:true

        },
        InventoryItemId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"InventoryItem",
            required:true
        },
        medicineName:String,
        batchNumber:String,
        quantity:Number,
        pricePerPacket:Number,
        totalPrice:Number,
        status:{
            type:String,
            enum:["pending","accepted","rejected","complete"],
            default:"pending"
        }
    },{timestamps:true}
);
export default mongoose.model("MedicineOffer",medicineOfferSchema)
