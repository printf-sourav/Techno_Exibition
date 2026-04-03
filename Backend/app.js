import express from "express";
import cors from "cors";
import errorHandler from "./src/utils/errorHandler.js";
import notificationRoutes from "./src/routes/notifications.routes.js";
import authRoutes from "./src/routes/auth.routes.js";
import marketplaceRoutes from "./src/routes/marketplace.routes.js";
import inventoryRoutes from "./src/routes/inventory.routes.js";
import donationRoutes from "./src/routes/donations.routes.js";
import wasteRoutes from "./src/routes/waste.routes.js";
import adminRoutes from "./src/routes/admin.routes.js";


const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API running");
});
app.use("/notifications", notificationRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/marketplace", marketplaceRoutes);

app.use("/notifications", notificationRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/waste", wasteRoutes);
app.use("/api/admin", adminRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});


app.use(errorHandler);

export default app;
