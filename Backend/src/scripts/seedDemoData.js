import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import InventoryItem from "../models/InventoryItem.js";
import MedicineOffer from "../models/MedicineOffer.js";
import RedistributionRequest from "../models/RedistributionRequest.js";

dotenv.config();

const DEMO_PASSWORD = "Demo@123";
const DEMO_BATCH_PREFIX = "REDIST-DEMO";

const RETAILER_FIXTURES = [
  {
    email: "retailer1@medisync.demo",
    name: "Retailer One",
    organizationName: "CityCare Pharmacy",
  },
  {
    email: "retailer2@medisync.demo",
    name: "Retailer Two",
    organizationName: "Apollo Community Pharma",
  },
  {
    email: "retailer3@medisync.demo",
    name: "Retailer Three",
    organizationName: "WellNest Medical Store",
  },
  {
    email: "retailer4@medisync.demo",
    name: "Retailer Four",
    organizationName: "GreenCross Pharmacy",
  },
  {
    email: "retailer5@medisync.demo",
    name: "Retailer Five",
    organizationName: "Nova Health Drugs",
  },
];

const DEMO_MEDICINES = [
  {
    name: "Amoxicillin Demo Capsule 500mg",
    sourceQuantity: 240,
    targetLowStockA: 1,
    targetLowStockB: 2,
    healthyStock: 60,
    daysUntilExpiry: 14,
    mrp: 38,
    avgMonthlySalesSeed: 8,
  },
  {
    name: "Paracetamol Demo Tablet 650mg",
    sourceQuantity: 320,
    targetLowStockA: 2,
    targetLowStockB: 1,
    healthyStock: 80,
    daysUntilExpiry: 11,
    mrp: 22,
    avgMonthlySalesSeed: 10,
  },
  {
    name: "Betadine Demo Solution 100ml",
    sourceQuantity: 180,
    targetLowStockA: 1,
    targetLowStockB: 2,
    healthyStock: 55,
    daysUntilExpiry: 18,
    mrp: 64,
    avgMonthlySalesSeed: 6,
  },
];

const toExpiryDate = (days) => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date;
};

const getStatusFromExpiryDays = (days) => {
  if (days < 10) {
    return "critical";
  }

  if (days < 30) {
    return "warning";
  }

  return "safe";
};

const upsertRetailer = async (fixture, hashedPassword) => {
  const existing = await User.findOne({ email: fixture.email });

  if (existing && existing.role !== "retailer") {
    throw new Error(`User ${fixture.email} exists but is not a retailer`);
  }

  if (!existing) {
    return User.create({
      email: fixture.email,
      passwordHash: hashedPassword,
      role: "retailer",
      name: fixture.name,
      organizationName: fixture.organizationName,
      verificationStatus: "verified",
      phone: "+91-9000000000",
      address: "Demo Street",
      licenseNumber: `LIC-${fixture.email}`,
      gstNumber: `GST-${fixture.email}`,
    });
  }

  existing.name = existing.name || fixture.name;
  existing.organizationName = existing.organizationName || fixture.organizationName;
  existing.verificationStatus = "verified";
  existing.phone = existing.phone || "+91-9000000000";
  existing.address = existing.address || "Demo Street";
  existing.licenseNumber = existing.licenseNumber || `LIC-${fixture.email}`;
  existing.gstNumber = existing.gstNumber || `GST-${fixture.email}`;

  await existing.save();
  return existing;
};

const clearOldDemoRows = async (retailerIds) => {
  const oldItems = await InventoryItem.find({
    retailerId: { $in: retailerIds },
    batchNumber: { $regex: `^${DEMO_BATCH_PREFIX}` },
  }).select("_id");

  const oldItemIds = oldItems.map((item) => item._id);

  if (oldItemIds.length) {
    await Promise.all([
      MedicineOffer.deleteMany({ inventoryItemId: { $in: oldItemIds } }),
      RedistributionRequest.deleteMany({ inventoryItemId: { $in: oldItemIds } }),
      InventoryItem.deleteMany({ _id: { $in: oldItemIds } }),
    ]);
  }

  return oldItemIds.length;
};

const createInventoryItem = async ({
  retailerId,
  medicine,
  batchNumber,
  quantity,
  daysUntilExpiry,
  mrp,
}) => {
  return InventoryItem.create({
    retailerId,
    name: medicine,
    batchNumber,
    quantity,
    expiryDate: toExpiryDate(daysUntilExpiry),
    mrp,
    gstPercent: 12,
    status: getStatusFromExpiryDays(daysUntilExpiry),
  });
};

const seedOffersForMonthlySales = async ({ sourceRetailerId, inventoryItemId, medicine, mrp, quantityPerMonth }) => {
  const offerDates = [15, 45, 75].map((daysAgo) => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date;
  });

  const offerDocs = offerDates.map((createdAt, index) => ({
    retailerId: sourceRetailerId,
    inventoryItemId,
    medicineName: medicine,
    batchNumber: `${DEMO_BATCH_PREFIX}-SALE-${index + 1}`,
    quantity: quantityPerMonth,
    pricePerPacket: mrp,
    totalPrice: mrp * quantityPerMonth,
    status: index % 2 === 0 ? "completed" : "accepted",
    createdAt,
    updatedAt: createdAt,
  }));

  await MedicineOffer.insertMany(offerDocs);
};

const run = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing. Add it in Backend/.env before seeding demo data.");
  }

  await connectDB();

  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);
  const retailers = [];

  for (const fixture of RETAILER_FIXTURES) {
    const retailer = await upsertRetailer(fixture, hashedPassword);
    retailers.push(retailer);
  }

  const [sourceRetailer, zeroStockRetailer, lowStockRetailerA, lowStockRetailerB, healthyStockRetailer] = retailers;

  const deletedItemCount = await clearOldDemoRows(retailers.map((retailer) => retailer._id));

  const insertedSourceItems = [];

  for (let index = 0; index < DEMO_MEDICINES.length; index += 1) {
    const item = DEMO_MEDICINES[index];
    const batchNumber = `${DEMO_BATCH_PREFIX}-${index + 1}`;

    const sourceItem = await createInventoryItem({
      retailerId: sourceRetailer._id,
      medicine: item.name,
      batchNumber,
      quantity: item.sourceQuantity,
      daysUntilExpiry: item.daysUntilExpiry,
      mrp: item.mrp,
    });

    await createInventoryItem({
      retailerId: lowStockRetailerA._id,
      medicine: item.name,
      batchNumber,
      quantity: item.targetLowStockA,
      daysUntilExpiry: 220,
      mrp: item.mrp,
    });

    await createInventoryItem({
      retailerId: lowStockRetailerB._id,
      medicine: item.name,
      batchNumber,
      quantity: item.targetLowStockB,
      daysUntilExpiry: 240,
      mrp: item.mrp,
    });

    await createInventoryItem({
      retailerId: healthyStockRetailer._id,
      medicine: item.name,
      batchNumber,
      quantity: item.healthyStock,
      daysUntilExpiry: 260,
      mrp: item.mrp,
    });

    // Intentionally do not create inventory for zeroStockRetailer to represent stock-finished cases.
    await seedOffersForMonthlySales({
      sourceRetailerId: sourceRetailer._id,
      inventoryItemId: sourceItem._id,
      medicine: item.name,
      mrp: item.mrp,
      quantityPerMonth: item.avgMonthlySalesSeed,
    });

    insertedSourceItems.push(sourceItem);
  }

  console.log("Redistribution demo data seeded successfully.");
  console.log(`Source retailer: ${sourceRetailer.organizationName} (${sourceRetailer.email})`);
  console.log(`Zero-stock target retailer: ${zeroStockRetailer.organizationName} (${zeroStockRetailer.email})`);
  console.log(`Created source high-risk items: ${insertedSourceItems.length}`);
  console.log(`Removed previous demo inventory rows: ${deletedItemCount}`);

  console.log("Next step: login as retailer1@medisync.demo and open /api/ml/retailer-insights.");
};

run()
  .catch((error) => {
    console.error("Failed to seed redistribution demo data:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });
