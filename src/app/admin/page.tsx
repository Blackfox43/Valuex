import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/ui/Card.tsx";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../../components/ui/Table.tsx";
import { Button } from "../../components/ui/Button.tsx";
import { Input } from "../../components/ui/Input.tsx";
import { api, User, GiftCard } from "../../lib/api.ts";
import { 
  ShieldAlert, 
  Check, 
  X, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  Award, 
  DollarSign, 
  AlertTriangle, 
  PlayCircle,
  HelpCircle,
  Database,
  Sparkles,
  Activity
} from "lucide-react";

interface AdminDashboardProps {
  adminUser: User | null;
  onRefreshPlatform?: () => void;
}

export default function AdminDashboard({ adminUser, onRefreshPlatform }: AdminDashboardProps) {
  const [cards, setCards] = useState<GiftCard[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [actionLoadingId, setActionLoadingId] = useState<string>("");

  // Visible Card credentials map (track revealed IDs)
  const [revealedCardIds, setRevealedCardIds] = useState<Record<string, boolean>>({});

  // Trust score custom form states
  const [customTrustScore, setCustomTrustScore] = useState<Record<string, string>>({});

  // Google AdSense Settings State
  const [adsSettings, setAdsSettings] = useState<any>(null);
  const [adsLoading, setAdsLoading] = useState<boolean>(true);
  const [adsSaving, setAdsSaving] = useState<boolean>(false);
  const [simulating, setSimulating] = useState<boolean>(false);
  const [adsClient, setAdsClient] = useState<string>("");
  const [adsHeaderSlot, setAdsHeaderSlot] = useState<string>("");
  const [adsSidebarSlot, setAdsSidebarSlot] = useState<string>("");
  const [adsNativeSlot, setAdsNativeSlot] = useState<string>("");
  const [adsEnabled, setAdsEnabled] = useState<boolean>(true);

  // System integration status state
  const [systemStatus, setSystemStatus] = useState<{
    stripeLive: boolean;
    cardcashLive: boolean;
    giftbitLive: boolean;
    geminiLive: boolean;
  } | null>(null);

  const loadAdsSettings = async () => {
    setAdsLoading(true);
    try {
      const data = await api.getAdsSettings();
      setAdsSettings(data);
      setAdsClient(data.client || "");
      setAdsHeaderSlot(data.headerSlot || "");
      setAdsSidebarSlot(data.sidebarSlot || "");
      setAdsNativeSlot(data.nativeSlot || "");
      setAdsEnabled(data.enabled !== false);
    } catch (err) {
      console.error("Failed to load Google AdSense settings:", err);
    } finally {
      setAdsLoading(false);
    }
  };

  const loadAdminData = async () => {
    setLoading(true);
    setError("");
    try {
      const [cardsData, usersData, statusData] = await Promise.all([
        api.getCards(),
        api.listUsers(),
        api.getSystemStatus().catch(err => {
          console.warn("Failed to fetch system status", err);
          return { stripeLive: false, cardcashLive: false, giftbitLive: false, geminiLive: false };
        }),
        loadAdsSettings()
      ]);
      setCards(cardsData);
      setUsers(usersData);
      setSystemStatus(statusData);
    } catch (err: any) {
      setError("Failed to load admin verification data queue");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [adminUser]);

  const toggleRevealCredentials = (id: string) => {
    setRevealedCardIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleVerifyCard = async (id: string) => {
    setActionLoadingId(id);
    try {
      await api.verifyCard(id);
      await loadAdminData();
      if (onRefreshPlatform) onRefreshPlatform();
    } catch (err: any) {
      alert(err.message || "Failed to verify gift card");
    } finally {
      setActionLoadingId("");
    }
  };

  const handlePayCard = async (id: string) => {
    setActionLoadingId(id);
    try {
      await api.triggerPayout(id);
      await loadAdminData();
      if (onRefreshPlatform) onRefreshPlatform();
    } catch (err: any) {
      alert(err.message || "Failed to issue payout");
    } finally {
      setActionLoadingId("");
    }
  };

  const handleRejectCard = async (id: string) => {
    setActionLoadingId(id);
    try {
      await api.rejectCard(id);
      await loadAdminData();
      if (onRefreshPlatform) onRefreshPlatform();
    } catch (err: any) {
      alert(err.message || "Failed to reject card");
    } finally {
      setActionLoadingId("");
    }
  };

  const handleUpdateTrustScore = async (userId: string) => {
    const scoreVal = parseInt(customTrustScore[userId]);
    if (isNaN(scoreVal) || scoreVal < 0 || scoreVal > 100) {
      alert("Please enter a valid trust score between 0 and 100");
      return;
    }

    try {
      await api.updateUserTrustScore(userId, scoreVal);
      alert("Seller trust score updated successfully");
      await loadAdminData();
      if (onRefreshPlatform) onRefreshPlatform();
    } catch (err: any) {
      alert(err.message || "Failed to update trust score");
    }
  };

  const handleSaveAdsSettings = async () => {
    setAdsSaving(true);
    try {
      const res = await api.updateAdsSettings({
        enabled: adsEnabled,
        client: adsClient,
        headerSlot: adsHeaderSlot,
        sidebarSlot: adsSidebarSlot,
        nativeSlot: adsNativeSlot
      });
      if (res.success) {
        setAdsSettings(res.adsSettings);
        alert("Google AdSense monetization settings saved successfully!");
      }
    } catch (err: any) {
      alert(err.message || "Failed to save AdSense settings");
    } finally {
      setAdsSaving(false);
    }
  };

  const handleSimulateAdEvent = async (type: 'impression' | 'click') => {
    try {
      const res = await api.trackAdEvent(type);
      if (res.success) {
        setAdsSettings(res.adsSettings);
      }
    } catch (err: any) {
      console.warn("Failed to simulate ad event", err);
    }
  };

  const handleSimulateBatch = async (type: 'impression' | 'click', count: number) => {
    setSimulating(true);
    try {
      for (let i = 0; i < count; i++) {
        await api.trackAdEvent(type);
      }
      const data = await api.getAdsSettings();
      setAdsSettings(data);
    } catch (err) {
      console.warn("Failed batch simulation", err);
    } finally {
      setSimulating(false);
    }
  };

  const handleResetAppDb = async () => {
    if (!window.confirm("Are you sure you want to reset the platform database to seed settings? This will wipe new listings.")) return;
    try {
      await api.resetState();
      await loadAdminData();
      if (onRefreshPlatform) onRefreshPlatform();
      alert("Database successfully reset");
    } catch (err: any) {
      alert(err.message || "Failed to reset database");
    }
  };

  // Metrics
  const pendingCount = cards.filter(c => c.status === "PENDING").length;
  const verifiedCount = cards.filter(c => c.status === "VERIFIED").length;
  const paidOutValue = cards.filter(c => c.status === "PAID").reduce((sum, c) => sum + c.offerAmount, 0);

  return (
    <div className="space-y-4 text-slate-800">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-2">
            Admin Verification Queue <span className="text-[10px] bg-indigo-50 border border-indigo-150 text-indigo-700 font-bold px-2 py-0.5 rounded uppercase font-mono">System Master</span>
          </h2>
          <p className="text-xs text-slate-500">Reveal credentials, verify gift card balances, and release instant settlement payouts.</p>
        </div>

        <div className="flex gap-1.5">
          <Button
            id="admin-reset-db-btn"
            variant="outline"
            size="sm"
            onClick={handleResetAppDb}
            className="border-rose-200 hover:bg-rose-50 text-rose-600 py-1 px-2.5 text-xs"
          >
            <Database className="w-3.5 h-3.5 mr-1" /> Reset DB
          </Button>

          <Button
            id="admin-refresh-btn"
            variant="primary"
            size="sm"
            onClick={loadAdminData}
            disabled={loading}
            className="py-1 px-3 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh Queue
          </Button>
        </div>
      </div>

      {/* Dynamic API Integration & Simulation Registry */}
      <Card id="admin-integration-registry" className="bg-white border border-slate-200 shadow-sm mt-1">
        <CardHeader className="bg-slate-50/40 p-3 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-indigo-600" />
              <span>Programmatic Integrations & Live Gateway Registry</span>
            </CardTitle>
            <CardDescription className="text-[11px] text-slate-500 font-medium">
              Monitor active production APIs, verify secret credential states, and track sandbox fallbacks.
            </CardDescription>
          </div>
          <span className="text-[10px] font-bold bg-amber-50 border border-amber-200 text-amber-800 px-2 py-0.5 rounded font-mono">
            {(!systemStatus || (!systemStatus.stripeLive && !systemStatus.cardcashLive && !systemStatus.giftbitLive)) ? "SIMULATOR ACTIVE" : "MIXED API MODE"}
          </span>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Stripe Payouts API */}
            <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 space-y-1.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase font-sans">Stripe Settlement Payouts</span>
                  {systemStatus?.stripeLive ? (
                    <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-150 px-1.5 py-0.2 rounded font-mono">LIVE API</span>
                  ) : (
                    <span className="text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-150 px-1.5 py-0.2 rounded font-mono">SIMULATED</span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 mt-1 font-medium leading-normal">
                  Settles bank (ACH), debit cards, and credit transfers to sellers.
                </p>
              </div>
              <div className="pt-1.5 border-t border-slate-100 text-[9px] font-mono font-medium text-slate-400">
                {systemStatus?.stripeLive ? (
                  <span className="text-emerald-600 font-bold flex items-center gap-1">✔ Key loaded: STRIPE_SECRET_KEY</span>
                ) : (
                  <span>Using Stripe mock sandbox gateway. Add STRIPE_SECRET_KEY to go live.</span>
                )}
              </div>
            </div>

            {/* CardCash programmatic API */}
            <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 space-y-1.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase font-sans">CardCash Verification</span>
                  {systemStatus?.cardcashLive ? (
                    <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-150 px-1.5 py-0.2 rounded font-mono">LIVE API</span>
                  ) : (
                    <span className="text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-150 px-1.5 py-0.2 rounded font-mono">SIMULATED</span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 mt-1 font-medium leading-normal">
                  Authenticates card numbers and returns real balance quotes.
                </p>
              </div>
              <div className="pt-1.5 border-t border-slate-100 text-[9px] font-mono font-medium text-slate-400">
                {systemStatus?.cardcashLive ? (
                  <span className="text-emerald-600 font-bold flex items-center gap-1">✔ Credentials loaded</span>
                ) : (
                  <span>Using mock checker. Add CARDCASH_API_EMAIL & PASSWORD to connect.</span>
                )}
              </div>
            </div>

            {/* Giftbit programmatic API */}
            <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 space-y-1.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase font-sans">Giftbit Enterprise</span>
                  {systemStatus?.giftbitLive ? (
                    <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-150 px-1.5 py-0.2 rounded font-mono">LIVE API</span>
                  ) : (
                    <span className="text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-150 px-1.5 py-0.2 rounded font-mono">SIMULATED</span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 mt-1 font-medium leading-normal">
                  Verifies gift card status through direct brand issuer networks.
                </p>
              </div>
              <div className="pt-1.5 border-t border-slate-100 text-[9px] font-mono font-medium text-slate-400">
                {systemStatus?.giftbitLive ? (
                  <span className="text-emerald-600 font-bold flex items-center gap-1">✔ Key loaded: GIFTBIT_API_KEY</span>
                ) : (
                  <span>Using mock checker. Add GIFTBIT_API_KEY to go live.</span>
                )}
              </div>
            </div>

            {/* Gemini Core API */}
            <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 space-y-1.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase font-sans">Gemini Pricing Engine</span>
                  {systemStatus?.geminiLive ? (
                    <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-150 px-1.5 py-0.2 rounded font-mono">LIVE API</span>
                  ) : (
                    <span className="text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-150 px-1.5 py-0.2 rounded font-mono">SIMULATED</span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 mt-1 font-medium leading-normal">
                  Generates trust rating penalties, risk estimates, and smart yield formulas.
                </p>
              </div>
              <div className="pt-1.5 border-t border-slate-100 text-[9px] font-mono font-medium text-slate-400">
                {systemStatus?.geminiLive ? (
                  <span className="text-emerald-600 font-bold flex items-center gap-1">✔ Server-side key loaded</span>
                ) : (
                  <span className="text-indigo-600 font-semibold">Active on demand. Configure in Secrets panel.</span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-3 p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-[10px] text-slate-600 font-medium flex items-start gap-2 leading-relaxed">
            <Sparkles className="w-4.5 h-4.5 text-indigo-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-800 block">How to configure credentials to disable simulation mode:</span>
              To transition any service to live mode, navigate to the <strong className="text-slate-800">Secrets (Settings) panel</strong> in the AI Studio editor interface and insert your live api keys. Your Express backend automatically registers secret key presence at runtime and transitions relevant gateways to live production processing instantaneously.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verification Queue Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="bg-white border border-slate-200 shadow-sm">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Pending Inspection</span>
              <span className="text-xl font-black text-amber-600 font-mono">{pendingCount} cards</span>
              <span className="text-[10px] text-slate-500 block font-medium">Needs gateway verification check</span>
            </div>
            <div className="p-2 bg-amber-50 rounded-lg text-amber-700">
              <AlertTriangle className="w-4.5 h-4.5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-slate-200 shadow-sm">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Verified & Clearing</span>
              <span className="text-xl font-black text-blue-600 font-mono">{verifiedCount} cards</span>
              <span className="text-[10px] text-slate-500 block font-medium">Awaiting manual release to client</span>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg text-blue-700">
              <PlayCircle className="w-4.5 h-4.5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-slate-200 shadow-sm">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Settlement Value Released</span>
              <span className="text-xl font-black text-emerald-600 font-mono">${paidOutValue.toFixed(2)}</span>
              <span className="text-[10px] text-slate-500 block font-medium">Successful payout releases</span>
            </div>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-700">
              <DollarSign className="w-4.5 h-4.5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Queue Management Area */}
      <Card className="bg-white border border-slate-200 shadow-sm">
        <CardHeader className="bg-slate-50/40 p-3 border-b border-slate-100">
          <CardTitle className="text-xs font-bold text-slate-900 uppercase tracking-wider">Active Verification Dashboard</CardTitle>
          <CardDescription className="text-[11px] text-slate-500">Click check on brand balance gateways, reveal secure details, and transition states</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {error && (
            <div className="p-4 text-center text-rose-600 text-xs font-semibold">
              <ShieldAlert className="w-4.5 h-4.5 mx-auto mb-1 text-rose-500" />
              {error}
            </div>
          )}

          {loading ? (
            <div className="p-8 text-center text-slate-500 text-xs flex flex-col items-center gap-1.5">
              <RefreshCw className="w-5 h-5 animate-spin text-indigo-600" />
              Loading admin queue data...
            </div>
          ) : cards.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs font-semibold">
              All clear! No cards submitted in verification queue.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase">Seller Profile</TableHead>
                  <TableHead className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase">Card & Value Info</TableHead>
                  <TableHead className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase">Secure Card Credentials</TableHead>
                  <TableHead className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase">Calculated Payout</TableHead>
                  <TableHead className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase">Actions Workflow</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cards.map((card) => {
                  const isRevealed = !!revealedCardIds[card.id];
                  const isLoading = actionLoadingId === card.id;
                  
                  return (
                    <TableRow key={card.id}>
                      {/* Seller Info */}
                      <TableCell className="px-3 py-2 text-xs">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-900 block truncate max-w-[150px]">
                            {card.seller?.name || "Emma Cent"}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {card.seller?.email}
                          </span>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-[10px] text-slate-500 font-semibold">Trust Score:</span>
                            <span className={`text-[10px] font-mono font-bold ${card.seller && card.seller.trustScore >= 60 ? "text-emerald-700" : "text-amber-700"}`}>
                              {card.seller?.trustScore}/100
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Card brand / Initial Bal */}
                      <TableCell className="px-3 py-2 text-xs">
                        <div>
                          <span className="font-bold text-slate-900 block">{card.brand}</span>
                          <span className="text-xs text-slate-500 font-mono font-medium">
                            Face Val: <strong className="text-slate-800">${card.initialBalance.toFixed(2)}</strong>
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                            Sub: {new Date(card.createdAt).toLocaleDateString()}
                          </span>

                          {card.balanceCheckStatus && (
                            <div className="mt-1.5 p-1.5 rounded bg-slate-50 border border-slate-200 font-mono text-[9px] text-slate-600 space-y-0.5 leading-normal max-w-[150px]">
                              <div className="flex justify-between text-[8px] uppercase font-bold">
                                <span className="text-slate-400">API Query</span>
                                <span className={card.balanceCheckStatus === 'VALID' ? "text-emerald-600" : "text-rose-600"}>
                                  {card.balanceCheckStatus}
                                </span>
                              </div>
                              <div className="truncate text-slate-500">
                                <strong className="text-slate-700">Via:</strong> {card.balanceCheckProvider}
                              </div>
                              {card.balanceCheckMessage && (
                                <div className="text-[8px] text-slate-400 truncate mt-0.5" title={card.balanceCheckMessage}>
                                  {card.balanceCheckMessage}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Sensitive Revelator Credentials */}
                      <TableCell className="px-3 py-2 text-xs">
                        <div className="space-y-1 min-w-[200px]">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-slate-700 font-mono bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                              {isRevealed ? card.cardNumber : "•••• •••• •••• " + card.cardNumber.slice(-4)}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleRevealCredentials(card.id)}
                              className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                              title={isRevealed ? "Hide Credentials" : "Reveal Credentials"}
                            >
                              {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                          
                          {card.pin && (
                            <div className="text-[10px] font-mono text-slate-400">
                              PIN: {isRevealed ? <span className="text-slate-700 bg-slate-50 px-1 py-0.5 rounded border border-slate-150">{card.pin}</span> : "••••"}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Calculated offer & status */}
                      <TableCell className="px-3 py-2 text-xs">
                        <div className="space-y-1">
                          <span className="font-mono font-black text-indigo-600 text-xs block">
                            ${card.offerAmount.toFixed(2)}
                          </span>
                          <span className="text-[10px] text-slate-500 block font-medium">
                            {card.transaction?.payoutMethod} Transfer
                          </span>
                          <span className={`inline-block text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider border
                            ${card.status === "PENDING" && "bg-amber-50 text-amber-800 border-amber-200"}
                            ${card.status === "VERIFIED" && "bg-blue-50 text-blue-800 border-blue-200"}
                            ${card.status === "PAID" && "bg-emerald-50 text-emerald-800 border-emerald-200"}
                            ${card.status === "REJECTED" && "bg-rose-50 text-rose-800 border-rose-200"}
                          `}>
                            {card.status}
                          </span>

                          {card.transaction?.gatewayTxId && (
                            <div className="mt-1.5 p-1.5 rounded bg-slate-50 border border-slate-200 font-mono text-[9px] text-slate-600 space-y-0.5 leading-normal max-w-[150px]">
                              <div className="flex justify-between text-slate-400 font-bold text-[8px] uppercase">
                                <span>Gateway Log</span>
                                <span className="text-indigo-650">Active</span>
                              </div>
                              <div className="truncate" title={card.transaction.gatewayTxId}>
                                <strong className="text-slate-700">Tx ID:</strong> {card.transaction.gatewayTxId}
                              </div>
                              {card.transaction.gatewayFee !== undefined && (
                                <div>
                                  <strong className="text-slate-700">Fee:</strong> ${card.transaction.gatewayFee.toFixed(2)}
                                </div>
                              )}
                              {card.transaction.gatewayMessage && (
                                <div className="text-[8px] text-slate-400 truncate mt-0.5" title={card.transaction.gatewayMessage}>
                                  {card.transaction.gatewayMessage}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Administrative Actions */}
                      <TableCell className="px-3 py-2 text-xs">
                        <div className="flex flex-col gap-1">
                          {card.status === "PENDING" && (
                            <div className="flex gap-1">
                              <Button
                                id={`verify-btn-${card.id}`}
                                variant="outline"
                                size="sm"
                                loading={isLoading}
                                onClick={() => handleVerifyCard(card.id)}
                                className="bg-white border-slate-200 text-blue-600 hover:text-blue-700 py-1 px-2 text-[10px]"
                              >
                                <Check className="w-3 h-3 mr-0.5" /> Gateway check
                              </Button>
                              <Button
                                id={`reject-btn-${card.id}`}
                                variant="outline"
                                size="sm"
                                loading={isLoading}
                                onClick={() => handleRejectCard(card.id)}
                                className="border-rose-200 text-rose-600 hover:bg-rose-50 py-1 px-1.5"
                              >
                                <X className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          )}

                          {card.status === "VERIFIED" && (
                            <div className="flex gap-1">
                              <Button
                                id={`pay-btn-${card.id}`}
                                variant="primary"
                                size="sm"
                                loading={isLoading}
                                onClick={() => handlePayCard(card.id)}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 py-1 px-2 text-[10px]"
                              >
                                <Check className="w-3 h-3 mr-0.5" /> Release Payout
                              </Button>
                              <Button
                                id={`reject-btn2-${card.id}`}
                                variant="outline"
                                size="sm"
                                loading={isLoading}
                                onClick={() => handleRejectCard(card.id)}
                                className="border-rose-200 text-rose-600 hover:bg-rose-50 py-1 px-1.5"
                              >
                                <X className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          )}

                          {card.status === "PAID" && (
                            <span className="text-[11px] text-emerald-700 flex items-center gap-1 font-bold">
                              <Check className="w-3.5 h-3.5 text-emerald-600" /> Settled successfully
                            </span>
                          )}

                          {card.status === "REJECTED" && (
                            <span className="text-[11px] text-rose-700 flex items-center gap-1 font-bold">
                              <X className="w-3.5 h-3.5 text-rose-600" /> Rejected / Fraud flag
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Trust Score Manager Interface */}
      <Card className="bg-white border border-slate-200 shadow-sm">
        <CardHeader className="bg-slate-50/40 p-3 border-b border-slate-100">
          <CardTitle className="text-xs font-bold text-slate-900 uppercase tracking-wider">Global Trust Standings Override</CardTitle>
          <CardDescription className="text-[11px] text-slate-500 font-medium">Adjust and override custom seller trust levels to audit pricing engine calculations</CardDescription>
        </CardHeader>
        <CardContent className="p-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {users.map((u) => (
              <div key={u.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex flex-col justify-between gap-2.5">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-900 text-xs block">{u.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono block">{u.email}</span>
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-600 font-medium">
                    <span>Current Trust:</span>
                    <span className={`font-bold font-mono px-1.5 py-0.5 rounded text-[10px] ${u.trustScore >= 60 ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>
                      {u.trustScore}/100
                    </span>
                  </div>
                </div>

                <div className="flex gap-1.5">
                  <Input
                    id={`custom-trust-${u.id}`}
                    placeholder="New (0-100)"
                    type="number"
                    min="0"
                    max="100"
                    value={customTrustScore[u.id] || ""}
                    onChange={(e) => setCustomTrustScore(prev => ({ ...prev, [u.id]: e.target.value }))}
                    className="py-1 text-xs bg-white font-mono h-8 font-bold border border-slate-200"
                  />
                  <Button
                    id={`apply-trust-${u.id}`}
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpdateTrustScore(u.id)}
                    className="text-xs h-8 px-2.5 py-1 border-slate-200 hover:bg-slate-100 font-bold"
                  >
                    Set
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Google AdSense Monetization Manager */}
      <Card id="admin-ads-manager-card" className="bg-white border border-slate-200 shadow-sm mt-4">
        <CardHeader className="bg-slate-50/40 p-3 border-b border-slate-100">
          <CardTitle className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
            <span>Google AdSense Publisher Settings</span>
          </CardTitle>
          <CardDescription className="text-[11px] text-slate-500 font-medium">
            Configure publisher client IDs, custom ad placement codes, and track dynamic simulated traffic earnings in real-time.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {adsLoading ? (
            <div className="p-8 text-center text-slate-500 text-xs flex flex-col items-center gap-1.5">
              <RefreshCw className="w-5 h-5 animate-spin text-indigo-600" />
              Loading AdSense settings and ledger metrics...
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Column 1: Config Form */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide border-b pb-1.5">Placement Codes</h4>
                
                {/* Global Enable Switch */}
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Ad Monetization Active</span>
                    <span className="text-[10px] text-slate-500 block leading-normal mt-0.5">Toggle banner display on the Seller Dashboard and trading pages.</span>
                  </div>
                  <input
                    id="ads-enabled-toggle"
                    type="checkbox"
                    checked={adsEnabled}
                    onChange={(e) => setAdsEnabled(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 border-slate-350 rounded cursor-pointer"
                  />
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label htmlFor="ads-client-input" className="text-[10px] font-bold text-slate-500 uppercase">Publisher Client ID</label>
                    <Input
                      id="ads-client-input"
                      placeholder="ca-pub-XXXXXXXXXXXXXXXX"
                      value={adsClient}
                      onChange={(e) => setAdsClient(e.target.value)}
                      className="py-1 text-xs bg-white font-mono h-8.5 font-bold border border-slate-200"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="ads-header-input" className="text-[10px] font-bold text-slate-500 uppercase">Dashboard Header Slot ID</label>
                    <Input
                      id="ads-header-input"
                      placeholder="e.g. 8390291102"
                      value={adsHeaderSlot}
                      onChange={(e) => setAdsHeaderSlot(e.target.value)}
                      className="py-1 text-xs bg-white font-mono h-8.5 font-bold border border-slate-200"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="ads-sidebar-input" className="text-[10px] font-bold text-slate-500 uppercase">Trading Sidebar Slot ID</label>
                    <Input
                      id="ads-sidebar-input"
                      placeholder="e.g. 1920391022"
                      value={adsSidebarSlot}
                      onChange={(e) => setAdsSidebarSlot(e.target.value)}
                      className="py-1 text-xs bg-white font-mono h-8.5 font-bold border border-slate-200"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="ads-native-input" className="text-[10px] font-bold text-slate-500 uppercase">Native/Feed Unit Slot ID</label>
                    <Input
                      id="ads-native-input"
                      placeholder="e.g. 4920192831"
                      value={adsNativeSlot}
                      onChange={(e) => setAdsNativeSlot(e.target.value)}
                      className="py-1 text-xs bg-white font-mono h-8.5 font-bold border border-slate-200"
                    />
                  </div>
                </div>

                <Button
                  id="save-ads-config-btn"
                  variant="primary"
                  loading={adsSaving}
                  onClick={handleSaveAdsSettings}
                  className="w-full text-xs font-bold uppercase py-2 h-9"
                >
                  Save AdSense Configuration
                </Button>
              </div>

              {/* Column 2: Dashboard Metrics & Simulator */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide border-b pb-1.5 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  <span>Real-Time Performance Metrics</span>
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center space-y-0.5">
                    <span className="text-[9px] font-bold text-slate-500 uppercase block">Total Impressions</span>
                    <span className="text-base font-black text-slate-900 font-mono block">
                      {adsSettings?.impressions?.toLocaleString() || 0}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center space-y-0.5">
                    <span className="text-[9px] font-bold text-slate-500 uppercase block">Total Click-Throughs</span>
                    <span className="text-base font-black text-slate-900 font-mono block">
                      {adsSettings?.clicks?.toLocaleString() || 0}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center space-y-0.5">
                    <span className="text-[9px] font-bold text-slate-500 uppercase block">CTR (Click Rate)</span>
                    <span className="text-base font-black text-indigo-600 font-mono block">
                      {adsSettings?.impressions 
                        ? `${(((adsSettings.clicks || 0) / adsSettings.impressions) * 100).toFixed(2)}%`
                        : "0.00%"}
                    </span>
                  </div>

                  <div className="p-3 bg-emerald-50/40 border border-emerald-150 rounded-lg text-center space-y-0.5">
                    <span className="text-[9px] font-bold text-emerald-700 uppercase block">Estimated Earnings</span>
                    <span className="text-base font-black text-emerald-600 font-mono block">
                      ${adsSettings?.estimatedEarnings?.toFixed(4) || "0.0000"}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-indigo-100 bg-indigo-50/20 space-y-3">
                  <div>
                    <h5 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Traffic Simulation Suite</span>
                    </h5>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-normal font-medium">
                      Trigger mock page-load views and user clicks to increment live statistics, test CPM rates, and record simulated financial ledger entries.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1.5">
                      <Button
                        id="simulate-imp-btn"
                        variant="outline"
                        size="sm"
                        disabled={simulating}
                        onClick={() => handleSimulateAdEvent('impression')}
                        className="w-full text-[10px] h-8 font-extrabold border-slate-200 hover:bg-white bg-slate-50/50"
                      >
                        Log +1 View
                      </Button>
                      <Button
                        id="simulate-imp-batch-btn"
                        variant="outline"
                        size="sm"
                        disabled={simulating}
                        onClick={() => handleSimulateBatch('impression', 50)}
                        className="w-full text-[10px] h-8 font-extrabold border-indigo-200 bg-indigo-50/30 text-indigo-700 hover:bg-indigo-50"
                      >
                        {simulating ? "Loading..." : "Batch +50 Views"}
                      </Button>
                    </div>

                    <div className="space-y-1.5">
                      <Button
                        id="simulate-click-btn"
                        variant="outline"
                        size="sm"
                        disabled={simulating}
                        onClick={() => handleSimulateAdEvent('click')}
                        className="w-full text-[10px] h-8 font-extrabold border-slate-200 hover:bg-white bg-slate-50/50 text-emerald-700"
                      >
                        Log +1 Click
                      </Button>
                      <Button
                        id="simulate-click-batch-btn"
                        variant="outline"
                        size="sm"
                        disabled={simulating}
                        onClick={() => handleSimulateBatch('click', 10)}
                        className="w-full text-[10px] h-8 font-extrabold border-emerald-200 bg-emerald-50/30 text-emerald-700 hover:bg-emerald-50"
                      >
                        {simulating ? "Loading..." : "Batch +10 Clicks"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
