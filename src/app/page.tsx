import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/Card.tsx";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../components/ui/Table.tsx";
import { Button } from "../components/ui/Button.tsx";
import { api, User, GiftCard } from "../lib/api.ts";
import { GoogleAd } from "../components/GoogleAd.tsx";
import { 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  ArrowUpRight, 
  ShieldCheck, 
  ShieldAlert,
  CreditCard,
  UserCheck,
  RefreshCw,
  RefreshCcw,
  Sparkles
} from "lucide-react";

interface HomeDashboardProps {
  user: User | null;
  onNavigateToSell?: () => void;
  onRefreshUser?: () => void;
}

export default function HomeDashboard({ user, onNavigateToSell, onRefreshUser }: HomeDashboardProps) {
  const [cards, setCards] = useState<GiftCard[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [upgrading, setUpgrading] = useState<boolean>(false);

  const handleUpgradeToPro = async () => {
    setUpgrading(true);
    try {
      await api.upgradeToPro();
      if (onRefreshUser) {
        onRefreshUser();
      }
    } catch (err: any) {
      alert(err.message || "Failed to upgrade subscription");
    } finally {
      setUpgrading(false);
    }
  };

  const loadDashboardData = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.getCards();
      setCards(data);
    } catch (err: any) {
      setError("Failed to load dashboard trades. Make sure backend is running.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  // Calculations based on loaded gift cards
  const totalSubmittedValue = cards.reduce((acc, c) => acc + c.initialBalance, 0);
  const totalEarnedPayout = cards
    .filter(c => c.status === "PAID")
    .reduce((acc, c) => acc + c.offerAmount, 0);
  const pendingValue = cards
    .filter(c => c.status === "PENDING" || c.status === "VERIFIED")
    .reduce((acc, c) => acc + c.offerAmount, 0);

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: "bg-amber-50 border-amber-200 text-amber-800",
      VERIFIED: "bg-blue-50 border-blue-200 text-blue-800",
      PAID: "bg-emerald-50 border-emerald-200 text-emerald-800",
      REJECTED: "bg-rose-50 border-rose-200 text-rose-800"
    };

    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${styles[status as keyof typeof styles] || "bg-slate-100"}`}>
        {status}
      </span>
    );
  };

  const getPayoutMethodLabel = (method: string) => {
    if (method === "PAYPAL") return "PayPal";
    if (method === "DEBIT_CARD") return "Debit Card";
    if (method === "ACH") return "Bank (ACH)";
    return method;
  };

  return (
    <div className="space-y-4">
      {/* Upper overview section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
            Welcome back, <span className="text-indigo-600">{user?.name || "Emma Cent"}</span>
          </h2>
          <p className="text-xs text-slate-500">Manage your active trades and monitor settlement records.</p>
        </div>

        <div className="flex gap-1.5">
          <Button
            id="refresh-dash-btn"
            variant="outline"
            size="sm"
            onClick={() => {
              loadDashboardData();
              if (onRefreshUser) onRefreshUser();
            }}
            disabled={loading}
            className="py-1 px-2.5 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>

          {onNavigateToSell && (
            <Button
              id="sell-card-nav-btn"
              variant="primary"
              size="sm"
              onClick={onNavigateToSell}
              className="py-1 px-3 text-xs"
            >
              Sell Gift Card <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Trust Score Banner */}
      {user && (
        <div className="space-y-4">
          <div className={`p-3 rounded-lg border flex flex-col md:flex-row md:items-center justify-between gap-3 
            ${user.trustScore >= 60 
              ? "bg-white border-slate-200 shadow-sm" 
              : "bg-amber-50 border-amber-200"
            }
          `}>
            <div className="flex items-start md:items-center gap-3">
              <div className={`p-2 rounded-lg shrink-0 ${user.trustScore >= 60 ? "bg-indigo-50 text-indigo-600" : "bg-amber-50 text-amber-700"}`}>
                {user.trustScore >= 60 ? (
                  <ShieldCheck className="w-5 h-5" />
                ) : (
                  <ShieldAlert className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-slate-800">Your Seller Trust Standing:</span>
                  <span className={`font-mono font-black text-sm ${user.trustScore >= 60 ? "text-indigo-600" : "text-amber-700"}`}>
                    {user.trustScore}/100
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed max-w-xl font-medium">
                  {user.trustScore >= 60 
                    ? "Your standing is excellent. You are receiving maximum tier valuation multipliers on all trades."
                    : "Your rating is below optimal. A minor 5% adjustment has been applied to payouts. Submit cards with verified funds to increase score."
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold font-mono bg-slate-50 px-2.5 py-1 rounded border border-slate-200 self-start md:self-auto">
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>VERIFIED SELLER</span>
            </div>
          </div>

          {/* MONETIZATION: Premium Upgrade Subscription banner */}
          {user.membershipStatus === "PRO" ? (
            <Card className="bg-gradient-to-br from-emerald-950 via-teal-900 to-emerald-900 border-none text-white shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <Sparkles className="w-48 h-48 text-emerald-200" />
              </div>
              <CardContent className="p-5 md:p-6 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-400 text-slate-950 border border-amber-300 text-[10px] font-bold tracking-wider uppercase">
                      <Sparkles className="w-3 h-3 fill-slate-950" /> ✨ Active VIP Pro Seller
                    </div>
                    <h3 className="text-lg font-extrabold tracking-tight text-white">Your VIP Pro Status is Active!</h3>
                    <p className="text-xs text-emerald-200/90 max-w-2xl leading-relaxed">
                      You are earning an extra 3.0% valuation bonus, your low-trust standing penalties are completely waived, and you pay $0.00 on priority settlement speed options!
                    </p>
                  </div>
                  <div className="shrink-0 text-left">
                    <span className="text-[10px] text-emerald-300 font-bold font-mono uppercase tracking-wider block">Membership Valid Until</span>
                    <span className="text-xs text-white font-mono font-bold block mt-0.5">
                      {user.membershipExpiresAt ? new Date(user.membershipExpiresAt).toLocaleDateString() : "Next Month"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-3 border-t border-white/10 text-xs">
                  <div className="flex gap-2 items-start text-emerald-100">
                    <span className="text-amber-300 font-bold">✓</span>
                    <span><strong>+3% Payout Boost:</strong> Active and applied to calculations.</span>
                  </div>
                  <div className="flex gap-2 items-start text-emerald-100">
                    <span className="text-amber-300 font-bold">✓</span>
                    <span><strong>No Trust Penalties:</strong> Waived on your account.</span>
                  </div>
                  <div className="flex gap-2 items-start text-emerald-100 font-bold text-amber-300">
                    <span className="text-amber-300 font-bold">✓</span>
                    <span><strong>0% Processing Fees:</strong> Standard, Fast, and Instant speed surcharges are fully waived!</span>
                  </div>
                  <div className="flex gap-2 items-start text-emerald-100">
                    <span className="text-amber-300 font-bold">✓</span>
                    <span><strong>Priority API Verification:</strong> Enabled on balance checker queue.</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-gradient-to-br from-indigo-900 via-violet-950 to-indigo-950 border-none text-white shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <Sparkles className="w-48 h-48 text-indigo-200" />
              </div>
              <CardContent className="p-5 md:p-6 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold tracking-wider uppercase">
                      <Sparkles className="w-3 h-3 text-amber-300" /> VIP Pro Seller Tier
                    </div>
                    <h3 className="text-lg font-extrabold tracking-tight text-white">Boost Payout Rates & Waive Surcharges</h3>
                    <p className="text-xs text-indigo-200/90 max-w-2xl leading-relaxed">
                      Upgrade to the VIP Pro Seller plan to unlock maximum profitability. Get +3.0% rate boosts on all gift card brands, wave low-trust penalties entirely, and pay $0.00 in platform processing fees for Fast & Instant speeds.
                    </p>
                  </div>
                  <div className="shrink-0">
                    <Button
                      id="upgrade-pro-btn"
                      variant="primary"
                      onClick={handleUpgradeToPro}
                      loading={upgrading}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs py-2 px-4 shadow-md border-none cursor-pointer"
                    >
                      Upgrade for $14.99/mo
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-3 border-t border-white/10 text-xs">
                  <div className="flex gap-2 items-start text-indigo-100">
                    <span className="text-amber-400 font-bold">✓</span>
                    <span><strong>+3% Payout Rates:</strong> Earn more money on every card balance sold.</span>
                  </div>
                  <div className="flex gap-2 items-start text-indigo-100">
                    <span className="text-amber-400 font-bold">✓</span>
                    <span><strong>No Trust Penalties:</strong> Always receive full optimal direct buy rates.</span>
                  </div>
                  <div className="flex gap-2 items-start text-indigo-100">
                    <span className="text-amber-400 font-bold">✓</span>
                    <span><strong>0% Processing Fees:</strong> Standard, Fast, or Instant transfers are 100% free.</span>
                  </div>
                  <div className="flex gap-2 items-start text-indigo-100">
                    <span className="text-amber-400 font-bold">✓</span>
                    <span><strong>VIP Priority Clearance:</strong> Automated read-only APIs fast-track your verification.</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Google AdSense Header Banner - Waived for VIP Pro Sellers */}
      <GoogleAd placement="header" user={user} />

      {/* Grid statistics boxes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="bg-white border border-slate-200 shadow-sm">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Trades Submitted</span>
              <span className="text-xl font-black text-slate-900 font-mono">{cards.length}</span>
              <span className="text-[10px] text-slate-500 block font-medium">Combined face value: ${totalSubmittedValue.toFixed(2)}</span>
            </div>
            <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
              <CreditCard className="w-4.5 h-4.5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-slate-200 shadow-sm">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Paid Out</span>
              <span className="text-xl font-black text-emerald-600 font-mono">${totalEarnedPayout.toFixed(2)}</span>
              <span className="text-[10px] text-slate-500 block font-medium">Transferred instantly</span>
            </div>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-700">
              <TrendingUp className="w-4.5 h-4.5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-slate-200 shadow-sm">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Pending Settlement</span>
              <span className="text-xl font-black text-amber-600 font-mono">${pendingValue.toFixed(2)}</span>
              <span className="text-[10px] text-slate-500 block font-medium">Awaiting automated verify</span>
            </div>
            <div className="p-2 bg-amber-50 rounded-lg text-amber-700">
              <Clock className="w-4.5 h-4.5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Table */}
      <Card className="bg-white border border-slate-200 shadow-sm">
        <CardHeader className="bg-slate-50/40 p-3 border-b border-slate-100">
          <CardTitle className="text-xs font-bold text-slate-900 uppercase tracking-wider">Trade & Settlement History</CardTitle>
          <CardDescription className="text-[11px] text-slate-500">Direct-buy valuation submissions and instant payout status logs</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {error && (
            <div className="p-4 text-center text-rose-600 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 mx-auto mb-1.5 text-rose-500" />
              {error}
            </div>
          )}

          {loading ? (
            <div className="p-8 text-center text-slate-500 text-xs flex flex-col items-center gap-1.5">
              <RefreshCw className="w-5 h-5 animate-spin text-indigo-600" />
              Loading history queue...
            </div>
          ) : cards.length === 0 ? (
            <div className="p-8 text-center space-y-2.5">
              <div className="p-2 bg-slate-50 rounded-full border border-slate-250 inline-block text-slate-400">
                <CreditCard className="w-5 h-5" />
              </div>
              <p className="text-xs text-slate-500 max-w-xs mx-auto font-medium">No gift card trades found. Submit your first gift card to begin trading!</p>
              {onNavigateToSell && (
                <Button id="no-trades-sell-btn" variant="outline" size="sm" onClick={onNavigateToSell} className="text-xs py-1 px-2.5">
                  Sell Gift Card Now
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase">Brand & Date</TableHead>
                  <TableHead className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase">Face Value</TableHead>
                  <TableHead className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase">Payout Offer</TableHead>
                  <TableHead className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase">Payout Method</TableHead>
                  <TableHead className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase">Settlement Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cards.map((card) => (
                  <TableRow key={card.id}>
                    <TableCell className="px-3 py-2 text-xs">
                      <div>
                        <span className="font-bold text-slate-900 block">{card.brand}</span>
                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                          {new Date(card.createdAt).toLocaleDateString()} @ {new Date(card.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-2 text-xs font-mono text-slate-600 font-bold">
                      ${card.initialBalance.toFixed(2)}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-xs">
                      <div className="font-mono text-indigo-600 font-black text-sm">
                        ${card.offerAmount.toFixed(2)}
                      </div>
                      {card.processingSpeed && (
                        <div className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5 flex items-center gap-1">
                          <span>{card.processingSpeed}</span>
                          <span>•</span>
                          <span className={card.platformFee && card.platformFee > 0 ? "text-rose-500 font-bold" : "text-emerald-600 font-bold font-mono"}>
                            {card.platformFee && card.platformFee > 0 ? `$${card.platformFee.toFixed(2)} Fee` : "No Fee"}
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-xs">
                      <div className="space-y-1">
                        <div>
                          <span className="text-[11px] text-slate-700 font-semibold block">
                            {getPayoutMethodLabel(card.transaction?.payoutMethod || "")}
                          </span>
                          <span className="text-[10px] text-slate-400 truncate max-w-[120px] block font-mono">
                            {card.transaction?.payoutDetails}
                          </span>
                        </div>

                        {card.transaction?.gatewayTxId && (
                          <div className="p-1 rounded bg-slate-50 border border-slate-200 font-mono text-[9px] text-slate-500 max-w-[150px] space-y-0.5 leading-normal">
                            <span className="block font-bold text-slate-700">Gateway Receipt:</span>
                            <span className="block truncate text-indigo-600 font-bold" title={card.transaction.gatewayTxId}>
                              {card.transaction.gatewayTxId}
                            </span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-2 text-xs">
                      {getStatusBadge(card.status)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Google AdSense Native Partner Ads - Waived for VIP Pro Sellers */}
      <GoogleAd placement="native" user={user} />
    </div>
  );
}
