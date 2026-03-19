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

export const register = asyncHandler(async(req,res)=>{
    const {
      name,
      email,
      password,
      organizationName,
      licenseNumber,
      gstNumber,
      address,
      phone
    } = req.body

    const existingUser = await User.findOne({email});
    if(existingUser) {
        throw new ApiError(409,"User already exists");
    }

    const hashedPassword = await bcrypt.hash(password,10)

    let licenseCertificateUrl = ""

    if(req.file){
        licenseCertificateUrl=req.file.path
    }

    const user = await User.create({
        name,
        email,
        passwordHash: hashedPassword,
        role: "retailer",
        organizationName,
        licenseNumber,
        gstNumber,
        licenseCertificateUrl,
        address,
        phone,
        verificationStatus: "pending"
    })
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

    const { email, password } = req.body
    
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
