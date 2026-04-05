import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import ApiError from "../utils/ApiError.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inferenceScriptPath = path.resolve(__dirname, "../ml/inference.py");
const workspaceVenvPython = path.resolve(__dirname, "../../../.venv/bin/python");
const backendVenvPython = path.resolve(__dirname, "../../.venv/bin/python");

const pythonExecutable =
  process.env.PYTHON_BIN ||
  (fs.existsSync(workspaceVenvPython)
    ? workspaceVenvPython
    : fs.existsSync(backendVenvPython)
      ? backendVenvPython
      : "python3");
const defaultTimeoutMs = Number(process.env.ML_INFERENCE_TIMEOUT_MS || 15000);

const runInference = (mode, payload) =>
  new Promise((resolve, reject) => {
    const worker = spawn(pythonExecutable, [inferenceScriptPath, mode], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    const timeout = setTimeout(() => {
      worker.kill("SIGKILL");
      reject(new ApiError(504, "ML inference timed out"));
    }, defaultTimeoutMs);

    worker.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    worker.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    worker.on("error", () => {
      clearTimeout(timeout);
      reject(
        new ApiError(
          500,
          "Failed to start Python inference process. Set PYTHON_BIN or install python3 in server environment."
        )
      );
    });

    worker.on("close", (code) => {
      clearTimeout(timeout);

      let parsed;
      try {
        parsed = JSON.parse(stdout || "{}");
      } catch {
        reject(new ApiError(500, `Invalid ML response: ${stderr || "unknown error"}`));
        return;
      }

      if (code !== 0 || parsed.success === false) {
        reject(new ApiError(500, parsed.error || stderr || "ML inference failed"));
        return;
      }

      resolve(parsed.data);
    });

    worker.stdin.write(JSON.stringify(payload || {}));
    worker.stdin.end();
  });

export const predictWasteBatch = async (items) => runInference("waste", { items });

export const predictRedistribution = async ({
  category,
  avgMonthlySales,
  currentStock,
  daysUntilExpiry,
}) =>
  runInference("redistribution", {
    category,
    avg_monthly_sales: avgMonthlySales,
    current_stock: currentStock,
    days_until_expiry: daysUntilExpiry,
  });

export const predictRedistributionBatch = async (items) =>
  runInference("redistribution_batch", {
    items: (items || []).map((item) => ({
      category: item.category,
      avg_monthly_sales: item.avgMonthlySales,
      current_stock: item.currentStock,
      days_until_expiry: item.daysUntilExpiry,
    })),
  });
