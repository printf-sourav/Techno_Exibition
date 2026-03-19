import mongoose from "mongoose";
const connectdb=async()=>{
    try{
        await mongoose.connect(process.env.MONGO_URI);
        console.log("mongo connected");
    } catch(error){
        console.error("mongo conn fail", error.message);
        process.exit(1);
    }
};
export default connectdb;