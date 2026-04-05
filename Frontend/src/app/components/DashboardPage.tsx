import { motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CircleMarker, MapContainer, TileLayer, Tooltip as LeafletTooltip, useMap } from 'react-leaflet';
import { 
  AlertTriangle, 
  Package, 
  MapPin, 
  Heart, 
  Trash2,
  TrendingUp,
  Clock,
  CheckCircle,
  ArrowRight,
  Activity,
  DollarSign,
  Truck,
  Building2,
  LogOut,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { SellToHospitalModal } from './modals/SellToHospitalModal';
import { SupplyMedicineModal } from './modals/SupplyMedicineModal';
import { DonateToNGOModal } from './modals/DonateToNGOModal';
import { ScheduleWastePickupModal } from './modals/ScheduleWastePickupModal';
import { useAuth } from '../context/AuthContext';
import 'leaflet/dist/leaflet.css';
import {
  cancelRetailerRedistributionRequestApi,
  createRetailerRedistributionRequestApi,
  getInventoryApi,
  getMarketplaceRequestsApi,
  getNgoNeedsApi,
  getRetailerMlInsightsApi,
  getRetailerRedistributionRequestsApi,
  respondRetailerRedistributionRequestApi,
  type InventoryItem,
  type MarketRequest,
  type MlInsightsResponse,
  type NgoNeed,
  type RedistributionRequest,
} from '../lib/api';

type InventoryView = {
  id: string;
  name: string;
  quantity: number;
  expiry: string;
  status: 'safe' | 'warning' | 'critical';
  batch: string;
  mrp: number;
  gst: number;
};

type DemandView = {
  id: string;
  hospital: string;
  medicine: string;
  quantity: number;
  distance: string;
  address?: string;
  urgency: 'low' | 'medium' | 'high';
  mrp: number;
};

type RedistributionSuggestion = MlInsightsResponse['redistributionSuggestions'][number];

type DemandCoordinate = [number, number];

type MappedDemandView = DemandView & {
  coordinates: DemandCoordinate | null;
};

const DEFAULT_MAP_CENTER: DemandCoordinate = [20.5937, 78.9629];

const FALLBACK_HOSPITAL_COORDINATES: Record<string, DemandCoordinate> = {
  'city hospital': [28.6139, 77.209],
  'city general hospital': [28.6139, 77.209],
  'st. mary medical center': [19.076, 72.8777],
  'regional health clinic': [12.9716, 77.5946],
};

const geocodeQueryCache = new Map<string, DemandCoordinate>();
const demandCoordinateCache = new Map<string, DemandCoordinate>();

const normalizeLookupKey = (value: string) => value.trim().toLowerCase();

const getUrgencyMarkerColor = (urgency: DemandView['urgency']) => {
  if (urgency === 'high') {
    return '#ef4444';
  }

  if (urgency === 'medium') {
    return '#f97316';
  }

  return '#3b82f6';
};

const buildSeededFallbackCoordinate = (seedValue: string): DemandCoordinate => {
  const seed = seedValue
    .split('')
    .reduce((total, char, index) => total + char.charCodeAt(0) * (index + 1), 0);

  const latOffset = ((seed % 220) - 110) * 0.05;
  const lngOffset = (((seed * 7) % 300) - 150) * 0.06;

  return [
    Math.min(35.5, Math.max(7.5, DEFAULT_MAP_CENTER[0] + latOffset)),
    Math.min(96, Math.max(68, DEFAULT_MAP_CENTER[1] + lngOffset)),
  ];
};

const geocodeLocation = async (query: string): Promise<DemandCoordinate | null> => {
  const normalizedQuery = normalizeLookupKey(query);
  if (!normalizedQuery) {
    return null;
  }

  const cached = geocodeQueryCache.get(normalizedQuery);
  if (cached) {
    return cached;
  }

  try {
    const endpoint = `https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=in&limit=1&q=${encodeURIComponent(query)}`;
    const response = await fetch(endpoint, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    const rows = (await response.json()) as Array<{ lat?: string; lon?: string }>;
    if (!rows.length) {
      return null;
    }

    const lat = Number(rows[0].lat);
    const lon = Number(rows[0].lon);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return null;
    }

    const coordinate: DemandCoordinate = [lat, lon];
    geocodeQueryCache.set(normalizedQuery, coordinate);
    return coordinate;
  } catch {
    return null;
  }
};

function MapViewportController({ center, zoom }: { center: DemandCoordinate; zoom: number }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [map, center, zoom]);

  return null;
}

export function DashboardPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [selectedMedicine, setSelectedMedicine] = useState<string | null>(null);
  const [inventoryData, setInventoryData] = useState<InventoryView[]>([]);
  const [hospitalDemands, setHospitalDemands] = useState<DemandView[]>([]);
  const [demandCoordinates, setDemandCoordinates] = useState<Record<string, DemandCoordinate>>({});
  const [activeMapDemandId, setActiveMapDemandId] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<DemandCoordinate>(DEFAULT_MAP_CENTER);
  const [mapZoom, setMapZoom] = useState(5);
  const [ngoNeeds, setNgoNeeds] = useState<NgoNeed[]>([]);
  const [mlInsights, setMlInsights] = useState<MlInsightsResponse | null>(null);
  const [incomingRedistributions, setIncomingRedistributions] = useState<RedistributionRequest[]>([]);
  const [outgoingRedistributions, setOutgoingRedistributions] = useState<RedistributionRequest[]>([]);
  const [redistributionActionId, setRedistributionActionId] = useState<string | null>(null);
  const [inventorySearchTerm, setInventorySearchTerm] = useState('');
  const [inventoryStatusFilter, setInventoryStatusFilter] = useState<'all' | InventoryView['status']>('all');
  const [loadingInsights, setLoadingInsights] = useState(false);
  
  // Modal states
  const [sellModalOpen, setSellModalOpen] = useState(false);
  const [supplyModalOpen, setSupplyModalOpen] = useState(false);
  const [donateModalOpen, setDonateModalOpen] = useState(false);
  const [wasteModalOpen, setWasteModalOpen] = useState(false);
  
  // Selected items for modals
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryView | null>(null);
  const [selectedDemand, setSelectedDemand] = useState<DemandView | null>(null);

  const handleSellClick = (item: InventoryView) => {
    setSelectedInventoryItem(item);
    setSellModalOpen(true);
  };

  const handleSupplyClick = (demand: DemandView) => {
    setSelectedDemand(demand);
    setSupplyModalOpen(true);
  };

  const handleDonateClick = (item: InventoryView) => {
    setSelectedInventoryItem(item);
    setDonateModalOpen(true);
  };

  const handleWasteClick = (item: InventoryView) => {
    setSelectedInventoryItem(item);
    setWasteModalOpen(true);
  };

  const { logout, token } = useAuth();

  const getDaysToExpiry = (expiryDate?: string) => {
    if (!expiryDate) {
      return 365;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const normalizePriority = (priority: string) => {
    if (priority === 'high') {
      return 'high';
    }

    if (priority === 'medium') {
      return 'medium';
    }

    return 'low';
  };

  const loadDashboardData = useCallback(async () => {
    if (!token) {
      return;
    }

    setLoadingInsights(true);

    const loadCoreData = async () => {
      try {
        const [inventoryItems, requests, needs, redistributionQueue] = await Promise.all([
          getInventoryApi(token),
          getMarketplaceRequestsApi(token),
          getNgoNeedsApi(token, { status: 'open' }),
          getRetailerRedistributionRequestsApi(token),
        ]);

        const mappedInventory = inventoryItems.map((item: InventoryItem) => ({
          id: item._id,
          name: item.name,
          quantity: item.quantity,
          expiry: `${Math.max(getDaysToExpiry(item.expiryDate), 0)} days`,
          status: item.status,
          batch: item.batchNumber || 'N/A',
          mrp: item.mrp || 0,
          gst: item.gstPercent || 18,
        }));

        const mappedDemands = requests
          .filter((request: MarketRequest) => request.status === 'pending' || request.status === 'matched')
          .map((request: MarketRequest) => ({
            id: request._id,
            hospital:
              request.hospitalId?.organizationName ||
              request.hospitalId?.name ||
              'Hospital request',
            medicine: request.medicineName,
            quantity: request.quantity,
            distance: request.hospitalId?.address ? 'Address available' : 'network',
            address: request.hospitalId?.address || undefined,
            urgency: normalizePriority(request.priority),
            mrp: 0,
          }));

        setInventoryData(mappedInventory);
        setHospitalDemands(mappedDemands);
        setNgoNeeds(needs);
        setIncomingRedistributions(redistributionQueue.incoming || []);
        setOutgoingRedistributions(redistributionQueue.outgoing || []);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load dashboard data';
        toast.error(message);
      }
    };

    const loadMlData = async () => {
      try {
        const insights = await getRetailerMlInsightsApi(token);
        setMlInsights(insights);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load AI insights';
        toast.error(message);
      }
    };

    await Promise.allSettled([loadCoreData(), loadMlData()]);
    setLoadingInsights(false);
  }, [token]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const totalInventoryItems = inventoryData.reduce((total, item) => total + item.quantity, 0);
  const highRiskItems = mlInsights?.summary.highRiskItems || 0;
  const projectedLoss = mlInsights?.summary.projectedLoss || 0;
  const maxInventoryQuantity = Math.max(...inventoryData.map((item) => item.quantity), 1);
  const topRiskItem = mlInsights?.expiryPredictions?.[0];
  const topRedistribution = mlInsights?.redistributionSuggestions?.[0];
  const ngoDonations = useMemo(
    () =>
      ngoNeeds.slice(0, 4).map((need) => ({
        id: need._id,
        ngo:
          typeof need.ngoId === 'string'
            ? 'NGO'
            : need.ngoId?.organizationName || need.ngoId?.name || 'NGO',
        request: need.medicineName,
        items: `${need.quantity} units`,
        verified: true,
      })),
    [ngoNeeds]
  );

  const turnoverData = useMemo(() => {
    const rows = inventoryData.slice(0, 6).map((item) => ({
      month: item.name.split(' ')[0],
      value: item.quantity,
    }));

    return rows.length > 0 ? rows : [{ month: 'N/A', value: 0 }];
  }, [inventoryData]);

  const expiryRiskData = useMemo(() => {
    const predictions = mlInsights?.expiryPredictions || [];
    if (!predictions.length) {
      return [
        { month: 'Low', value: 0 },
        { month: 'Moderate', value: 0 },
        { month: 'High', value: 0 },
        { month: 'Critical', value: 0 },
      ];
    }

    const buckets = {
      Low: 0,
      Moderate: 0,
      High: 0,
      Critical: 0,
    };

    predictions.forEach((item) => {
      const risk = Number(item.riskProbability || 0);

      if (risk < 0.3) {
        buckets.Low += 1;
      } else if (risk < 0.55) {
        buckets.Moderate += 1;
      } else if (risk < 0.75) {
        buckets.High += 1;
      } else {
        buckets.Critical += 1;
      }
    });

    return [
      { month: 'Low', value: buckets.Low },
      { month: 'Moderate', value: buckets.Moderate },
      { month: 'High', value: buckets.High },
      { month: 'Critical', value: buckets.Critical },
    ];
  }, [mlInsights]);

  const mapDemands = useMemo<MappedDemandView[]>(() => {
    return hospitalDemands.map((demand) => ({
      ...demand,
      coordinates: demandCoordinates[demand.id] || null,
    }));
  }, [hospitalDemands, demandCoordinates]);

  useEffect(() => {
    if (!hospitalDemands.length) {
      setDemandCoordinates({});
      return;
    }

    let isCancelled = false;

    const resolveDemandCoordinates = async () => {
      const resolvedEntries = await Promise.all(
        hospitalDemands.map(async (demand, index) => {
          const cachedDemandCoordinate = demandCoordinateCache.get(demand.id);
          if (cachedDemandCoordinate) {
            return [demand.id, cachedDemandCoordinate] as const;
          }

          const fallbackByName = FALLBACK_HOSPITAL_COORDINATES[normalizeLookupKey(demand.hospital)];
          let resolvedCoordinate: DemandCoordinate | null = fallbackByName || null;

          const queries = [demand.address, demand.hospital]
            .filter((value): value is string => Boolean(value && value.trim()))
            .map((value) => `${value}, India`);

          for (const query of queries) {
            const geocoded = await geocodeLocation(query);
            if (geocoded) {
              resolvedCoordinate = geocoded;
              break;
            }
          }

          if (!resolvedCoordinate) {
            resolvedCoordinate = buildSeededFallbackCoordinate(`${demand.id}:${demand.hospital}:${index}`);
          }

          demandCoordinateCache.set(demand.id, resolvedCoordinate);
          return [demand.id, resolvedCoordinate] as const;
        })
      );

      if (isCancelled) {
        return;
      }

      const nextCoordinates: Record<string, DemandCoordinate> = {};
      resolvedEntries.forEach(([demandId, coordinate]) => {
        nextCoordinates[demandId] = coordinate;
      });

      setDemandCoordinates(nextCoordinates);
    };

    resolveDemandCoordinates();

    return () => {
      isCancelled = true;
    };
  }, [hospitalDemands]);

  useEffect(() => {
    if (!mapDemands.length) {
      setActiveMapDemandId(null);
      setMapCenter(DEFAULT_MAP_CENTER);
      setMapZoom(5);
      return;
    }

    if (!activeMapDemandId || !mapDemands.some((demand) => demand.id === activeMapDemandId)) {
      setActiveMapDemandId(mapDemands[0].id);
    }
  }, [mapDemands, activeMapDemandId]);

  const activeMapDemand = mapDemands.find((demand) => demand.id === activeMapDemandId) || null;

  useEffect(() => {
    if (!mapDemands.length) {
      return;
    }

    const activeDemand = mapDemands.find((demand) => demand.id === activeMapDemandId);
    if (activeDemand?.coordinates) {
      setMapCenter(activeDemand.coordinates);
      return;
    }

    const firstMapped = mapDemands.find((demand) => demand.coordinates);
    if (firstMapped?.coordinates) {
      setMapCenter(firstMapped.coordinates);
    }
  }, [mapDemands, activeMapDemandId]);

  const focusDemandOnMap = (demandId: string) => {
    setActiveMapDemandId(demandId);

    const coordinate = demandCoordinates[demandId];
    if (coordinate) {
      setMapCenter(coordinate);
      setMapZoom(10);
    }
  };

  const filteredInventoryData = useMemo(() => {
    const normalizedSearch = inventorySearchTerm.trim().toLowerCase();

    return inventoryData.filter((item) => {
      if (inventoryStatusFilter !== 'all' && item.status !== inventoryStatusFilter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return `${item.name} ${item.batch}`.toLowerCase().includes(normalizedSearch);
    });
  }, [inventoryData, inventorySearchTerm, inventoryStatusFilter]);

  const createRedistributionFromSuggestion = async (suggestion: RedistributionSuggestion) => {
    if (!token) {
      toast.error('Please login again to continue');
      return;
    }

    const targetRetailer = suggestion.targetRetailers?.[0];
    if (!targetRetailer) {
      toast.error('No target retailer available for this suggestion');
      return;
    }

    const actionKey = `${suggestion.inventoryItemId}:${targetRetailer.retailerId}`;
    setRedistributionActionId(actionKey);

    try {
      await createRetailerRedistributionRequestApi(token, {
        inventoryItemId: suggestion.inventoryItemId,
        targetRetailerId: targetRetailer.retailerId,
        quantity: suggestion.recommendedTransferQuantity,
        modelConfidence: suggestion.modelConfidence,
        modelSuggestedStore: suggestion.modelSuggestedStore,
        reason: `AI recommended redistribution to low-stock retailer ${targetRetailer.retailerName}`,
      });

      toast.success('Redistribution request sent to target retailer');
      await loadDashboardData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create redistribution request';
      toast.error(message);
    } finally {
      setRedistributionActionId(null);
    }
  };

  const handleRespondRedistribution = async (requestId: string, action: 'accept' | 'reject') => {
    if (!token) {
      toast.error('Please login again to continue');
      return;
    }

    setRedistributionActionId(requestId);

    try {
      await respondRetailerRedistributionRequestApi(token, requestId, action);
      toast.success(action === 'accept' ? 'Redistribution accepted and inventory updated' : 'Redistribution rejected');
      await loadDashboardData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to respond to redistribution request';
      toast.error(message);
    } finally {
      setRedistributionActionId(null);
    }
  };

  const handleCancelRedistribution = async (requestId: string) => {
    if (!token) {
      toast.error('Please login again to continue');
      return;
    }

    setRedistributionActionId(requestId);

    try {
      await cancelRetailerRedistributionRequestApi(token, requestId);
      toast.success('Redistribution request cancelled');
      await loadDashboardData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to cancel redistribution request';
      toast.error(message);
    } finally {
      setRedistributionActionId(null);
    }
  };

  const pendingIncomingRedistributions = incomingRedistributions.filter((item) => item.status === 'pending');
  const pendingOutgoingRedistributions = outgoingRedistributions.filter((item) => item.status === 'pending');

  const getRetailerDisplayName = (retailer?: { name?: string; organizationName?: string }) =>
    retailer?.organizationName || retailer?.name || 'Retailer';

  const getRedistributionStatusClass = (status: RedistributionRequest['status']) => {
    if (status === 'completed') {
      return 'bg-green-100 text-green-700';
    }

    if (status === 'pending') {
      return 'bg-orange-100 text-orange-700';
    }

    if (status === 'rejected') {
      return 'bg-red-100 text-red-700';
    }

    return 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-cyan-50/30 to-teal-50/40">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                Medisync Dashboard
              </h1>
              <p className="text-sm text-gray-500">Retailer Portal</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => onNavigate('landing')}>
                Home
              </Button>
              <Button variant="outline" onClick={logout}>
                <LogOut className="w-4 h-4 mr-1" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="p-6 bg-white/80 backdrop-blur-xl border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <AlertTriangle className="w-8 h-8 text-orange-500" />
                <Badge variant="destructive">Critical</Badge>
              </div>
              <h3 className="text-3xl mb-1">{highRiskItems}</h3>
              <p className="text-sm text-gray-600">High-risk medicines likely to expire before sale</p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="p-6 bg-white/80 backdrop-blur-xl border-l-4 border-l-teal-500 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <Package className="w-8 h-8 text-teal-500" />
                <Badge className="bg-teal-100 text-teal-700">Active</Badge>
              </div>
              <h3 className="text-3xl mb-1">{totalInventoryItems}</h3>
              <p className="text-sm text-gray-600">Total inventory packets in stock</p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="p-6 bg-white/80 backdrop-blur-xl border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <MapPin className="w-8 h-8 text-blue-500" />
                <Badge className="bg-blue-100 text-blue-700">Nearby</Badge>
              </div>
              <h3 className="text-3xl mb-1">{hospitalDemands.length}</h3>
              <p className="text-sm text-gray-600">Active requests awaiting supply</p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="p-6 bg-white/80 backdrop-blur-xl border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-8 h-8 text-green-500" />
                <Badge className="bg-green-100 text-green-700">AI</Badge>
              </div>
              <h3 className="text-3xl mb-1">₹{projectedLoss.toLocaleString()}</h3>
              <p className="text-sm text-gray-600">Projected value-at-risk from expiry</p>
            </Card>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Inventory Panel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-2"
          >
            <Card className="p-6 bg-white/80 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl mb-1">Inventory Panel</h2>
                  <p className="text-sm text-gray-500">Medicines with expiry countdown timers</p>
                </div>
                <Package className="w-6 h-6 text-teal-500" />
              </div>

              <div className="grid md:grid-cols-3 gap-3 mb-4">
                <div className="md:col-span-2 relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    value={inventorySearchTerm}
                    onChange={(event) => setInventorySearchTerm(event.target.value)}
                    placeholder="Search medicine or batch"
                    className="pl-9"
                  />
                </div>

                <select
                  value={inventoryStatusFilter}
                  onChange={(event) =>
                    setInventoryStatusFilter(event.target.value as 'all' | InventoryView['status'])
                  }
                  className="h-10 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="all">All status</option>
                  <option value="critical">Critical</option>
                  <option value="warning">Warning</option>
                  <option value="safe">Safe</option>
                </select>
              </div>

              <div className="mb-4 flex items-center justify-between text-xs text-gray-500">
                <span>Showing {filteredInventoryData.length} of {inventoryData.length} items</span>
                {(inventorySearchTerm || inventoryStatusFilter !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setInventorySearchTerm('');
                      setInventoryStatusFilter('all');
                    }}
                    className="text-teal-600 hover:text-teal-700"
                  >
                    Clear filters
                  </button>
                )}
              </div>

              <div className="space-y-4 max-h-[680px] overflow-y-auto pr-2">
                {!loadingInsights && inventoryData.length === 0 && (
                  <div className="p-4 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-xl">
                    No inventory items found. Add inventory records to see live insights.
                  </div>
                )}

                {!loadingInsights && inventoryData.length > 0 && filteredInventoryData.length === 0 && (
                  <div className="p-4 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-xl">
                    No inventory items matched your filters.
                  </div>
                )}

                {filteredInventoryData.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    onClick={() => setSelectedMedicine(item.id)}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      selectedMedicine === item.id
                        ? 'border-teal-500 bg-teal-50/50'
                        : 'border-gray-100 hover:border-teal-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-medium mb-1">{item.name}</h3>
                        <p className="text-xs text-gray-500">Batch: {item.batch}</p>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={
                            item.status === 'critical'
                              ? 'destructive'
                              : item.status === 'warning'
                              ? 'default'
                              : 'secondary'
                          }
                          className={
                            item.status === 'warning'
                              ? 'bg-orange-100 text-orange-700'
                              : item.status === 'safe'
                              ? 'bg-green-100 text-green-700'
                              : ''
                          }
                        >
                          {item.expiry}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>Quantity</span>
                          <span>{item.quantity} units</span>
                        </div>
                        <Progress
                          value={(item.quantity / maxInventoryQuantity) * 100}
                          className="h-2"
                        />
                      </div>
                      <Clock className="w-4 h-4 text-gray-400" />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSellClick(item);
                        }}
                        className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
                      >
                        <Building2 className="w-3 h-3 mr-1" />
                        Sell to Hospital
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDonateClick(item);
                        }}
                        className="flex-1 border-pink-200 text-pink-600 hover:bg-pink-50"
                      >
                        <Heart className="w-3 h-3 mr-1" />
                        Donate
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleWasteClick(item);
                        }}
                        className="border-gray-300 text-gray-600 hover:bg-gray-50"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Waste
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* AI Alert Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="p-6 bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl">AI Alerts</h2>
                  <p className="text-sm text-gray-600">Smart predictions</p>
                </div>
              </div>

              <div className="space-y-4">
                {loadingInsights && (
                  <div className="p-4 bg-white rounded-xl border border-orange-100 text-sm text-gray-600">
                    Loading AI insights...
                  </div>
                )}

                {!loadingInsights && (
                  <>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="p-4 bg-white rounded-xl border-l-4 border-l-red-500 cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                        <div>
                          <p className="text-sm mb-1">
                            <span className="font-semibold">{highRiskItems} medicines</span> are flagged to expire before sale
                          </p>
                          <p className="text-xs text-gray-500">Projected loss: ₹{projectedLoss.toLocaleString()}</p>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="p-4 bg-white rounded-xl border-l-4 border-l-orange-500 cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        <TrendingUp className="w-5 h-5 text-orange-500 mt-0.5" />
                        <div>
                          <p className="text-sm mb-1">
                            Highest risk: <span className="font-semibold">{topRiskItem?.medicineName || 'No current risk spike'}</span>
                          </p>
                          <p className="text-xs text-gray-500">
                            Risk score: {topRiskItem ? `${Math.round(topRiskItem.riskProbability * 100)}%` : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="p-4 bg-white rounded-xl border-l-4 border-l-green-500 cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                        <div>
                          <p className="text-sm mb-1">
                            Redistribution target: <span className="font-semibold">{topRedistribution?.targetRetailers?.[0]?.retailerName || 'No shortage detected'}</span>
                          </p>
                          <p className="text-xs text-gray-500">
                            Suggested transfer: {topRedistribution?.recommendedTransferQuantity || 0} packets
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  </>
                )}
              </div>

              <Button
                onClick={loadDashboardData}
                className="w-full mt-6 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              >
                Refresh AI Insights
              </Button>

              {!!mlInsights?.redistributionSuggestions?.length && (
                <div className="mt-4 space-y-2 max-h-[260px] overflow-y-auto pr-1">
                  {mlInsights.redistributionSuggestions.slice(0, 3).map((suggestion) => (
                    <div
                      key={suggestion.inventoryItemId}
                      className="p-3 rounded-lg border border-green-100 bg-white/90"
                    >
                      {suggestion.targetRetailers?.[0] && (
                        <div className="mb-2 flex justify-end">
                          <Button
                            size="sm"
                            onClick={() => createRedistributionFromSuggestion(suggestion)}
                            disabled={
                              redistributionActionId ===
                              `${suggestion.inventoryItemId}:${suggestion.targetRetailers[0].retailerId}`
                            }
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {redistributionActionId ===
                            `${suggestion.inventoryItemId}:${suggestion.targetRetailers[0].retailerId}`
                              ? 'Sending...'
                              : 'Redistribute to Retailer'}
                          </Button>
                        </div>
                      )}
                      <p className="text-sm text-gray-800">
                        <span className="font-semibold">{suggestion.medicineName}</span> can be moved to{' '}
                        <span className="font-semibold">
                          {suggestion.targetRetailers?.[0]?.retailerName || 'recommended retailer'}
                        </span>
                      </p>
                      <p className="text-xs text-gray-500">
                        Suggested transfer: {suggestion.recommendedTransferQuantity} packets • Model confidence:{' '}
                        {Math.round((suggestion.modelConfidence || 0) * 100)}%
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <Card className="p-6 bg-white/80 backdrop-blur-xl border border-amber-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl">Incoming Low-Stock Redistribution</h2>
                <Badge className="bg-amber-100 text-amber-700">{pendingIncomingRedistributions.length} pending</Badge>
              </div>

              <div className="space-y-3">
                {!loadingInsights && incomingRedistributions.length > 4 && (
                  <p className="text-xs text-gray-500">Scroll to view all incoming requests</p>
                )}

                {pendingIncomingRedistributions.length === 0 && (
                  <div className="p-4 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-xl">
                    No incoming redistribution requests at the moment.
                  </div>
                )}

                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2">
                {pendingIncomingRedistributions.map((request) => (
                  <div key={request._id} className="p-4 rounded-xl border border-amber-100 bg-white">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <p className="text-sm font-medium text-gray-900">{request.medicineName}</p>
                      <Badge className={getRedistributionStatusClass(request.status)}>{request.status}</Badge>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">
                      From: {getRetailerDisplayName(request.fromRetailerId)}
                    </p>
                    <p className="text-xs text-gray-500 mb-3">
                      Quantity: {request.quantity} • AI confidence: {Math.round((request.modelConfidence || 0) * 100)}%
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleRespondRedistribution(request._id, 'accept')}
                        disabled={redistributionActionId === request._id}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRespondRedistribution(request._id, 'reject')}
                        disabled={redistributionActionId === request._id}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="p-6 bg-white/80 backdrop-blur-xl border border-green-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl">Outgoing Redistribution Queue</h2>
                <Badge className="bg-green-100 text-green-700">{pendingOutgoingRedistributions.length} pending</Badge>
              </div>

              <div className="space-y-3">
                {!loadingInsights && outgoingRedistributions.length > 5 && (
                  <p className="text-xs text-gray-500">Scroll to view all outgoing requests</p>
                )}

                {outgoingRedistributions.length === 0 && (
                  <div className="p-4 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-xl">
                    No outgoing redistribution proposals yet.
                  </div>
                )}

                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2">
                {outgoingRedistributions.map((request) => (
                  <div key={request._id} className="p-4 rounded-xl border border-green-100 bg-white">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <p className="text-sm font-medium text-gray-900">{request.medicineName}</p>
                      <Badge className={getRedistributionStatusClass(request.status)}>{request.status}</Badge>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">
                      To: {getRetailerDisplayName(request.toRetailerId)}
                    </p>
                    <p className="text-xs text-gray-500 mb-3">
                      Quantity: {request.quantity} • Suggested store: {request.modelSuggestedStore || 'N/A'}
                    </p>

                    {request.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancelRedistribution(request._id)}
                        disabled={redistributionActionId === request._id}
                      >
                        {redistributionActionId === request._id ? 'Cancelling...' : 'Cancel Request'}
                      </Button>
                    )}
                  </div>
                ))}
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Demand Map and Marketplace */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="p-6 bg-white/80 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl mb-1">Nearby Demand Map</h2>
                  <p className="text-sm text-gray-500">Hospitals needing medicines</p>
                </div>
                <MapPin className="w-6 h-6 text-blue-500" />
              </div>

              <div className="aspect-video rounded-xl mb-4 relative overflow-hidden border border-blue-100">
                <MapContainer
                  center={mapCenter}
                  zoom={mapZoom}
                  scrollWheelZoom
                  className="h-full w-full z-10"
                >
                  <MapViewportController center={mapCenter} zoom={mapZoom} />
                  <TileLayer
                    attribution="&copy; OpenStreetMap contributors"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  {mapDemands.map((demand) => {
                    if (!demand.coordinates) {
                      return null;
                    }

                    const isActive = demand.id === activeMapDemandId;
                    const markerColor = getUrgencyMarkerColor(demand.urgency);

                    return (
                      <CircleMarker
                        key={demand.id}
                        center={demand.coordinates}
                        radius={isActive ? 10 : 8}
                        pathOptions={{
                          color: '#ffffff',
                          fillColor: markerColor,
                          fillOpacity: 0.88,
                          weight: isActive ? 3 : 2,
                        }}
                        eventHandlers={{
                          click: () => focusDemandOnMap(demand.id),
                        }}
                      >
                        <LeafletTooltip direction="top" offset={[0, -8]} opacity={1}>
                          <div className="text-xs">
                            <p className="font-semibold text-gray-900">{demand.hospital}</p>
                            <p className="text-gray-700">{demand.medicine} • {demand.quantity} units</p>
                          </div>
                        </LeafletTooltip>
                      </CircleMarker>
                    );
                  })}
                </MapContainer>

                {!loadingInsights && mapDemands.length > 0 && (
                  <div className="absolute left-3 top-3 z-[450] rounded-lg border border-blue-100 bg-white/95 px-2 py-1 text-xs text-gray-700 shadow-sm">
                    {mapDemands.filter((demand) => demand.coordinates).length} mapped demand points
                  </div>
                )}

                {!loadingInsights && mapDemands.length === 0 && (
                  <div className="absolute inset-0 z-[450] flex items-center justify-center text-sm text-gray-500 bg-white/80">
                    No active hospital demand to plot.
                  </div>
                )}

                {activeMapDemand && (
                  <div className="absolute left-3 right-3 bottom-3 z-[450] p-3 bg-white/95 rounded-xl border border-blue-100 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{activeMapDemand.hospital}</p>
                        <p className="text-xs text-gray-600">
                          {activeMapDemand.medicine} • {activeMapDemand.quantity} units
                        </p>
                        {activeMapDemand.address && (
                          <p className="text-[11px] text-gray-500 mt-1">{activeMapDemand.address}</p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleSupplyClick(activeMapDemand)}
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                      >
                        Supply
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {!loadingInsights && hospitalDemands.length === 0 && (
                  <div className="p-3 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-xl">
                    No active hospital requests currently.
                  </div>
                )}

                <div className="space-y-3 max-h-[320px] overflow-y-auto pr-2">
                {hospitalDemands.map((demand) => (
                  <motion.div
                    key={demand.id}
                    whileHover={{ scale: 1.02 }}
                    className={`p-3 bg-white rounded-lg border transition-all ${
                      activeMapDemandId === demand.id
                        ? 'border-blue-400 shadow-sm'
                        : 'border-gray-100 hover:border-blue-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium">{demand.hospital}</h4>
                      <Badge
                        variant={demand.urgency === 'high' ? 'destructive' : 'secondary'}
                        className={demand.urgency === 'medium' ? 'bg-orange-100 text-orange-700' : ''}
                      >
                        {demand.urgency}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 mb-3">{demand.medicine} • {demand.quantity} units</p>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center text-xs text-gray-500">
                        <MapPin className="w-3 h-3 mr-1" />
                        {demand.address || demand.distance}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => focusDemandOnMap(demand.id)}
                        >
                          Locate
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSupplyClick(demand)}
                          className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                        >
                          Supply Medicine
                          <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="p-6 bg-white/80 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl mb-1">Donation Channel</h2>
                  <p className="text-sm text-gray-500">NGO requests</p>
                </div>
                <Heart className="w-6 h-6 text-pink-500" />
              </div>

              <div className="space-y-4">
                {!loadingInsights && ngoDonations.length === 0 && (
                  <div className="p-4 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-xl">
                    No open NGO needs available right now.
                  </div>
                )}

                <div className="space-y-4 max-h-[320px] overflow-y-auto pr-2">
                {ngoDonations.map((ngo) => (
                  <motion.div
                    key={ngo.id}
                    whileHover={{ scale: 1.02 }}
                    className="p-4 bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl border border-pink-100 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{ngo.ngo}</h4>
                          {ngo.verified && (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{ngo.request}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{ngo.items}</span>
                      <Button size="sm" variant="outline" className="text-pink-600 border-pink-200 hover:bg-pink-50">
                        Donate from Inventory
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
                </div>
              </div>

              <div className="mt-6 p-4 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">Open NGO requests</p>
                    <p className="text-2xl">{ngoNeeds.length}</p>
                  </div>
                  <Heart className="w-10 h-10 opacity-80" />
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="p-6 bg-white/80 backdrop-blur-xl">
              <h2 className="text-xl mb-6">Top Inventory Quantities</h2>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={turnoverData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip />
                  <Bar dataKey="value" fill="url(#colorTurnover)" radius={[8, 8, 0, 0]} />
                  <defs>
                    <linearGradient id="colorTurnover" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#14b8a6" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card className="p-6 bg-white/80 backdrop-blur-xl">
              <h2 className="text-xl mb-6">AI Expiry Risk Distribution</h2>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={expiryRiskData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#f97316" 
                    strokeWidth={3}
                    dot={{ fill: '#f97316', r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>
        </div>

        {/* Waste Disposal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Card className="p-6 bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-600 to-slate-700 rounded-2xl flex items-center justify-center">
                  <Trash2 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-xl mb-1">Waste Disposal Request</h2>
                  <p className="text-sm text-gray-600">Use per-item Waste action above to schedule certified pickup</p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Modals */}
      <SellToHospitalModal
        isOpen={sellModalOpen}
        onClose={() => setSellModalOpen(false)}
        medicine={selectedInventoryItem}
      />
      <SupplyMedicineModal
        isOpen={supplyModalOpen}
        onClose={() => setSupplyModalOpen(false)}
        demand={selectedDemand}
        inventoryOptions={inventoryData.map((item) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
        }))}
        onSupplied={loadDashboardData}
      />
      <DonateToNGOModal
        isOpen={donateModalOpen}
        onClose={() => setDonateModalOpen(false)}
        medicine={selectedInventoryItem}
        onDonated={loadDashboardData}
      />
      <ScheduleWastePickupModal
        isOpen={wasteModalOpen}
        onClose={() => setWasteModalOpen(false)}
        medicine={selectedInventoryItem}
        onCreated={loadDashboardData}
      />
    </div>
  );
}