
import app from "./app.js";
import connectDB from "./src/config/db.js";
import dotenv from "dotenv";
import { startMlAutoRetrainScheduler } from "./src/services/mlAutoRetrain.service.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    startMlAutoRetrainScheduler();
  });
};

startServer().catch((error) => {
  console.error("Failed to start server:", error.message);
  process.exit(1);
});