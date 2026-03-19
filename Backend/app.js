import express from "express";
import cors from "cors";
import errorHandler from "./src/utils/errorHandler.js";


const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API running");
});
import authRoutes from "./src/routes/auth.routes.js";
app.use("/api/auth", authRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use(errorHandler);
export default app;