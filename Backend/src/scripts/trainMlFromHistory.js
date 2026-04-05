import crypto from "crypto";
import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import InventoryItem from "../models/InventoryItem.js";
import MedicineOffer from "../models/MedicineOffer.js";
import MedicineRequest from "../models/MedicineRequest.js";
import Donation from "../models/Donation.js";
import NGONeed from "../models/NGONeed.js";
import WastePickupRequest from "../models/WastePickupRequest.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mlDir = path.resolve(__dirname, "../ml");
const datasetPath = path.resolve(mlDir, "medisync_training_data.csv");
const trainerPath = path.resolve(mlDir, "train_models.py");
const workspaceVenvPython = path.resolve(__dirname, "../../../.venv/bin/python");
const backendVenvPython = path.resolve(__dirname, "../../.venv/bin/python");

const STORE_LABELS = ["Store_A", "Store_B", "Store_C", "Store_D"];

const MODEL_CATEGORIES = [
  "Antibiotics",
  "Analgesics",
  "Antipyretics",
  "Antiseptics",
  "Supplements",
];

const OFFER_STATUS_WEIGHT = {
  completed: 1,
  accepted: 0.85,
  pending: 0.3,
  rejected: 0.05,
};

const DONATION_STATUS_WEIGHT = {
  distributed: 0.9,
  accepted: 0.7,
  pending: 0.35,
  rejected: 0.1,
};

const REQUEST_STATUS_WEIGHT = {
  completed: 1.2,
  accepted: 1.05,
  matched: 0.95,
  pending: 0.75,
  rejected: 0.1,
};

const REQUEST_PRIORITY_WEIGHT = {
  high: 1.3,
  medium: 1,
  low: 0.8,
};

const NEED_STATUS_WEIGHT = {
  fulfilled: 1.1,
  partially_fulfilled: 0.95,
  open: 0.8,
  closed: 0.5,
};

const NEED_URGENCY_WEIGHT = {
  high: 1.25,
  medium: 1,
  low: 0.8,
};

const WASTE_PICKUP_STATUS_WEIGHT = {
  completed: 1.1,
  in_progress: 0.95,
  assigned: 0.8,
  pending: 0.55,
  cancelled: 0.1,
};

const normalizeText = (value) => String(value || "").trim().toLowerCase();

const toFiniteNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const SYNTHETIC_MULTIPLIER = Math.max(0, Math.round(toFiniteNumber(process.env.ML_SYNTHETIC_MULTIPLIER, 8)));

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const deterministicUnit = (seed, salt = "") => {
  const digest = crypto.createHash("md5").update(`${seed}:${salt}`).digest("hex");
  const denominator = 0xffffffff;
  return Number.parseInt(digest.slice(0, 8), 16) / denominator;
};

const mapAdd = (map, key, value) => {
  if (!key) {
    return;
  }

  map.set(key, toFiniteNumber(map.get(key), 0) + toFiniteNumber(value, 0));
};

const getDaysUntilExpiry = (expiryDate) => {
  if (!expiryDate) {
    return 365;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);

  const diff = expiry.getTime() - today.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

const mapRetailerToStore = (retailerId) => {
  const digest = crypto.createHash("md5").update(String(retailerId)).digest("hex");
  const index = Number.parseInt(digest.slice(0, 8), 16) % STORE_LABELS.length;
  return STORE_LABELS[index];
};

const pickWeightedStore = (entries, seed) => {
  const safeEntries = entries.filter((entry) => entry.weight > 0);
  if (!safeEntries.length) {
    return STORE_LABELS[0];
  }

  const totalWeight = safeEntries.reduce((sum, entry) => sum + entry.weight, 0);
  let target = deterministicUnit(seed, "store") * totalWeight;

  for (const entry of safeEntries) {
    target -= entry.weight;
    if (target <= 0) {
      return entry.store;
    }
  }

  return safeEntries[safeEntries.length - 1].store;
};

const jitterValue = (value, maxPercent, minValue, seed, salt) => {
  const delta = deterministicUnit(seed, salt) * 2 - 1;
  const nextValue = value * (1 + maxPercent * delta);
  return Math.max(minValue, nextValue);
};

const inferCategoryFromName = (medicineName) => {
  const name = normalizeText(medicineName);

  if (
    [
      "amox",
      "cillin",
      "cef",
      "floxacin",
      "cycline",
      "azithro",
      "antibiotic",
      "clav",
    ].some((term) => name.includes(term))
  ) {
    return "Antibiotics";
  }

  if (["betadine", "iodine", "chlorhex", "antiseptic", "sanit", "povidone"].some((term) => name.includes(term))) {
    return "Antiseptics";
  }

  if (["vitamin", "supplement", "protein", "zinc", "calcium", "iron", "folic", "omega"].some((term) => name.includes(term))) {
    return "Supplements";
  }

  if (["acetaminophen", "paracetamol", "fever", "antipyretic"].some((term) => name.includes(term))) {
    return "Antipyretics";
  }

  if (["ibuprofen", "diclofenac", "naproxen", "analgesic", "pain", "tramadol"].some((term) => name.includes(term))) {
    return "Analgesics";
  }

  return "Analgesics";
};

const buildCategoryStoreScores = ({
  demandByStoreCategory,
  stockByStoreCategory,
  wasteByStoreCategory,
  globalDemandByCategory,
}) => {
  const scores = new Map();

  MODEL_CATEGORIES.forEach((category) => {
    const categoryEntries = STORE_LABELS.map((store) => {
      const key = `${store}:${category}`;
      const demand = toFiniteNumber(demandByStoreCategory.get(key), 0);
      const stock = toFiniteNumber(stockByStoreCategory.get(key), 0);
      const wastePressure = toFiniteNumber(wasteByStoreCategory.get(key), 0);
      const globalDemandBoost = toFiniteNumber(globalDemandByCategory.get(category), 0) * 0.45 / STORE_LABELS.length;

      const shortageScore = demand + globalDemandBoost - stock * 0.2 - wastePressure * 0.08 + 12;

      return {
        store,
        score: Math.max(1, shortageScore),
      };
    }).sort((a, b) => b.score - a.score);

    scores.set(category, categoryEntries);
  });

  return scores;
};

const chooseTargetStore = ({
  category,
  currentStock,
  avgMonthlySales,
  daysUntilExpiry,
  sourceStore,
  categoryStoreScores,
}) => {
  const ranking = categoryStoreScores.get(category) || STORE_LABELS.map((store) => ({ store, score: 1 }));
  const topStores = ranking.map((entry) => entry.store);
  const stockPressure = currentStock / Math.max(avgMonthlySales, 1);

  let preferredRankIndex = 0;

  if (daysUntilExpiry <= 25) {
    preferredRankIndex = 0;
  } else if (daysUntilExpiry <= 55) {
    preferredRankIndex = 1;
  } else if (daysUntilExpiry <= 110) {
    preferredRankIndex = 2;
  } else {
    preferredRankIndex = 3;
  }

  if (stockPressure >= 24) {
    preferredRankIndex = Math.max(0, preferredRankIndex - 1);
  } else if (stockPressure <= 7) {
    preferredRankIndex = Math.min(3, preferredRankIndex + 1);
  }

  if (sourceStore && stockPressure <= 10 && daysUntilExpiry > 120) {
    return sourceStore;
  }

  const safeIndex = Math.min(Math.max(preferredRankIndex, 0), topStores.length - 1);
  return topStores[safeIndex] || topStores[0] || STORE_LABELS[0];
};

const toCsv = (rows, columns) => {
  const escape = (value) => {
    const text = String(value ?? "");
    return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  };

  const header = columns.join(",");
  const body = rows.map((row) => columns.map((column) => escape(row[column])).join(",")).join("\n");

  return `${header}\n${body}\n`;
};

const detectPythonExecutable = () =>
  process.env.PYTHON_BIN ||
  (fs.existsSync(workspaceVenvPython)
    ? workspaceVenvPython
    : fs.existsSync(backendVenvPython)
      ? backendVenvPython
      : "python3");

const runPythonTrainer = async () => {
  const pythonExecutable = detectPythonExecutable();

  return new Promise((resolve, reject) => {
    const worker = spawn(pythonExecutable, [trainerPath, "--dataset", datasetPath, "--model-dir", mlDir], {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    worker.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    worker.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    worker.on("error", () => {
      reject(new Error("Failed to start Python trainer. Set PYTHON_BIN or ensure python3 is available."));
    });

    worker.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr || "Python trainer failed"));
        return;
      }

      resolve(stdout.trim());
    });
  });
};

const buildSyntheticRows = (baseRows, categoryStoreScores, count) => {
  if (!baseRows.length || count <= 0) {
    return [];
  }

  const syntheticRows = [];

  for (let index = 0; index < count; index += 1) {
    const source = baseRows[index % baseRows.length];
    const seed = `${source.medicine_name}:${source.category}:${index}`;

    const currentStock = Math.round(jitterValue(source.current_stock, 0.26, 1, seed, "stock"));
    const avgMonthlySales = Math.round(jitterValue(source.avg_monthly_sales, 0.34, 1, seed, "sales"));
    const daysUntilExpiry = Math.round(jitterValue(source.days_until_expiry, 0.45, 5, seed, "expiry"));
    const unitPrice = Number(jitterValue(source.unit_price, 0.18, 1, seed, "price").toFixed(2));

    const ratio = currentStock / Math.max(avgMonthlySales * (daysUntilExpiry / 30), 1);
    const ratioBoost = clamp((ratio - 1.05) * 0.28, -0.35, 0.48);
    const expiryBoost =
      daysUntilExpiry <= 30
        ? 0.15
        : daysUntilExpiry <= 70
          ? 0.06
          : daysUntilExpiry <= 130
            ? -0.02
            : -0.09;
    const sourceBias = source.will_expire_unused ? 0.07 : -0.04;

    const expireProbability = clamp(0.47 + ratioBoost + expiryBoost + sourceBias, 0.06, 0.94);
    const willExpireUnused = deterministicUnit(seed, "label") < expireProbability ? 1 : 0;

    const storeId = chooseTargetStore({
      category: source.category,
      currentStock,
      avgMonthlySales,
      daysUntilExpiry,
      sourceStore: source.store_id,
      seed,
      categoryStoreScores,
    });

    syntheticRows.push({
      medicine_name: source.medicine_name,
      category: source.category,
      current_stock: currentStock,
      avg_monthly_sales: avgMonthlySales,
      unit_price: unitPrice,
      days_until_expiry: daysUntilExpiry,
      store_id: storeId,
      will_expire_unused: willExpireUnused,
    });
  }

  return syntheticRows;
};

const buildTrainingDataset = async () => {
  const [inventoryItems, offers, requests, donations, ngoNeeds, wastePickups, retailers] = await Promise.all([
    InventoryItem.find({}).lean(),
    MedicineOffer.find({}).lean(),
    MedicineRequest.find({}).lean(),
    Donation.find({}).populate("inventoryItemId", "name").populate("ngoNeedId", "medicineName").lean(),
    NGONeed.find({}).lean(),
    WastePickupRequest.find({}).lean(),
    User.find({ role: "retailer" }).select("_id").lean(),
  ]);

  if (!inventoryItems.length) {
    throw new Error("No inventory history found. Add inventory records before training.");
  }

  const retailerIdSet = new Set(retailers.map((retailer) => String(retailer._id)));
  const retailerCount = Math.max(retailers.length, 1);

  const salesByRetailerMedicine = new Map();
  const demandByStoreCategory = new Map();
  const stockByStoreCategory = new Map();
  const wasteByStoreCategory = new Map();
  const globalDemandByMedicine = new Map();
  const globalDemandByCategory = new Map();
  const wastePressureByCategory = new Map();

  let oldestDate = new Date();
  const considerDate = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return;
    }

    if (date < oldestDate) {
      oldestDate = date;
    }
  };

  inventoryItems.forEach((item) => {
    considerDate(item.createdAt);

    const retailerId = String(item.retailerId || "");
    if (!retailerId) {
      return;
    }

    const category = inferCategoryFromName(item.name || "");
    const storeId = mapRetailerToStore(retailerId);
    const stock = Math.max(0, toFiniteNumber(item.quantity, 0));

    mapAdd(stockByStoreCategory, `${storeId}:${category}`, stock);
  });

  offers.forEach((offer) => {
    considerDate(offer.createdAt);

    const retailerId = String(offer.retailerId || "");
    const medicineName = offer.medicineName || "";
    const medicineKey = normalizeText(medicineName);
    const category = inferCategoryFromName(medicineName);
    const quantity = Math.max(0, toFiniteNumber(offer.quantity, 0));
    const weight = OFFER_STATUS_WEIGHT[offer.status] ?? 0;
    const weightedQuantity = quantity * weight;

    if (!retailerId || !medicineKey || weightedQuantity <= 0) {
      return;
    }

    mapAdd(salesByRetailerMedicine, `${retailerId}:${medicineKey}`, weightedQuantity);
    mapAdd(demandByStoreCategory, `${mapRetailerToStore(retailerId)}:${category}`, weightedQuantity);
    mapAdd(globalDemandByMedicine, medicineKey, weightedQuantity * 0.25);
    mapAdd(globalDemandByCategory, category, weightedQuantity * 0.25);
  });

  requests.forEach((request) => {
    considerDate(request.createdAt);

    const medicineName = request.medicineName || "";
    const medicineKey = normalizeText(medicineName);
    const category = inferCategoryFromName(medicineName);
    const quantity = Math.max(0, toFiniteNumber(request.quantity, 0));
    const statusWeight = REQUEST_STATUS_WEIGHT[request.status] ?? 0;
    const priorityWeight = REQUEST_PRIORITY_WEIGHT[request.priority] ?? 1;
    const weightedQuantity = quantity * statusWeight * priorityWeight;

    if (!medicineKey || weightedQuantity <= 0) {
      return;
    }

    mapAdd(globalDemandByMedicine, medicineKey, weightedQuantity);
    mapAdd(globalDemandByCategory, category, weightedQuantity);
  });

  ngoNeeds.forEach((need) => {
    considerDate(need.createdAt);

    const medicineName = need.medicineName || "";
    const medicineKey = normalizeText(medicineName);
    const category = inferCategoryFromName(medicineName);
    const quantity = Math.max(0, toFiniteNumber(need.quantity, 0));
    const statusWeight = NEED_STATUS_WEIGHT[need.status] ?? 0;
    const urgencyWeight = NEED_URGENCY_WEIGHT[need.urgency] ?? 1;
    const weightedQuantity = quantity * statusWeight * urgencyWeight;

    if (!medicineKey || weightedQuantity <= 0) {
      return;
    }

    mapAdd(globalDemandByMedicine, medicineKey, weightedQuantity);
    mapAdd(globalDemandByCategory, category, weightedQuantity);
  });

  donations.forEach((donation) => {
    considerDate(donation.createdAt);

    const retailerId = String(donation.donorId || "");
    const fromInventory = donation.inventoryItemId?.name;
    const fromNeed = donation.ngoNeedId?.medicineName;
    const medicineName = fromInventory || fromNeed || "";
    const medicineKey = normalizeText(medicineName);
    const category = inferCategoryFromName(medicineName);
    const quantity = Math.max(0, toFiniteNumber(donation.quantity, 0));
    const statusWeight = DONATION_STATUS_WEIGHT[donation.status] ?? 0;
    const weightedQuantity = quantity * statusWeight;

    if (!retailerId || !medicineKey || weightedQuantity <= 0) {
      return;
    }

    mapAdd(salesByRetailerMedicine, `${retailerId}:${medicineKey}`, weightedQuantity * 0.6);
    mapAdd(demandByStoreCategory, `${mapRetailerToStore(retailerId)}:${category}`, weightedQuantity * 0.75);
    mapAdd(globalDemandByMedicine, medicineKey, weightedQuantity * 0.4);
    mapAdd(globalDemandByCategory, category, weightedQuantity * 0.4);
  });

  wastePickups.forEach((pickup) => {
    considerDate(pickup.createdAt);

    const text = pickup.wasteType || "";
    const category = inferCategoryFromName(text);
    const statusWeight = WASTE_PICKUP_STATUS_WEIGHT[pickup.status] ?? 0;
    const baseAmount = Math.max(0, toFiniteNumber(pickup.amount, 0));
    const normalizedAmount = pickup.unit === "kg" ? baseAmount * 8 : baseAmount;

    const requesterId = String(pickup.requesterId || "");
    if (retailerIdSet.has(requesterId)) {
      const storeId = mapRetailerToStore(requesterId);
      mapAdd(wasteByStoreCategory, `${storeId}:${category}`, normalizedAmount * statusWeight);
    }

    mapAdd(wastePressureByCategory, category, normalizedAmount * statusWeight);
  });

  const totalMonths = Math.max(
    1,
    (Date.now() - oldestDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
  );

  const categoryStoreScores = buildCategoryStoreScores({
    demandByStoreCategory,
    stockByStoreCategory,
    wasteByStoreCategory,
    globalDemandByCategory,
  });

  const baseRows = [];

  for (const item of inventoryItems) {
    const retailerId = String(item.retailerId || "");
    if (!retailerId) {
      continue;
    }

    const medicineName = item.name || "Unknown";
    const medicineKey = normalizeText(medicineName);
    const category = MODEL_CATEGORIES.includes(item.category)
      ? item.category
      : inferCategoryFromName(medicineName);

    const currentStock = Math.max(0, Math.round(toFiniteNumber(item.quantity, 0)));
    const daysUntilExpiry = getDaysUntilExpiry(item.expiryDate);
    const unitPrice = Math.max(0, toFiniteNumber(item.mrp, 0));
    const sourceStore = mapRetailerToStore(retailerId);

    const salesSignal = toFiniteNumber(salesByRetailerMedicine.get(`${retailerId}:${medicineKey}`), 0) / totalMonths;
    const medicineDemandSignal =
      toFiniteNumber(globalDemandByMedicine.get(medicineKey), 0) / totalMonths / retailerCount;
    const categoryDemandSignal =
      toFiniteNumber(globalDemandByCategory.get(category), 0) / totalMonths / retailerCount;
    const wastePressureSignal =
      toFiniteNumber(wastePressureByCategory.get(category), 0) / totalMonths / Math.max(retailerCount * 6, 1);

    const avgMonthlySales = Math.max(
      1,
      Math.round(salesSignal * 0.7 + medicineDemandSignal * 0.45 + categoryDemandSignal * 0.25)
    );

    const projectedConsumption = avgMonthlySales * (Math.max(daysUntilExpiry, 1) / 30);
    const coverageRatio = currentStock / Math.max(projectedConsumption, 1);

    const statusBoost =
      item.status === "critical" ? 0.3 : item.status === "warning" ? 0.15 : 0;
    const noSalesBoost = salesSignal <= 0.1 ? 0.18 : 0;
    const tightExpiryBoost = daysUntilExpiry <= 30 ? 0.2 : daysUntilExpiry <= 60 ? 0.08 : 0;
    const wastePressureBoost = clamp(wastePressureSignal / 50, 0, 0.2);
    const stockPressure = clamp((coverageRatio - 1) * 0.45, -0.25, 0.66);
    const demandRelief =
      medicineDemandSignal > avgMonthlySales
        ? 0.12
        : categoryDemandSignal > avgMonthlySales
          ? 0.06
          : 0;
    const stabilityNoise = deterministicUnit(`${retailerId}:${medicineName}:${item.createdAt || "base"}`, "risk-noise") * 0.1 - 0.05;

    const riskProbability = clamp(
      0.43 +
      stockPressure +
      statusBoost +
      noSalesBoost +
      tightExpiryBoost +
      wastePressureBoost -
      demandRelief +
      stabilityNoise,
      0.05,
      0.95
    );

    const willExpireUnused =
      deterministicUnit(`${retailerId}:${medicineName}:${item.createdAt || "base"}`, "base-label") < riskProbability
        ? 1
        : 0;

    const storeId = chooseTargetStore({
      category,
      currentStock,
      avgMonthlySales,
      daysUntilExpiry,
      sourceStore,
      seed: `${retailerId}:${medicineName}:${item.createdAt || "base"}`,
      categoryStoreScores,
    });

    baseRows.push({
      medicine_name: medicineName,
      category,
      current_stock: currentStock,
      avg_monthly_sales: avgMonthlySales,
      unit_price: unitPrice,
      days_until_expiry: daysUntilExpiry,
      source_store_id: sourceStore,
      store_id: storeId,
      will_expire_unused: willExpireUnused,
    });
  }

  if (!baseRows.length) {
    throw new Error("No trainable rows generated from history");
  }

  const syntheticRows = buildSyntheticRows(baseRows, categoryStoreScores, baseRows.length * SYNTHETIC_MULTIPLIER);
  const rows = [...baseRows, ...syntheticRows];

  const csv = toCsv(rows, [
    "medicine_name",
    "category",
    "current_stock",
    "avg_monthly_sales",
    "unit_price",
    "days_until_expiry",
    "store_id",
    "will_expire_unused",
  ]);

  fs.writeFileSync(datasetPath, csv, "utf8");

  return {
    inventoryCount: inventoryItems.length,
    offerCount: offers.length,
    requestCount: requests.length,
    donationCount: donations.length,
    ngoNeedCount: ngoNeeds.length,
    wastePickupCount: wastePickups.length,
    baseTrainingRows: baseRows.length,
    syntheticRows: syntheticRows.length,
    trainingRows: rows.length,
    monthsCovered: Number(totalMonths.toFixed(2)),
    syntheticMultiplier: SYNTHETIC_MULTIPLIER,
  };
};

const trainMlFromHistory = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing in environment");
  }

  await connectDB();

  const datasetSummary = await buildTrainingDataset();
  const pythonResult = await runPythonTrainer();

  console.log("Historical ML dataset generated");
  console.log(JSON.stringify(datasetSummary, null, 2));
  console.log("Model training completed");
  console.log(pythonResult);
};

trainMlFromHistory()
  .catch((error) => {
    console.error("Failed to train ML models from history:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
