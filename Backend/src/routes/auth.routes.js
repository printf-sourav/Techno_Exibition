import express from "express"

const router = express.Router()
import upload from "../middleware/upload.middleware.js"
import authMiddleware from "../middleware/auth.middleware.js"
import ApiResponse from "../utils/ApiResponse.js"

import {register,login,getMe} from "../controllers/auth.controller.js"
router.post("/",(req,res)=>{
    return res.status(200).json(new ApiResponse(200, null, "Auth API is healthy"))
})
router.post("/register",upload.single("licenseCertificate"),register)
router.post("/login", login)
router.get("/me",authMiddleware, getMe)

export default router

 