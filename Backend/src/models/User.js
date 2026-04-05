import mongoose from "mongoose";
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,

    },
    role: {
      type: String,
      enum: ["retailer", "hospital", "ngo", "waste", "admin"],
      required: true
    },
    name: String,
    organizationName: String,
    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending"
    },
    phone: String,
    address: String,
    licenseNumber: String,
    gstNumber: String,
    licenseCertificateUrl: String,
    hospitalRegNumber: String,
    ngoRegNumber: String,
    cpcbLicense: String,
    serviceArea: String
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);