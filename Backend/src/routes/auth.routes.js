import express from "express"

const router = express.Router()

import {register,login,getMe} from "../controllers/auth.controller.js"

router.post("/register", register)
router.post("/login", login)
router.get("/me", getMe)

export default router

 