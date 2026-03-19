import express from "express";
import cors from "cors";
import errorHandler from "./src/utils/errorHandler.js";
const app = express();
app.use(cors());
app.use(express.json());

import authRoutes from "./src/routes/auth.routes.js"

app.use("/api/auth",authRoutes)



app.use(errorHandler);
export default app;