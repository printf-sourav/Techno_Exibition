import express from "express";
import cors from "cors";
import errorHandler from "./utils/errorHandler.js";
const app = express();
app.use(cors());
app.use(express.json());
app.get("/", (req, res) => {
  res.send("API running");
});
//invalid route vala
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});
app.use(errorHandler);
export default app;