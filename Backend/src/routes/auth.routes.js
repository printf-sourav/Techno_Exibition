import express from "express"

const router = express.Router()
import upload from "../middleware/upload.middleware.js"
import authMiddleware from "../middleware/auth.middleware.js"

import {register,login,getMe} from "../controllers/auth.controller.js"
router.post("/",(req,res)=>{
    res.status(200)
})
router.post("/register",upload.single("licenseCertificate"),register)
router.post("/login", login)
router.get("/me",authMiddleware, getMe)

export default router

 