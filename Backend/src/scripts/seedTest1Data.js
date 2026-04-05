import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import fs from "fs";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "../config/db.js";
import Donation from "../models/Donation.js";
import InventoryItem from "../models/InventoryItem.js";
import MedicineOffer from "../models/MedicineOffer.js";
import MedicineRequest from "../models/MedicineRequest.js";
import NGONeed from "../models/NGONeed.js";
import Notification from "../models/Notification.js";
import RedistributionRequest from "../models/RedistributionRequest.js";
import User from "../models/User.js";
import WastePickupRequest from "../models/WastePickupRequest.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TARGET_DB_NAME = process.env.TEST1_DB_NAME || "test1";
const LEGACY_COLLECTION_NAME = "test1";
const TEST1_BATCH_PREFIX = "TEST1";
const LOGIN_FILE_PATH = path.resolve(__dirname, "../../TEST1_LOGINS.txt");

const DEFAULT_PASSWORD = "Demo@123";
const ADMIN_PASSWORD = "Admin@123";

const buildMongoUriWithDbName = (uri, dbName) => {
  const parsed = new URL(uri);
  parsed.pathname = `/${dbName}`;
  return parsed.toString();
};

const dropLegacyCollectionFromSourceDb = async (sourceUri) => {
  await mongoose.connect(sourceUri);

  const sourceDbName = mongoose.connection.db.databaseName;
  const collections = await mongoose.connection.db
    .listCollections({ name: LEGACY_COLLECTION_NAME })
    .toArray();

  let legacyCollectionDropped = false;

  if (collections.length > 0) {
    await mongoose.connection.db.collection(LEGACY_COLLECTION_NAME).drop();
    legacyCollectionDropped = true;
  }

  await mongoose.disconnect();

  return {
    sourceDbName,
    legacyCollectionDropped,
  };
};

const connectToTargetDb = async (sourceUri) => {
  const targetUri = buildMongoUriWithDbName(sourceUri, TARGET_DB_NAME);
  process.env.MONGO_URI = targetUri;
  await connectDB();

  return {
    targetDbName: mongoose.connection.db.databaseName,
  };
};

const USER_FIXTURES = [
  {
    key: "admin",
    role: "admin",
    email: "admin.test1@medisync.demo",
    password: ADMIN_PASSWORD,
    name: "Test1 Admin",
    organizationName: "Medisync Test1 Platform",
    verificationStatus: "verified",
  },
  {
    key: "retailer1",
    role: "retailer",
    email: "retailer1.test1@medisync.demo",
    password: DEFAULT_PASSWORD,
    name: "Retailer One",
    organizationName: "CityCare Pharmacy - Test1",
    verificationStatus: "verified",
  },
  {
    key: "retailer2",
    role: "retailer",
    email: "retailer2.test1@medisync.demo",
    password: DEFAULT_PASSWORD,
    name: "Retailer Two",
    organizationName: "Apollo Community Pharma - Test1",
    verificationStatus: "verified",
  },
  {
    key: "retailer3",
    role: "retailer",
    email: "retailer3.test1@medisync.demo",
    password: DEFAULT_PASSWORD,
    name: "Retailer Three",
    organizationName: "WellNest Medical Store - Test1",
    verificationStatus: "verified",
  },
  {
    key: "retailer4",
    role: "retailer",
    email: "retailer4.test1@medisync.demo",
    password: DEFAULT_PASSWORD,
    name: "Retailer Four",
    organizationName: "GreenCross Pharmacy - Test1",
    verificationStatus: "verified",
  },
  {
    key: "retailer5",
    role: "retailer",
    email: "retailer5.test1@medisync.demo",
    password: DEFAULT_PASSWORD,
    name: "Retailer Five",
    organizationName: "Nova Health Drugs - Test1",
    verificationStatus: "verified",
  },
  {
    key: "retailer6",
    role: "retailer",
    email: "retailer6.test1@medisync.demo",
    password: DEFAULT_PASSWORD,
    name: "Retailer Six",
    organizationName: "LifeSpring Medico - Test1",
    verificationStatus: "verified",
  },
  {
    key: "retailerPending",
    role: "retailer",
    email: "retailer.pending.test1@medisync.demo",
    password: DEFAULT_PASSWORD,
    name: "Pending Retailer",
    organizationName: "Pending Pharmacy - Test1",
    verificationStatus: "pending",
  },
  {
    key: "hospital1",
    role: "hospital",
    email: "hospital1.test1@medisync.demo",
    password: DEFAULT_PASSWORD,
    name: "Hospital One",
    organizationName: "City General Hospital - Test1",
    verificationStatus: "verified",
  },
  {
    key: "hospital2",
    role: "hospital",
    email: "hospital2.test1@medisync.demo",
    password: DEFAULT_PASSWORD,
    name: "Hospital Two",
    organizationName: "St. Mary Medical Center - Test1",
    verificationStatus: "verified",
  },
  {
    key: "hospital3",
    role: "hospital",
    email: "hospital3.test1@medisync.demo",
    password: DEFAULT_PASSWORD,
    name: "Hospital Three",
    organizationName: "Regional Health Clinic - Test1",
    verificationStatus: "verified",
  },
  {
    key: "ngo1",
    role: "ngo",
    email: "ngo1.test1@medisync.demo",
    password: DEFAULT_PASSWORD,
    name: "NGO One",
    organizationName: "Health for All Foundation - Test1",
    verificationStatus: "verified",
  },
  {
    key: "ngo2",
    role: "ngo",
    email: "ngo2.test1@medisync.demo",
    password: DEFAULT_PASSWORD,
    name: "NGO Two",
    organizationName: "Medical Aid Network - Test1",
    verificationStatus: "verified",
  },
  {
    key: "ngo3",
    role: "ngo",
    email: "ngo3.test1@medisync.demo",
    password: DEFAULT_PASSWORD,
    name: "NGO Three",
    organizationName: "Community Care Initiative - Test1",
    verificationStatus: "verified",
  },
  {
    key: "waste1",
    role: "waste",
    email: "waste1.test1@medisync.demo",
    password: DEFAULT_PASSWORD,
    name: "Waste Agency One",
    organizationName: "EcoWaste Medical Disposal - Test1",
    verificationStatus: "verified",
  },
  {
    key: "waste2",
    role: "waste",
    email: "waste2.test1@medisync.demo",
    password: DEFAULT_PASSWORD,
    name: "Waste Agency Two",
    organizationName: "BioClean Waste Management - Test1",
    verificationStatus: "verified",
  },
];

const now = () => new Date();

const daysAgo = (value) => {
  const date = new Date();
  date.setDate(date.getDate() - value);
  return date;
};

const daysFromNow = (value) => {
  const date = new Date();
  date.setDate(date.getDate() + value);
  return date;
};

const getInventoryStatus = (daysUntilExpiry) => {
  if (daysUntilExpiry < 10) {
    return "critical";
  }

  if (daysUntilExpiry < 30) {
    return "warning";
  }

  return "safe";
};

const buildRoleExtras = (fixture) => {
  if (fixture.role === "retailer") {
    return {
      licenseNumber: `LIC-${fixture.key}-T1`,
      gstNumber: `GST-${fixture.key}-T1`,
    };
  }

  if (fixture.role === "hospital") {
    return {
      hospitalRegNumber: `HOSP-${fixture.key}-T1`,
    };
  }

  if (fixture.role === "ngo") {
    return {
      ngoRegNumber: `NGO-${fixture.key}-T1`,
    };
  }

  if (fixture.role === "waste") {
    return {
      cpcbLicense: `CPCB-${fixture.key}-T1`,
      serviceArea: "Metro City",
      licenseNumber: `WASTE-${fixture.key}-T1`,
    };
  }

  return {};
};

const upsertUsers = async () => {
  const userMap = {};

  for (const fixture of USER_FIXTURES) {
    const passwordHash = await bcrypt.hash(fixture.password, 10);
    const existing = await User.findOne({ email: fixture.email });

    if (existing && existing.role !== fixture.role) {
      throw new Error(`Role mismatch for ${fixture.email}. Found ${existing.role}, expected ${fixture.role}`);
    }

    const payload = {
      email: fixture.email,
      passwordHash,
      role: fixture.role,
      name: fixture.name,
      organizationName: fixture.organizationName,
      verificationStatus: fixture.verificationStatus,
      phone: "+91-9000000000",
      address: "Test1 Demo Address",
      ...buildRoleExtras(fixture),
    };

    const user =
      existing === null
        ? await User.create(payload)
        : await User.findByIdAndUpdate(existing._id, payload, {
            returnDocument: "after",
            runValidators: true,
          });

    userMap[fixture.key] = user;
  }

  return userMap;
};

const createInventory = async (retailerId, name, batchNumber, quantity, daysUntilExpiry, mrp) => {
  const status = getInventoryStatus(daysUntilExpiry);

  return InventoryItem.create({
    retailerId,
    name,
    batchNumber,
    quantity,
    expiryDate: daysFromNow(daysUntilExpiry),
    mrp,
    gstPercent: 12,
    status,
  });
};

const buildTest1LoginsFile = () => {
  const generatedAt = new Date().toISOString();

  const lines = [
    "MEDISYNC TEST1 LOGINS",
    "Generated for full feature testing.",
    `Generated at: ${generatedAt}`,
    "",
    "Default password (retailer/hospital/ngo/waste): Demo@123",
    "Default password (admin): Admin@123",
    "",
    "ROLE | ORGANIZATION | EMAIL | PASSWORD | VERIFICATION",
    "------------------------------------------------------",
  ];

  USER_FIXTURES.forEach((fixture) => {
    lines.push(
      `${fixture.role} | ${fixture.organizationName} | ${fixture.email} | ${fixture.password} | ${fixture.verificationStatus}`
    );
  });

  lines.push("");

  return lines.join("\n");
};

const seedDataset = async () => {
  const users = await upsertUsers();

  const inventoryMap = {};

  inventoryMap.r1Amox = await createInventory(
    users.retailer1._id,
    "Amoxicillin Test1 Capsule 500mg",
    `${TEST1_BATCH_PREFIX}-REDIST-001`,
    260,
    13,
    42
  );
  inventoryMap.r1Para = await createInventory(
    users.retailer1._id,
    "Paracetamol Test1 Tablet 650mg",
    `${TEST1_BATCH_PREFIX}-REDIST-002`,
    320,
    11,
    24
  );
  inventoryMap.r1Betadine = await createInventory(
    users.retailer1._id,
    "Betadine Test1 Solution 100ml",
    `${TEST1_BATCH_PREFIX}-REDIST-003`,
    180,
    18,
    65
  );
  inventoryMap.r1Azithro = await createInventory(
    users.retailer1._id,
    "Azithromycin Test1 Tablet 500mg",
    `${TEST1_BATCH_PREFIX}-INV-004`,
    150,
    75,
    95
  );

  inventoryMap.r2AmoxLow = await createInventory(
    users.retailer2._id,
    "Amoxicillin Test1 Capsule 500mg",
    `${TEST1_BATCH_PREFIX}-REDIST-001`,
    1,
    220,
    42
  );
  inventoryMap.r2Metformin = await createInventory(
    users.retailer2._id,
    "Metformin Test1 Tablet 500mg",
    `${TEST1_BATCH_PREFIX}-INV-005`,
    140,
    190,
    29
  );

  inventoryMap.r3ParaLow = await createInventory(
    users.retailer3._id,
    "Paracetamol Test1 Tablet 650mg",
    `${TEST1_BATCH_PREFIX}-REDIST-002`,
    2,
    250,
    24
  );
  inventoryMap.r3BetadineLow = await createInventory(
    users.retailer3._id,
    "Betadine Test1 Solution 100ml",
    `${TEST1_BATCH_PREFIX}-REDIST-003`,
    1,
    250,
    65
  );

  inventoryMap.r5AmoxHealthy = await createInventory(
    users.retailer5._id,
    "Amoxicillin Test1 Capsule 500mg",
    `${TEST1_BATCH_PREFIX}-INV-006`,
    95,
    230,
    42
  );
  inventoryMap.r6Ibu = await createInventory(
    users.retailer6._id,
    "Ibuprofen Test1 Tablet 400mg",
    `${TEST1_BATCH_PREFIX}-INV-007`,
    60,
    8,
    37
  );

  const medicineRequests = await MedicineRequest.insertMany([
    {
      hospitalId: users.hospital1._id,
      medicineName: "Amoxicillin Test1 Capsule 500mg",
      quantity: 80,
      priority: "high",
      status: "pending",
      createdAt: daysAgo(2),
      updatedAt: daysAgo(2),
    },
    {
      hospitalId: users.hospital2._id,
      medicineName: "Paracetamol Test1 Tablet 650mg",
      quantity: 120,
      priority: "medium",
      status: "matched",
      createdAt: daysAgo(4),
      updatedAt: daysAgo(1),
    },
    {
      hospitalId: users.hospital3._id,
      medicineName: "Ibuprofen Test1 Tablet 400mg",
      quantity: 60,
      priority: "low",
      status: "accepted",
      createdAt: daysAgo(6),
      updatedAt: daysAgo(2),
    },
    {
      hospitalId: users.hospital1._id,
      medicineName: "Betadine Test1 Solution 100ml",
      quantity: 40,
      priority: "high",
      status: "completed",
      createdAt: daysAgo(10),
      updatedAt: daysAgo(3),
    },
    {
      hospitalId: users.hospital2._id,
      medicineName: "Cefixime Test1 Tablet 200mg",
      quantity: 70,
      priority: "medium",
      status: "rejected",
      createdAt: daysAgo(12),
      updatedAt: daysAgo(9),
    },
  ]);

  const medicineOffers = await MedicineOffer.insertMany([
    {
      retailerId: users.retailer1._id,
      requestId: medicineRequests[0]._id,
      inventoryItemId: inventoryMap.r1Amox._id,
      medicineName: "Amoxicillin Test1 Capsule 500mg",
      batchNumber: `${TEST1_BATCH_PREFIX}-REDIST-001`,
      quantity: 50,
      pricePerPacket: 38,
      totalPrice: 1900,
      status: "pending",
      createdAt: daysAgo(2),
      updatedAt: daysAgo(2),
    },
    {
      retailerId: users.retailer1._id,
      hospitalId: users.hospital2._id,
      requestId: medicineRequests[1]._id,
      inventoryItemId: inventoryMap.r1Para._id,
      medicineName: "Paracetamol Test1 Tablet 650mg",
      batchNumber: `${TEST1_BATCH_PREFIX}-REDIST-002`,
      quantity: 70,
      pricePerPacket: 20,
      totalPrice: 1400,
      status: "accepted",
      createdAt: daysAgo(5),
      updatedAt: daysAgo(1),
    },
    {
      retailerId: users.retailer2._id,
      hospitalId: users.hospital3._id,
      requestId: medicineRequests[2]._id,
      inventoryItemId: inventoryMap.r2Metformin._id,
      medicineName: "Metformin Test1 Tablet 500mg",
      batchNumber: `${TEST1_BATCH_PREFIX}-INV-005`,
      quantity: 45,
      pricePerPacket: 26,
      totalPrice: 1170,
      status: "completed",
      createdAt: daysAgo(8),
      updatedAt: daysAgo(2),
    },
    {
      retailerId: users.retailer6._id,
      hospitalId: users.hospital2._id,
      requestId: medicineRequests[4]._id,
      inventoryItemId: inventoryMap.r6Ibu._id,
      medicineName: "Ibuprofen Test1 Tablet 400mg",
      batchNumber: `${TEST1_BATCH_PREFIX}-INV-007`,
      quantity: 30,
      pricePerPacket: 33,
      totalPrice: 990,
      status: "rejected",
      createdAt: daysAgo(11),
      updatedAt: daysAgo(9),
    },
  ]);

  const ngoNeeds = await NGONeed.insertMany([
    {
      ngoId: users.ngo1._id,
      medicineName: "Amoxicillin Test1 Capsule 500mg",
      quantity: 120,
      urgency: "high",
      location: "Central Zone",
      status: "open",
      createdAt: daysAgo(1),
      updatedAt: daysAgo(1),
    },
    {
      ngoId: users.ngo2._id,
      medicineName: "Paracetamol Test1 Tablet 650mg",
      quantity: 150,
      urgency: "medium",
      location: "North Zone",
      status: "partially_fulfilled",
      createdAt: daysAgo(7),
      updatedAt: daysAgo(2),
    },
    {
      ngoId: users.ngo3._id,
      medicineName: "ORS Test1 Sachet",
      quantity: 220,
      urgency: "low",
      location: "East Zone",
      status: "fulfilled",
      createdAt: daysAgo(16),
      updatedAt: daysAgo(6),
    },
    {
      ngoId: users.ngo1._id,
      medicineName: "Bandage Test1 Roll",
      quantity: 180,
      urgency: "high",
      location: "West Zone",
      status: "closed",
      createdAt: daysAgo(20),
      updatedAt: daysAgo(10),
    },
  ]);

  const donations = await Donation.insertMany([
    {
      donorId: users.retailer1._id,
      recipientNgoId: users.ngo1._id,
      inventoryItemId: inventoryMap.r1Amox._id,
      ngoNeedId: ngoNeeds[0]._id,
      quantity: 40,
      status: "pending",
      donatedAt: daysAgo(1),
      createdAt: daysAgo(1),
      updatedAt: daysAgo(1),
    },
    {
      donorId: users.retailer2._id,
      recipientNgoId: users.ngo2._id,
      inventoryItemId: inventoryMap.r2Metformin._id,
      ngoNeedId: ngoNeeds[1]._id,
      quantity: 25,
      status: "accepted",
      donatedAt: daysAgo(5),
      createdAt: daysAgo(5),
      updatedAt: daysAgo(3),
    },
    {
      donorId: users.retailer1._id,
      recipientNgoId: users.ngo3._id,
      inventoryItemId: inventoryMap.r1Para._id,
      ngoNeedId: ngoNeeds[2]._id,
      quantity: 60,
      status: "distributed",
      donatedAt: daysAgo(9),
      createdAt: daysAgo(9),
      updatedAt: daysAgo(4),
    },
    {
      donorId: users.retailer6._id,
      recipientNgoId: users.ngo1._id,
      inventoryItemId: inventoryMap.r6Ibu._id,
      ngoNeedId: ngoNeeds[3]._id,
      quantity: 15,
      status: "rejected",
      donatedAt: daysAgo(12),
      createdAt: daysAgo(12),
      updatedAt: daysAgo(10),
    },
  ]);

  const pickups = await WastePickupRequest.insertMany([
    {
      requesterId: users.retailer1._id,
      wasteType: "Expired antibiotics",
      amount: 30,
      unit: "packets",
      pickupDate: daysFromNow(2),
      pickupTime: "10:30 AM",
      location: "CityCare Warehouse",
      status: "pending",
      requestedAt: now(),
      createdAt: daysAgo(0),
      updatedAt: daysAgo(0),
    },
    {
      requesterId: users.retailer2._id,
      wasteType: "Damaged packaging",
      amount: 18,
      unit: "kg",
      pickupDate: daysFromNow(1),
      pickupTime: "02:00 PM",
      location: "Apollo Storage Unit",
      status: "assigned",
      agencyId: users.waste1._id,
      assignedByAdminId: users.admin._id,
      requestedAt: daysAgo(1),
      createdAt: daysAgo(1),
      updatedAt: daysAgo(1),
    },
    {
      requesterId: users.retailer6._id,
      wasteType: "Critical expiry stock",
      amount: 22,
      unit: "packets",
      pickupDate: daysFromNow(0),
      pickupTime: "11:00 AM",
      location: "LifeSpring Outlet",
      status: "in_progress",
      agencyId: users.waste2._id,
      assignedByAdminId: users.admin._id,
      requestedAt: daysAgo(2),
      createdAt: daysAgo(2),
      updatedAt: daysAgo(1),
    },
    {
      requesterId: users.retailer1._id,
      wasteType: "Disposed expired syrups",
      amount: 14,
      unit: "kg",
      pickupDate: daysAgo(3),
      pickupTime: "04:00 PM",
      location: "CityCare Warehouse",
      status: "completed",
      agencyId: users.waste1._id,
      assignedByAdminId: users.admin._id,
      certUrl: "https://example.com/test1-disposal-certificate.pdf",
      requestedAt: daysAgo(5),
      createdAt: daysAgo(5),
      updatedAt: daysAgo(3),
    },
    {
      requesterId: users.retailer3._id,
      wasteType: "Cancelled biomedical pickup",
      amount: 9,
      unit: "kg",
      pickupDate: daysFromNow(4),
      pickupTime: "09:30 AM",
      location: "WellNest Store",
      status: "cancelled",
      requestedAt: daysAgo(3),
      createdAt: daysAgo(3),
      updatedAt: daysAgo(2),
    },
  ]);

  const redistributionRequests = await RedistributionRequest.insertMany([
    {
      fromRetailerId: users.retailer1._id,
      toRetailerId: users.retailer2._id,
      inventoryItemId: inventoryMap.r1Amox._id,
      medicineName: inventoryMap.r1Amox.name,
      batchNumber: inventoryMap.r1Amox.batchNumber,
      quantity: 40,
      unitPrice: inventoryMap.r1Amox.mrp,
      gstPercent: inventoryMap.r1Amox.gstPercent,
      modelConfidence: 0.94,
      modelSuggestedStore: "Store_A",
      reason: "High expiry risk and nearby stock-out",
      status: "pending",
      createdAt: daysAgo(1),
      updatedAt: daysAgo(1),
    },
    {
      fromRetailerId: users.retailer1._id,
      toRetailerId: users.retailer3._id,
      inventoryItemId: inventoryMap.r1Para._id,
      medicineName: inventoryMap.r1Para.name,
      batchNumber: inventoryMap.r1Para.batchNumber,
      quantity: 35,
      unitPrice: inventoryMap.r1Para.mrp,
      gstPercent: inventoryMap.r1Para.gstPercent,
      modelConfidence: 0.89,
      modelSuggestedStore: "Store_A",
      reason: "Model recommended urgent transfer",
      status: "completed",
      respondedAt: daysAgo(2),
      completedAt: daysAgo(2),
      createdAt: daysAgo(4),
      updatedAt: daysAgo(2),
    },
    {
      fromRetailerId: users.retailer1._id,
      toRetailerId: users.retailer6._id,
      inventoryItemId: inventoryMap.r1Betadine._id,
      medicineName: inventoryMap.r1Betadine.name,
      batchNumber: inventoryMap.r1Betadine.batchNumber,
      quantity: 20,
      unitPrice: inventoryMap.r1Betadine.mrp,
      gstPercent: inventoryMap.r1Betadine.gstPercent,
      modelConfidence: 0.77,
      modelSuggestedStore: "Store_C",
      reason: "Low inventory in target zone",
      status: "rejected",
      respondedAt: daysAgo(5),
      createdAt: daysAgo(6),
      updatedAt: daysAgo(5),
    },
    {
      fromRetailerId: users.retailer2._id,
      toRetailerId: users.retailer1._id,
      inventoryItemId: inventoryMap.r2Metformin._id,
      medicineName: inventoryMap.r2Metformin.name,
      batchNumber: inventoryMap.r2Metformin.batchNumber,
      quantity: 15,
      unitPrice: inventoryMap.r2Metformin.mrp,
      gstPercent: inventoryMap.r2Metformin.gstPercent,
      modelConfidence: 0.62,
      modelSuggestedStore: "Store_B",
      reason: "Cancelled after local demand spike",
      status: "cancelled",
      respondedAt: daysAgo(3),
      createdAt: daysAgo(7),
      updatedAt: daysAgo(3),
    },
  ]);

  await Notification.insertMany([
    {
      userId: users.hospital1._id,
      type: "offer_created",
      title: "New Offer Received",
      message: "A retailer shared a pending offer for Amoxicillin Test1 Capsule 500mg.",
      entityType: "offer",
      entityId: medicineOffers[0]._id,
      isRead: false,
      createdAt: daysAgo(2),
      updatedAt: daysAgo(2),
    },
    {
      userId: users.retailer1._id,
      type: "offer_accepted",
      title: "Offer Accepted",
      message: "Hospital accepted your Paracetamol Test1 offer.",
      entityType: "offer",
      entityId: medicineOffers[1]._id,
      isRead: false,
      createdAt: daysAgo(1),
      updatedAt: daysAgo(1),
    },
    {
      userId: users.retailer2._id,
      type: "request_matched",
      title: "Request Matched",
      message: "A hospital request has been matched with your inventory.",
      entityType: "request",
      entityId: medicineRequests[1]._id,
      isRead: false,
      createdAt: daysAgo(1),
      updatedAt: daysAgo(1),
    },
    {
      userId: users.ngo1._id,
      type: "donation_update",
      title: "Donation Pending",
      message: "A new donation is awaiting NGO confirmation.",
      entityType: "donation",
      entityId: donations[0]._id,
      isRead: false,
      createdAt: daysAgo(1),
      updatedAt: daysAgo(1),
    },
    {
      userId: users.retailer2._id,
      type: "pickup_assigned",
      title: "Waste Pickup Assigned",
      message: "Admin assigned a certified waste agency for your request.",
      entityType: "pickup",
      entityId: pickups[1]._id,
      isRead: false,
      createdAt: daysAgo(1),
      updatedAt: daysAgo(1),
    },
    {
      userId: users.retailerPending._id,
      type: "verification_update",
      title: "Verification Pending",
      message: "Your account is pending admin approval.",
      entityType: "user",
      entityId: users.retailerPending._id,
      isRead: false,
      createdAt: daysAgo(0),
      updatedAt: daysAgo(0),
    },
    {
      userId: users.retailer1._id,
      type: "redistribution_update",
      title: "Redistribution Request Created",
      message: "Redistribution request for Amoxicillin is awaiting target confirmation.",
      entityType: "redistribution",
      entityId: redistributionRequests[0]._id,
      isRead: false,
      createdAt: daysAgo(1),
      updatedAt: daysAgo(1),
    },
    {
      userId: users.retailer3._id,
      type: "redistribution_update",
      title: "Redistribution Completed",
      message: "Incoming redistribution was completed successfully.",
      entityType: "redistribution",
      entityId: redistributionRequests[1]._id,
      isRead: true,
      createdAt: daysAgo(2),
      updatedAt: daysAgo(2),
    },
  ]);

  fs.writeFileSync(LOGIN_FILE_PATH, buildTest1LoginsFile(), "utf-8");

  return {
    usersCreatedOrUpdated: USER_FIXTURES.length,
    inventoryItemsCreated: Object.keys(inventoryMap).length,
    medicineRequestsCreated: medicineRequests.length,
    medicineOffersCreated: medicineOffers.length,
    ngoNeedsCreated: ngoNeeds.length,
    donationsCreated: donations.length,
    wastePickupsCreated: pickups.length,
    redistributionRequestsCreated: redistributionRequests.length,
    notificationsCreated: 8,
    loginsFile: LOGIN_FILE_PATH,
    database: mongoose.connection.db.databaseName,
  };
};

const run = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing. Add it in Backend/.env before running seed:test1.");
  }

  const sourceUri = process.env.MONGO_URI;
  const sourceCleanup = await dropLegacyCollectionFromSourceDb(sourceUri);

  const { targetDbName } = await connectToTargetDb(sourceUri);
  const droppedDatabase = await mongoose.connection.db.dropDatabase();

  const seeded = await seedDataset();

  const result = {
    sourceDbName: sourceCleanup.sourceDbName,
    legacyCollectionDropped: sourceCleanup.legacyCollectionDropped,
    targetDbName,
    targetDatabaseReset: droppedDatabase,
    ...seeded,
  };

  console.log("Test1 full dataset seeded successfully.");
  console.log(JSON.stringify(result, null, 2));
};

run()
  .catch((error) => {
    console.error("Failed to seed test1 dataset:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });
