import express from "express";
import cors from "cors";
import errorHandler from "./src/utils/errorHandler.js";
import notificationRoutes from "./src/routes/notifications.routes.js";
import authRoutes from "./src/routes/auth.routes.js";
import marketplaceRoutes from "./src/routes/marketplace.routes.js";


const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API running");
});
app.use("/notifications", notificationRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/marketplace", marketplaceRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});


app.use(errorHandler);

export default app;
