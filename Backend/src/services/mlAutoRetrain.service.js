import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, "../../");
const trainScriptPath = path.resolve(__dirname, "../scripts/trainMlFromHistory.js");

const DAY_MS = 24 * 60 * 60 * 1000;

let schedulerHandle = null;
let isTraining = false;

const toBool = (value, defaultValue = false) => {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }

  const normalized = String(value).trim().toLowerCase();
  return ["1", "true", "yes", "y", "on"].includes(normalized);
};

const parseScheduleToMs = () => {
  const raw = String(process.env.ML_AUTO_RETRAIN_SCHEDULE || "daily").trim().toLowerCase();

  if (raw === "daily") {
    return DAY_MS;
  }

  if (raw === "weekly") {
    return 7 * DAY_MS;
  }

  const match = raw.match(/^(\d+)(m|h|d)$/);
  if (match) {
    const amount = Number.parseInt(match[1], 10);
    const unit = match[2];

    if (!Number.isFinite(amount) || amount <= 0) {
      return DAY_MS;
    }

    if (unit === "m") {
      return amount * 60 * 1000;
    }

    if (unit === "h") {
      return amount * 60 * 60 * 1000;
    }

    return amount * DAY_MS;
  }

  return DAY_MS;
};

const formatInterval = (ms) => {
  if (ms % (7 * DAY_MS) === 0) {
    return `${ms / (7 * DAY_MS)} week(s)`;
  }

  if (ms % DAY_MS === 0) {
    return `${ms / DAY_MS} day(s)`;
  }

  if (ms % (60 * 60 * 1000) === 0) {
    return `${ms / (60 * 60 * 1000)} hour(s)`;
  }

  return `${Math.round(ms / 60000)} minute(s)`;
};

const logChunk = (prefix, chunk) => {
  const lines = String(chunk)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  lines.forEach((line) => {
    console.log(`${prefix} ${line}`);
  });
};

const runRetraining = (trigger) => {
  if (isTraining) {
    console.log(`[ML-AUTO] Skipping ${trigger} retraining because a previous run is still in progress.`);
    return;
  }

  isTraining = true;
  console.log(`[ML-AUTO] Starting retraining (${trigger})...`);

  const worker = spawn(process.execPath, [trainScriptPath], {
    cwd: backendRoot,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
  });

  worker.stdout.on("data", (chunk) => {
    logChunk("[ML-AUTO][OUT]", chunk);
  });

  worker.stderr.on("data", (chunk) => {
    logChunk("[ML-AUTO][ERR]", chunk);
  });

  worker.on("error", (error) => {
    isTraining = false;
    console.error(`[ML-AUTO] Failed to launch retraining process: ${error.message}`);
  });

  worker.on("close", (code) => {
    isTraining = false;
    if (code === 0) {
      console.log(`[ML-AUTO] Retraining finished successfully (${trigger}).`);
    } else {
      console.error(`[ML-AUTO] Retraining failed (${trigger}) with exit code ${code}.`);
    }
  });
};

export const startMlAutoRetrainScheduler = () => {
  const enabled = toBool(process.env.ML_AUTO_RETRAIN_ENABLED, true);
  if (!enabled) {
    console.log("[ML-AUTO] Automatic retraining is disabled.");
    return null;
  }

  const intervalMs = parseScheduleToMs();
  const runOnStartup = toBool(process.env.ML_AUTO_RETRAIN_RUN_ON_STARTUP, false);
  const startupDelayMinutes = Math.max(0, Number(process.env.ML_AUTO_RETRAIN_START_DELAY_MINUTES || 3));

  if (schedulerHandle) {
    clearInterval(schedulerHandle);
    schedulerHandle = null;
  }

  schedulerHandle = setInterval(() => {
    runRetraining("scheduled");
  }, intervalMs);

  console.log(`[ML-AUTO] Scheduler active. Interval: ${formatInterval(intervalMs)}.`);
  console.log("[ML-AUTO] Use ML_AUTO_RETRAIN_SCHEDULE=daily|weekly|<number>h|<number>d to customize.");

  if (runOnStartup) {
    const delayMs = startupDelayMinutes * 60 * 1000;
    console.log(`[ML-AUTO] Startup retraining queued in ${startupDelayMinutes} minute(s).`);

    setTimeout(() => {
      runRetraining("startup");
    }, delayMs);
  }

  return {
    stop: () => {
      if (schedulerHandle) {
        clearInterval(schedulerHandle);
        schedulerHandle = null;
      }
    },
  };
};
