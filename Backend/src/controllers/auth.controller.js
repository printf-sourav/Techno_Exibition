import bcrypt from "bcryptjs"
import User from "../models/User.js"
import {generateToken} from "../utils/jwt.js"
import asyncHandler from "../utils/asyncHandler.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
};

const publicRegistrationRoles = new Set(["retailer", "hospital", "ngo", "waste"])

const isBlank = (value) => value === undefined || value === null || String(value).trim() === ""

export const register = asyncHandler(async(req,res)=>{
    const payload = req.body && typeof req.body === "object" ? req.body : {}

    const {
        name,
        email,
        password,
        role,
        organizationName,
        licenseNumber,
        gstNumber,
        registrationNumber,
        hospitalRegNumber,
        ngoRegNumber,
        cpcbLicense,
        serviceArea,
        address,
        phone,
        contactNumber
    } = payload

    const requestedRole = String(role || "").trim().toLowerCase()

    if (!publicRegistrationRoles.has(requestedRole)) {
        throw new ApiError(400, "Role must be one of retailer, hospital, ngo, waste")
    }

    if (
        isBlank(name) ||
        isBlank(email) ||
        isBlank(password) ||
        isBlank(organizationName) ||
        isBlank(address) ||
        (isBlank(phone) && isBlank(contactNumber))
    ) {
        throw new ApiError(400, "Missing required registration fields")
    }

    if (requestedRole === "retailer" && (isBlank(licenseNumber) || isBlank(gstNumber))) {
        throw new ApiError(400, "Retailer registration requires licenseNumber and gstNumber")
    }

    if (requestedRole === "hospital" && isBlank(hospitalRegNumber) && isBlank(registrationNumber)) {
        throw new ApiError(400, "Hospital registration requires registrationNumber")
    }

    if (requestedRole === "ngo" && isBlank(ngoRegNumber) && isBlank(registrationNumber)) {
        throw new ApiError(400, "NGO registration requires registrationNumber")
    }

    if (requestedRole === "waste" && (isBlank(cpcbLicense) && isBlank(licenseNumber))) {
        throw new ApiError(400, "Waste registration requires licenseNumber")
    }

    const existingUser = await User.findOne({email});
    if(existingUser) {
        throw new ApiError(409,"User already exists");
    }

    const hashedPassword = await bcrypt.hash(password,10)

    const certificateFile =
        req.file ||
        req.files?.licenseCertificate?.[0] ||
        req.files?.registrationCertificate?.[0] ||
        req.files?.authorizationCertificate?.[0]

    const licenseCertificateUrl = certificateFile?.path || ""

    const userPayload = {
        name,
        email,
        passwordHash: hashedPassword,
        role: requestedRole,
        organizationName,
        licenseCertificateUrl,
        address,
        phone: phone || contactNumber,
        verificationStatus: "pending"
    }

    if (requestedRole === "retailer") {
        userPayload.licenseNumber = licenseNumber
        userPayload.gstNumber = gstNumber
    }

    if (requestedRole === "hospital") {
        userPayload.hospitalRegNumber = hospitalRegNumber || registrationNumber
    }

    if (requestedRole === "ngo") {
        userPayload.ngoRegNumber = ngoRegNumber || registrationNumber
    }

    if (requestedRole === "waste") {
        userPayload.cpcbLicense = cpcbLicense || licenseNumber
        userPayload.serviceArea = serviceArea
        userPayload.licenseNumber = licenseNumber
    }

    const user = await User.create(userPayload)
    const token = generateToken(user._id)

    const safeUser = user.toObject()
    delete safeUser.passwordHash

    return res.status(201)
    .cookie("token", token, cookieOptions)
    .json(new ApiResponse(201,{
        user:safeUser,
        token
    },"Registration successful. Awaiting verification."))
})

export const login = asyncHandler(async(req,res)=>{
    const payload = req.body && typeof req.body === "object" ? req.body : {}
    const { email, password } = payload
    
    if(!email||!password) {
        throw new ApiError(400,"Email or password missing")
    }

    const user = await User.findOne({email})
    if(!user){
        throw new ApiError(404,"User not found")
    }

    const passMatched = await bcrypt.compare(password,user.passwordHash)
    if(!passMatched){
        throw new ApiError(400,"Invalid credentials")
    }

    const token = generateToken(user._id)
    
    return res.status(200)
    .cookie("token", token, cookieOptions)
    .json(
        new ApiResponse(200,{user,token},"User loggedin Successfully")
    )
})


export const getMe= asyncHandler(async(req,res)=>{
    if(!req.user){
        throw new ApiError(404,"User Not found")
    }
    const user = await User.findById(req.user.id).select("-passwordHash")
    

    return res.status(200).json(
        new ApiResponse(
        200,
        user,
        "User fetched successfully"
    )
  )
})
