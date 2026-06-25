import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/Card.tsx";
import { Input } from "./ui/Input.tsx";
import { BRAND_TIERS, NICHE_BRAND_TIER, calculatePayout, ValuationResult } from "../lib/pricing.ts";
import { Flame, ShieldCheck, ShieldAlert, DollarSign, RefreshCw, Layers, Sparkles } from "lucide-react";
import { User } from "../lib/api.ts";

interface ValuationEngineProps {
  user?: User | null;
  userTrustScore?: number;
  onSelectBrand?: (brand: string, balance: number) => void;
}

export function ValuationEngine({ user, userTrustScore = 80, onSelectBrand }: ValuationEngineProps) {
  const [selectedBrand, setSelectedBrand] = useState("Amazon");
  const [customBrand, setCustomBrand] = useState("");
  const [balance, setBalance] = useState<number>(100);
  const [valuation, setValuation] = useState<ValuationResult | null>(null);

  const activeTrustScore = user?.trustScore ?? userTrustScore;
  const isPro = user?.membershipStatus === "PRO";

  // Re-calculate whenever state parameters change
  useEffect(() => {
    const brandToCalc = selectedBrand === "Other" ? (customBrand || "Niche Brand") : selectedBrand;
    const result = calculatePayout(brandToCalc, balance || 0, activeTrustScore, isPro);
    setValuation(result);
  }, [selectedBrand, customBrand, balance, activeTrustScore, isPro]);

  const handleBrandClick = (brandName: string) => {
    setSelectedBrand(brandName);
    if (onSelectBrand) {
      onSelectBrand(brandName, balance);
    }
  };

  const currentRatePercentage = valuation ? Math.round(valuation.finalRate * 100) : 0;
  const originalRatePercentage = valuation ? Math.round(valuation.baseRate * 100) : 0;

  return (
    <Card className="overflow-hidden border border-slate-200 bg-white shadow-sm">
      <CardHeader className="bg-slate-50/50 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-slate-950">Valuation Engine</CardTitle>
              <CardDescription className="text-[11px] text-slate-500">Instant Direct-Buy payout calculator</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {isPro && (
              <div className="flex items-center gap-0.5 px-2 py-0.5 bg-amber-50 rounded-md border border-amber-200 text-[10px] font-bold text-amber-700">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>VIP PRO</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 rounded-md border border-slate-200">
              {activeTrustScore >= 60 ? (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
              )}
              <span className="text-[10px] font-bold text-slate-600 font-mono">
                TRUST: <span className={activeTrustScore >= 60 ? "text-emerald-700" : "text-amber-700"}>{activeTrustScore}</span>
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {/* Brand Grid Selector */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
            Select Brand
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
            {Object.keys(BRAND_TIERS).map((brandKey) => {
              const brandConfig = BRAND_TIERS[brandKey];
              const isActive = selectedBrand === brandKey;
              return (
                <button
                  key={brandKey}
                  type="button"
                  onClick={() => handleBrandClick(brandKey)}
                  className={`flex flex-col items-center justify-center p-1.5 rounded-lg border text-center transition-all duration-150 group cursor-pointer
                    ${isActive
                      ? "bg-indigo-50/80 border-indigo-500 text-indigo-700 shadow-sm"
                      : "bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700"
                    }
                  `}
                >
                  <span className="text-xs font-bold block">{brandKey}</span>
                  <span className={`text-[9px] font-mono mt-0.5 ${isActive ? "text-indigo-600" : "text-slate-400"}`}>
                    {Math.round(brandConfig.baseRate * 100)}% base
                  </span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setSelectedBrand("Other")}
              className={`flex flex-col items-center justify-center p-1.5 rounded-lg border text-center transition-all duration-150 cursor-pointer
                ${selectedBrand === "Other"
                  ? "bg-indigo-50/80 border-indigo-500 text-indigo-700 shadow-sm"
                  : "bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700"
                }
              `}
            >
              <span className="text-xs font-bold block">Other Brand</span>
              <span className={`text-[9px] font-mono mt-0.5 ${selectedBrand === "Other" ? "text-indigo-600" : "text-slate-400"}`}>
                50% base
              </span>
            </button>
          </div>
        </div>

        {/* Dynamic Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {selectedBrand === "Other" ? (
            <Input
              id="custom-brand-input"
              label="Enter Brand Name"
              placeholder="e.g., Walmart, Sephora, Steam"
              value={customBrand}
              onChange={(e) => setCustomBrand(e.target.value)}
              className="bg-white"
            />
          ) : (
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Selected Tier Details</span>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-600">
                <span className="font-bold text-slate-800 block mb-0.5">
                  {valuation?.tier === "TIER_1" && "🔥 Tier 1 Popularity"}
                  {valuation?.tier === "TIER_2" && "💎 Tier 2 Popularity"}
                  {valuation?.tier === "TIER_3" && "📦 Tier 3 Popularity"}
                  {valuation?.tier === "NICHE" && "🧩 Niche Popularity"}
                </span>
                {getBrandDescription(valuation?.brand || "")}
              </div>
            </div>
          )}

          <Input
            id="valuation-balance-input"
            label="Gift Card Face Value ($)"
            type="number"
            min="10"
            max="2000"
            value={balance || ""}
            onChange={(e) => setBalance(Math.max(0, parseFloat(e.target.value) || 0))}
            icon={<DollarSign className="w-4 h-4 text-slate-400" />}
            className="bg-white font-mono text-sm font-bold"
          />
        </div>

        {/* Dynamic Result Panel */}
        {valuation && (
          <div className="bg-slate-50 rounded-lg border border-slate-200 p-3.5 space-y-3 relative overflow-hidden">
            {/* Background graphic effect */}
            <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-indigo-500/5 to-transparent pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Estimated Instant Offer</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-2xl font-black text-slate-900 font-mono">${valuation.offerAmount.toFixed(2)}</span>
                  <span className="text-xs text-slate-500 font-medium">cash payout</span>
                </div>
              </div>

              <div className="flex flex-col items-start sm:items-end text-left sm:text-right">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Payout Rate</span>
                <span className="text-base font-extrabold text-indigo-600 font-mono mt-0.5">{currentRatePercentage}%</span>
              </div>
            </div>

            {/* Progress Visualization */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                <span>Direct payout vs face value</span>
                <span className="font-mono">${valuation.offerAmount.toFixed(0)} of ${valuation.initialBalance.toFixed(0)}</span>
              </div>
              <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden flex">
                <div 
                  className="h-full bg-indigo-600 transition-all duration-300"
                  style={{ width: `${currentRatePercentage}%` }}
                />
                {valuation.trustPenaltyApplied && (
                  <div 
                    className="h-full bg-amber-400/50 transition-all duration-300"
                    style={{ width: `${originalRatePercentage - currentRatePercentage}%` }}
                  />
                )}
              </div>
            </div>

            {/* Alert items (trust penalty details) */}
            {isPro ? (
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 bg-amber-50/50 p-2 rounded-md border border-amber-100">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500 animate-pulse" />
                <span>VIP Pro Premium Active: penalties waived & extra +3.0% boost included</span>
              </div>
            ) : valuation.trustPenaltyApplied ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-start gap-2 p-2.5 rounded-md bg-amber-50 border border-amber-150 text-xs text-amber-800">
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-900">Trust Score Rate Penalty (-5%) Applied</span>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-amber-800/90">
                      Your trust score is {activeTrustScore} (below 60). Upgrade to <span className="font-bold text-indigo-700">VIP Pro Seller</span> to waive this penalty instantly and boost your rate!
                    </p>
                  </div>
                </div>
                <div className="p-2 rounded-md bg-indigo-50 text-[11px] text-indigo-700 font-semibold border border-indigo-100 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                  <span>VIP Pro Upsell: Upgrade to receive ${(balance * (valuation.baseRate + 0.03)).toFixed(2)} (+3% rate boost!)</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-700">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Optimal trust score rate applied (No penalty)</span>
                </div>
                <div className="p-2 rounded-md bg-indigo-50 text-[11px] text-indigo-700 font-semibold border border-indigo-100 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                  <span>VIP Pro Upsell: Upgrade to receive ${(balance * (valuation.baseRate + 0.03)).toFixed(2)} (+3% rate boost!)</span>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getBrandDescription(brandName: string): string {
  const normalized = brandName.toLowerCase();
  if (normalized.includes("amazon")) return "Instantly high liquidity. We issue near-perfect values for verified balances.";
  if (normalized.includes("target") || normalized.includes("walmart")) return "High secondary utilization. Handled with instant automated clearing.";
  if (normalized.includes("starbucks") || normalized.includes("apple") || normalized.includes("best buy")) return "Highly stable beverage and technology gift vouchers. Fast confirmation queue.";
  return "Handled with a 50% baseline. Manual balance inspection may apply upon submission.";
}
