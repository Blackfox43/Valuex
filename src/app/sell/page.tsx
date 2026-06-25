import React from "react";
import { GiftCardForm } from "../../components/GiftCardForm.tsx";
import { ValuationEngine } from "../../components/ValuationEngine.tsx";
import { GoogleAd } from "../../components/GoogleAd.tsx";
import { User } from "../../lib/api.ts";
import { HelpCircle, RefreshCw, AlertCircle } from "lucide-react";

interface SellPageProps {
  user: User | null;
  onTradeCreated: () => void;
}

export default function SellGiftCardPage({ user, onTradeCreated }: SellPageProps) {
  return (
    <div className="space-y-4 text-slate-800">
      {/* Page Title */}
      <div>
        <h2 className="text-lg font-bold tracking-tight text-slate-900">Sell Gift Card</h2>
        <p className="text-xs text-slate-500">Calculate rates dynamically and trade unused balances for instant cash settlements.</p>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left column: Step Form (takes up 7/12 grid spaces) */}
        <div className="lg:col-span-7 space-y-4">
          <GiftCardForm 
            user={user} 
            onSuccess={onTradeCreated} 
          />
        </div>

        {/* Right column: Interactive Valuation Engine (takes up 5/12 grid spaces) */}
        <div className="lg:col-span-5 space-y-4">
          <ValuationEngine 
            user={user} 
          />

          {/* Guidelines Block */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm space-y-2.5">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
              <HelpCircle className="w-4 h-4 text-indigo-600" />
              <span>How Instant Trading Works</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-600 font-medium">
              <li className="flex gap-2 leading-relaxed">
                <span className="text-indigo-600 font-bold font-mono">1.</span>
                <span>Choose your gift card brand and specify your face value. The valuation engine automatically calculates your instant buyout offer.</span>
              </li>
              <li className="flex gap-2 leading-relaxed">
                <span className="text-indigo-600 font-bold font-mono">2.</span>
                <span>Submit the card number and optional PIN. Credentials are fully encrypted and transmitted directly to verification agents.</span>
              </li>
              <li className="flex gap-2 leading-relaxed">
                <span className="text-indigo-600 font-bold font-mono">3.</span>
                <span>Our automated gateway confirms the balance, and triggers a payout instantly using your preferred method (PayPal or Bank ACH).</span>
              </li>
            </ul>
          </div>

          {/* Google AdSense Sidebar Placement - Waived for VIP Pro Sellers */}
          <GoogleAd placement="sidebar" user={user} />
        </div>
      </div>
    </div>
  );
}
