import express from "express";
import cors from "cors";
import notificationRoutes from "./src/routes/notifications.routes.js";
import errorHandler from "./src/utils/errorHandler.js";
const app = express();
app.use(cors());
app.use(express.json());
app.get("/", (req, res) => {
  res.send("API running");
});
app.use("/notifications", notificationRoutes);
//invalid route vala
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});
app.use(errorHandler);

export default app;
