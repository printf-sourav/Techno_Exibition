export type UserRole = "retailer" | "hospital" | "ngo" | "waste" | "admin";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type RequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  token?: string | null;
};

type ApiEnvelope<T> = {
  statusCode: number;
  success: boolean;
  message: string;
  data: T;
};

export type BackendUser = {
  _id?: string;
  id?: string;
  email: string;
  role: UserRole;
  name?: string;
  organizationName?: string;
  verificationStatus?: "pending" | "verified" | "rejected";
  address?: string;
  phone?: string;
  licenseNumber?: string;
  hospitalRegNumber?: string;
  ngoRegNumber?: string;
  cpcbLicense?: string;
  serviceArea?: string;
  licenseCertificateUrl?: string;
  createdAt?: string;
};

export type InventoryItem = {
  _id: string;
  name: string;
  batchNumber?: string;
  quantity: number;
  expiryDate?: string;
  mrp?: number;
  gstPercent?: number;
  status: "safe" | "warning" | "critical";
};

export type MarketRequest = {
  _id: string;
  medicineName: string;
  quantity: number;
  priority: "low" | "medium" | "high";
  status: "pending" | "matched" | "accepted" | "rejected" | "completed";
  hospitalId?: {
    _id?: string;
    name?: string;
    organizationName?: string;
    address?: string;
  };
  createdAt: string;
};

export type Offer = {
  _id: string;
  medicineName: string;
  batchNumber?: string;
  quantity: number;
  pricePerPacket: number;
  totalPrice: number;
  status: "pending" | "accepted" | "rejected" | "completed";
  retailerId?: {
    _id?: string;
    name?: string;
    organizationName?: string;
  } | string;
  hospitalId?: {
    _id?: string;
    name?: string;
    organizationName?: string;
    address?: string;
    phone?: string;
  } | string;
  inventoryItemId?: {
    _id?: string;
    expiryDate?: string;
    quantity?: number;
    status?: string;
  } | string;
  createdAt: string;
  updatedAt?: string;
};

export type AppNotification = {
  _id: string;
  userId: string;
  type?: string;
  title?: string;
  message?: string;
  entityType?: string;
  entityId?: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
};

export type NgoNeed = {
  _id: string;
  ngoId:
    | {
        _id?: string;
        name?: string;
        organizationName?: string;
        location?: string;
        phone?: string;
      }
    | string;
  medicineName: string;
  quantity: number;
  urgency: "low" | "medium" | "high";
  location: string;
  status: "open" | "partially_fulfilled" | "fulfilled" | "closed";
  createdAt: string;
};

export type Donation = {
  _id: string;
  donorId?: {
    _id?: string;
    name?: string;
    organizationName?: string;
  };
  recipientNgoId?: {
    _id?: string;
    name?: string;
    organizationName?: string;
  };
  inventoryItemId?: {
    _id?: string;
    name?: string;
    batchNumber?: string;
    expiryDate?: string;
  };
  ngoNeedId?: {
    _id?: string;
    medicineName?: string;
    quantity?: number;
    urgency?: "low" | "medium" | "high";
    status?: string;
  };
  quantity: number;
  status: "pending" | "accepted" | "rejected" | "distributed";
  donatedAt?: string;
  createdAt: string;
};

export type WastePickup = {
  _id: string;
  requesterId?: {
    _id?: string;
    name?: string;
    organizationName?: string;
    role?: UserRole;
    phone?: string;
  };
  agencyId?: {
    _id?: string;
    name?: string;
    organizationName?: string;
    phone?: string;
  };
  assignedByAdminId?: {
    _id?: string;
    name?: string;
  };
  wasteType: string;
  amount: number;
  unit: "kg" | "packets";
  pickupDate: string;
  pickupTime?: string;
  location: string;
  status: "pending" | "assigned" | "in_progress" | "completed" | "cancelled";
  certUrl?: string;
  requestedAt?: string;
  createdAt: string;
};

export type MlInsightsResponse = {
  summary: {
    totalItems: number;
    highRiskItems: number;
    projectedLoss: number;
  };
  expiryPredictions: Array<{
    inventoryItemId: string;
    medicineName: string;
    batchNumber: string;
    quantity: number;
    daysUntilExpiry: number;
    riskProbability: number;
    willExpireUnused: boolean;
    estimatedLoss: number;
    avgMonthlySales: number;
    unitPrice: number;
    category: string;
    status: string;
  }>;
  redistributionSuggestions: Array<{
    inventoryItemId: string;
    medicineName: string;
    batchNumber: string;
    quantity: number;
    daysUntilExpiry: number;
    riskProbability: number;
    modelSuggestedStore: string;
    modelConfidence: number;
    recommendedTransferQuantity: number;
    targetRetailers: Array<{
      retailerId: string;
      retailerName: string;
      currentStock: number;
      isStockFinished: boolean;
      mappedStore: string;
      priorityScore: number;
    }>;
  }>;
  generatedAt: string;
};

export type RedistributionRequest = {
  _id: string;
  fromRetailerId?: {
    _id?: string;
    name?: string;
    organizationName?: string;
  };
  toRetailerId?: {
    _id?: string;
    name?: string;
    organizationName?: string;
  };
  inventoryItemId?: string;
  medicineName: string;
  batchNumber?: string;
  quantity: number;
  unitPrice?: number;
  gstPercent?: number;
  modelConfidence?: number;
  modelSuggestedStore?: string;
  reason?: string;
  status: "pending" | "rejected" | "cancelled" | "completed";
  createdAt: string;
  respondedAt?: string;
  completedAt?: string;
};

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/+$/, "");
const REQUEST_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS || 12000);

export const TOKEN_STORAGE_KEY = "medisync_token";

const getErrorMessage = (payload: unknown, fallback: string) => {
  if (payload && typeof payload === "object" && "message" in payload) {
    const message = (payload as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }
  return fallback;
};

const apiRequest = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const url = `${API_BASE_URL}${path}`;
  const isFormData = options.body instanceof FormData;
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const headers: Record<string, string> = {};
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: options.method || "GET",
      headers,
      signal: controller.signal,
      body: options.body === undefined ? undefined : isFormData ? (options.body as FormData) : JSON.stringify(options.body),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Request timed out. Please check backend server status.");
    }

    throw new Error("Unable to reach backend. Ensure backend server is running on the configured API URL.");
  } finally {
    globalThis.clearTimeout(timeoutId);
  }

  let payload: ApiEnvelope<T> | { message?: string } | null = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, "Request failed"));
  }

  if (!payload || typeof payload !== "object" || !("data" in payload)) {
    throw new Error("Unexpected API response");
  }

  return (payload as ApiEnvelope<T>).data;
};

const withQuery = (path: string, query: Record<string, string | undefined>) => {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  const queryString = params.toString();
  return queryString ? `${path}?${queryString}` : path;
};

export const saveAuthSession = (token: string, user: BackendUser) => {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
  localStorage.setItem("medisync_user", JSON.stringify(user));
};

export const clearAuthSession = () => {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem("medisync_user");
};

export const getStoredToken = () => localStorage.getItem(TOKEN_STORAGE_KEY);

export const loginApi = (payload: { email: string; password: string }) =>
  apiRequest<{ user: BackendUser; token: string }>("/api/auth/login", {
    method: "POST",
    body: payload,
  });

export const registerApi = (payload: Record<string, unknown>) => {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    if (value instanceof File) {
      formData.append(key, value);
      return;
    }

    formData.append(key, String(value));
  });

  return apiRequest<{ user: BackendUser; token: string }>("/api/auth/register", {
    method: "POST",
    body: formData,
  });
};

export const getNotificationsApi = (token: string) =>
  apiRequest<AppNotification[]>("/notifications", { token });

export const markNotificationReadApi = (token: string, notificationId: string) =>
  apiRequest<AppNotification>(`/notifications/${notificationId}`, {
    method: "PATCH",
    token,
  });

export const getInventoryApi = (token: string) => apiRequest<InventoryItem[]>("/api/inventory", { token });

export const createInventoryApi = (
  token: string,
  payload: {
    name: string;
    batchNumber: string;
    quantity: number;
    expiryDate: string;
    mrp: number;
    gstPercent?: number;
  }
) =>
  apiRequest<InventoryItem>("/api/inventory", {
    method: "POST",
    token,
    body: payload,
  });

export const getMarketplaceRequestsApi = (token: string) =>
  apiRequest<MarketRequest[]>("/api/marketplace/requests", { token });

export const createMarketplaceOfferApi = (
  token: string,
  payload: {
    inventoryItemId: string;
    medicineName: string;
    batchNumber?: string;
    quantity: number;
    pricePerPacket: number;
  }
) =>
  apiRequest<Offer>("/api/marketplace/offers", {
    method: "POST",
    token,
    body: payload,
  });

export const supplyMarketplaceRequestApi = (
  token: string,
  requestId: string,
  payload: {
    inventoryItemId: string;
    quantity: number;
    pricePerPacket: number;
  }
) =>
  apiRequest<{ request: MarketRequest; offer: Offer }>(`/api/marketplace/requests/${requestId}/supply`, {
    method: "POST",
    token,
    body: payload,
  });

export const getRetailerMlInsightsApi = (token: string) =>
  apiRequest<MlInsightsResponse>("/api/ml/retailer-insights", { token });

export const getRetailerRedistributionRequestsApi = (token: string) =>
  apiRequest<{
    incoming: RedistributionRequest[];
    outgoing: RedistributionRequest[];
  }>("/api/ml/redistribution/requests", { token });

export const createRetailerRedistributionRequestApi = (
  token: string,
  payload: {
    inventoryItemId: string;
    targetRetailerId: string;
    quantity: number;
    modelConfidence?: number;
    modelSuggestedStore?: string;
    reason?: string;
  }
) =>
  apiRequest<RedistributionRequest>("/api/ml/redistribution/requests", {
    method: "POST",
    token,
    body: payload,
  });

export const respondRetailerRedistributionRequestApi = (
  token: string,
  requestId: string,
  action: "accept" | "reject"
) =>
  apiRequest<RedistributionRequest | { request: RedistributionRequest }>(
    `/api/ml/redistribution/requests/${requestId}/respond`,
    {
      method: "PATCH",
      token,
      body: {
        action,
      },
    }
  );

export const cancelRetailerRedistributionRequestApi = (token: string, requestId: string) =>
  apiRequest<RedistributionRequest>(`/api/ml/redistribution/requests/${requestId}/cancel`, {
    method: "PATCH",
    token,
  });

export const getHospitalMedicinesApi = (token: string) =>
  apiRequest<Offer[]>("/api/marketplace/medicines", { token });

export const getHospitalIncomingOffersApi = (token: string) =>
  apiRequest<Offer[]>("/api/marketplace/offers/incoming", { token });

export const getRetailerOffersApi = (token: string) =>
  apiRequest<Offer[]>("/api/marketplace/offers/mine", { token });

export const acceptHospitalOfferApi = (token: string, offerId: string) =>
  apiRequest<{ offer: Offer }>(`/api/marketplace/offers/${offerId}/accept`, {
    method: "PATCH",
    token,
  });

export const createMarketplaceRequestApi = (
  token: string,
  payload: { medicineName: string; quantity: number; priority: "low" | "medium" | "high" }
) =>
  apiRequest<MarketRequest>("/api/marketplace/requests", {
    method: "POST",
    token,
    body: payload,
  });

export const getNgoNeedsApi = (
  token: string,
  options?: {
    status?: "open" | "partially_fulfilled" | "fulfilled" | "closed";
    onlyMine?: boolean;
  }
) =>
  apiRequest<NgoNeed[]>(
    withQuery("/api/donations/needs", {
      status: options?.status,
      onlyMine: options?.onlyMine ? "true" : undefined,
    }),
    { token }
  );

export const createNgoNeedApi = (
  token: string,
  payload: {
    medicineName: string;
    quantity: number;
    urgency: "low" | "medium" | "high";
    location: string;
  }
) =>
  apiRequest<NgoNeed>("/api/donations/needs", {
    method: "POST",
    token,
    body: payload,
  });

export const getDonationsApi = (
  token: string,
  status?: "pending" | "accepted" | "rejected" | "distributed"
) =>
  apiRequest<Donation[]>(
    withQuery("/api/donations", {
      status,
    }),
    { token }
  );

export const createDonationApi = (
  token: string,
  payload: {
    recipientNgoId: string;
    inventoryItemId: string;
    quantity: number;
    ngoNeedId?: string;
  }
) =>
  apiRequest<Donation>("/api/donations", {
    method: "POST",
    token,
    body: payload,
  });

export const markDonationDistributedApi = (token: string, donationId: string) =>
  apiRequest<Donation>(`/api/donations/${donationId}/distribute`, {
    method: "PATCH",
    token,
  });

export const getWastePickupsApi = (
  token: string,
  status?: "pending" | "assigned" | "in_progress" | "completed" | "cancelled"
) =>
  apiRequest<WastePickup[]>(
    withQuery("/api/waste/pickups", {
      status,
    }),
    { token }
  );

export const createWastePickupApi = (
  token: string,
  payload: {
    wasteType: string;
    amount: number;
    unit: "kg" | "packets";
    pickupDate: string;
    pickupTime?: string;
    location: string;
  }
) =>
  apiRequest<WastePickup>("/api/waste/pickups", {
    method: "POST",
    token,
    body: payload,
  });

export const rescheduleWastePickupApi = (
  token: string,
  pickupId: string,
  payload: {
    pickupDate?: string;
    pickupTime?: string;
    location?: string;
  }
) =>
  apiRequest<WastePickup>(`/api/waste/pickups/${pickupId}/reschedule`, {
    method: "PATCH",
    token,
    body: payload,
  });

export const getAdminUsersApi = (
  token: string,
  filters?: {
    role?: UserRole;
    verificationStatus?: "pending" | "verified" | "rejected";
  }
) =>
  apiRequest<BackendUser[]>(
    withQuery("/api/admin/users", {
      role: filters?.role,
      verificationStatus: filters?.verificationStatus,
    }),
    { token }
  );

export const getPendingUsersApi = (token: string) => apiRequest<BackendUser[]>("/api/admin/users/pending", { token });

export const approveUserApi = (token: string, userId: string) =>
  apiRequest<BackendUser>(`/api/admin/users/${userId}/approve`, {
    method: "PATCH",
    token,
  });

export const rejectUserApi = (token: string, userId: string) =>
  apiRequest<BackendUser>(`/api/admin/users/${userId}/reject`, {
    method: "PATCH",
    token,
  });

export const assignWastePickupApi = (token: string, pickupId: string, agencyId: string) =>
  apiRequest<WastePickup>(`/api/admin/waste/pickups/${pickupId}/assign`, {
    method: "PATCH",
    token,
    body: { agencyId },
  });
