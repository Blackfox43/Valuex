import React, { useState } from "react";
import { Button } from "./ui/Button.tsx";
import { Input } from "./ui/Input.tsx";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./ui/Card.tsx";
import { calculatePayout } from "../lib/pricing.ts";
import { Eye, EyeOff, CreditCard, ShieldCheck, DollarSign, Wallet, CheckCircle, ArrowRight, ArrowLeft } from "lucide-react";

import { User } from "../lib/api.ts";
import { Zap, Clock, Shield } from "lucide-react";

interface GiftCardFormProps {
  user?: User | null;
  userTrustScore?: number;
  onSuccess: () => void;
}

export function GiftCardForm({ user, userTrustScore = 80, onSuccess }: GiftCardFormProps) {
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Form Fields
  const [brand, setBrand] = useState<string>("Amazon");
  const [initialBalance, setInitialBalance] = useState<string>("100");
  const [cardNumber, setCardNumber] = useState<string>("");
  const [pin, setPin] = useState<string>("");
  const [payoutMethod, setPayoutMethod] = useState<'ACH' | 'PAYPAL' | 'DEBIT_CARD'>("PAYPAL");
  const [payoutDetails, setPayoutDetails] = useState<string>("");
  const [processingSpeed, setProcessingSpeed] = useState<'STANDARD' | 'FAST' | 'INSTANT'>("STANDARD");

  // PIN visibility
  const [showPin, setShowPin] = useState<boolean>(false);

  // Field validation errors
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Pricing calculation
  const isPro = user?.membershipStatus === "PRO";
  const activeTrustScore = user?.trustScore ?? userTrustScore;
  const valuation = calculatePayout(brand, parseFloat(initialBalance) || 0, activeTrustScore, isPro, processingSpeed);

  const handleNextStep = () => {
    const errors: Record<string, string> = {};

    if (step === 1) {
      const balanceNum = parseFloat(initialBalance);
      if (!brand) errors.brand = "Brand name is required";
      if (!initialBalance || isNaN(balanceNum) || balanceNum <= 0) {
        errors.initialBalance = "Please enter a valid positive balance amount";
      } else if (balanceNum < 10) {
        errors.initialBalance = "Minimum face value is $10";
      } else if (balanceNum > 2000) {
        errors.initialBalance = "Maximum trade limit is $2,000 per card";
      }
    }

    if (step === 2) {
      const cleanedCard = cardNumber.replace(/\s+/g, "");
      if (!cleanedCard) {
        errors.cardNumber = "Card number is required";
      } else if (cleanedCard.length < 8) {
        errors.cardNumber = "Card number must be at least 8 digits long";
      }
      // Brands typically require a PIN; Starbucks, Best Buy, Sephora, Target require a pin
      if (!pin && ["Starbucks", "Best Buy", "Sephora", "Target", "Apple"].includes(brand)) {
        errors.pin = `A pin number is required for ${brand} cards`;
      }
    }

    if (step === 3) {
      if (!payoutDetails) {
        errors.payoutDetails = `Please specify your ${payoutMethod === "PAYPAL" ? "PayPal Email" : payoutMethod === "ACH" ? "ACH Routing / Account Numbers" : "Debit Card details"}`;
      } else if (payoutMethod === "PAYPAL" && !payoutDetails.includes("@")) {
        errors.payoutDetails = "Please enter a valid PayPal email address";
      }
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});
    setError("");
    setStep(step + 1);
  };

  const handlePrevStep = () => {
    setValidationErrors({});
    setError("");
    setStep(step - 1);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand,
          initialBalance: parseFloat(initialBalance),
          cardNumber,
          pin,
          payoutMethod,
          payoutDetails,
          processingSpeed,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit card");
      }

      setStep(4); // Success step
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during submission");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setBrand("Amazon");
    setInitialBalance("100");
    setCardNumber("");
    setPin("");
    setPayoutMethod("PAYPAL");
    setPayoutDetails("");
    setStep(1);
    setError("");
    setValidationErrors({});
    onSuccess();
  };

  // Helper formatting for cards
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,19}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      return parts.join(" ");
    } else {
      return v;
    }
  };

  return (
    <Card className="border border-slate-200 bg-white shadow-sm overflow-hidden relative text-slate-800">
      <CardHeader className="bg-slate-50/50 relative border-b border-slate-100">
        <CardTitle className="text-sm font-bold text-slate-900">Sell Unused Gift Card</CardTitle>
        <CardDescription className="text-[11px] text-slate-500">Get paid instantly via secure direct buy settlement</CardDescription>
 
        {/* Step Indicators */}
        <div className="flex items-center gap-1.5 mt-2.5">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex-1 h-1 rounded-full overflow-hidden bg-slate-200">
              <div 
                className={`h-full transition-all duration-300 ${step >= s ? "bg-indigo-600" : "bg-transparent"}`}
              />
            </div>
          ))}
        </div>
      </CardHeader>
 
      <form onSubmit={handleFormSubmit}>
        <CardContent className="p-4 space-y-4">
          {error && (
            <div className="p-2.5 rounded-md bg-rose-50 border border-rose-150 text-xs text-rose-800 font-semibold">
              {error}
            </div>
          )}
 
          {/* STEP 1: Brand & Balance */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="card-brand-select" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Card Brand
                  </label>
                  <select
                    id="card-brand-select"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg py-2.5 px-3.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:border-indigo-500/50 focus:ring-indigo-100"
                  >
                    <option value="Amazon">Amazon (85% base)</option>
                    <option value="Target">Target (80% base)</option>
                    <option value="Walmart">Walmart (80% base)</option>
                    <option value="Best Buy">Best Buy (75% base)</option>
                    <option value="Apple">Apple (75% base)</option>
                    <option value="Starbucks">Starbucks (70% base)</option>
                    <option value="Nike">Nike (65% base)</option>
                    <option value="Sephora">Sephora (65% base)</option>
                    <option value="Home Depot">Home Depot (70% base)</option>
                    <option value="Steam">Steam (60% base)</option>
                    <option value="Other">Other Brand (50% base)</option>
                  </select>
                </div>
 
                <Input
                  id="card-balance-input"
                  label="Face Value Balance ($)"
                  type="number"
                  placeholder="Minimum 10"
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(e.target.value)}
                  error={validationErrors.initialBalance}
                  icon={<DollarSign className="w-4 h-4 text-slate-400" />}
                />
              </div>
 
              {/* Instant Quotation Preview */}
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-500">
                  <span>Calculated Offer Rate:</span>
                  <span className="text-slate-800">
                    {valuation.trustPenaltyApplied ? (
                      <span className="text-amber-700 font-mono font-bold">
                        {Math.round(valuation.finalRate * 100)}% (includes -5% penalty)
                      </span>
                    ) : (
                      <span className="text-indigo-600 font-mono font-bold">
                        {Math.round(valuation.finalRate * 100)}%
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t border-slate-200">
                  <span className="text-xs font-bold text-slate-800">Your Instant Cash Payout:</span>
                  <span className="text-xl font-black text-indigo-600 font-mono">
                    ${valuation.offerAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}
 
          {/* STEP 2: Security credentials */}
          {step === 2 && (
            <div className="space-y-4">
              <Input
                id="card-number-input"
                label="Gift Card Number"
                placeholder="4820 1928 3928 4829"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                error={validationErrors.cardNumber}
                icon={<CreditCard className="w-4 h-4 text-slate-400" />}
              />
 
              <div className="relative">
                <Input
                  id="card-pin-input"
                  label="PIN / Security Code"
                  type={showPin ? "text" : "password"}
                  placeholder="Typically 4 to 8 digits"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  error={validationErrors.pin}
                  className="pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-8.5 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
 
              <div className="p-3 bg-indigo-50/60 rounded-lg border border-indigo-150 flex items-start gap-2 text-xs text-indigo-800">
                <ShieldCheck className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                <span>
                  <strong className="text-indigo-900 font-bold">Bank-grade Secure Transmission:</strong> Card credentials are fully encrypted in transit. Balances are checked via read-only balance APIs and will never be shared.
                </span>
              </div>
            </div>
          )}
 
          {/* STEP 3: Payout method Selection */}
          {step === 3 && (
            <div className="space-y-4">
              {/* Added Processing Speed selection - MONETIZATION FEATURE */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Choose Settlement Speed
                  </label>
                  {isPro && (
                    <span className="text-[10px] bg-amber-50 border border-amber-250 text-amber-700 font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                      ✨ VIP PRO (0% Fees)
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { 
                      id: "STANDARD", 
                      label: "Standard Speed", 
                      fee: "FREE", 
                      desc: "Takes 1 business day",
                      icon: Clock,
                      color: "text-slate-500"
                    },
                    { 
                      id: "FAST", 
                      label: "Fast Priority", 
                      fee: isPro ? "FREE (VIP)" : "$1.99 Flat Fee", 
                      desc: "Verification in 1-2 hours",
                      icon: Shield,
                      color: "text-indigo-600"
                    },
                    { 
                      id: "INSTANT", 
                      label: "Instant Settle", 
                      fee: isPro ? "FREE (VIP)" : "$2.99 + 1.5%", 
                      desc: "Paid in minutes flat",
                      icon: Zap,
                      color: "text-amber-500"
                    },
                  ].map((speed) => {
                    const isSelected = processingSpeed === speed.id;
                    const Icon = speed.icon;
                    return (
                      <button
                        key={speed.id}
                        type="button"
                        onClick={() => setProcessingSpeed(speed.id as any)}
                        className={`flex flex-col text-left p-2.5 rounded-xl border transition-all duration-150 cursor-pointer relative overflow-hidden
                          ${isSelected
                            ? "bg-indigo-50/50 border-indigo-500 text-slate-900 shadow-sm"
                            : "bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-600"
                          }
                        `}
                      >
                        <div className="flex items-center gap-1.5">
                          <Icon className={`w-3.5 h-3.5 ${speed.color}`} />
                          <span className="text-xs font-bold block">{speed.label}</span>
                        </div>
                        <span className="text-[10px] font-extrabold text-indigo-600 mt-1">{speed.fee}</span>
                        <span className="text-[9px] text-slate-400 font-semibold mt-0.5 leading-tight">{speed.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Select Payout Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "PAYPAL", label: "PayPal", desc: "Instant" },
                    { id: "DEBIT_CARD", label: "Debit Card", desc: "1-2 mins" },
                    { id: "ACH", label: "Bank (ACH)", desc: "1 business day" },
                  ].map((method) => {
                    const isSelected = payoutMethod === method.id;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => {
                          setPayoutMethod(method.id as any);
                          setPayoutDetails("");
                        }}
                        className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all duration-150 cursor-pointer
                          ${isSelected
                            ? "bg-indigo-50/80 border-indigo-500 text-indigo-700"
                            : "bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-600"
                          }
                        `}
                      >
                        <span className="text-xs font-bold block">{method.label}</span>
                        <span className="text-[9px] text-slate-500 font-semibold mt-0.5">{method.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
 
              <Input
                id="payout-details-input"
                label={
                  payoutMethod === "PAYPAL" 
                    ? "PayPal Email Address" 
                    : payoutMethod === "ACH" 
                    ? "Bank Routing & Account Numbers" 
                    : "Debit Card 16-Digit Number"
                }
                placeholder={
                  payoutMethod === "PAYPAL" 
                    ? "your-paypal-email@domain.com" 
                    : payoutMethod === "ACH" 
                    ? "Routing: 021000021 / Account: 12345678" 
                    : "4000 1234 5678 9010"
                }
                value={payoutDetails}
                onChange={(e) => setPayoutDetails(e.target.value)}
                error={validationErrors.payoutDetails}
                icon={<Wallet className="w-4 h-4 text-slate-400" />}
              />
 
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Transfer Summary</span>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Card Brand & Face Value:</span>
                  <span className="font-bold text-slate-850">{brand} - ${parseFloat(initialBalance).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Gross Valuation Offer ({Math.round(valuation.finalRate * 100)}%):</span>
                  <span className="font-mono text-slate-700 font-bold">${((parseFloat(initialBalance) || 0) * valuation.finalRate).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Settlement Surcharge ({processingSpeed}):</span>
                  <span className={`font-mono font-bold ${valuation.processingFee > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                    {valuation.processingFee > 0 ? `-$${valuation.processingFee.toFixed(2)}` : "FREE"}
                  </span>
                </div>
                <div className="flex justify-between text-xs pt-1.5 border-t border-slate-200">
                  <span className="text-slate-500 font-bold">Net Cash Payout:</span>
                  <span className="font-mono text-indigo-600 font-extrabold text-sm">${valuation.offerAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[11px] pt-1.5 border-t border-dashed border-slate-200">
                  <span className="text-slate-500">Direct deposit to:</span>
                  <span className="text-slate-850 font-bold truncate max-w-[200px]">{payoutDetails || "(Pending details)"}</span>
                </div>
              </div>
            </div>
          )}
 
          {/* STEP 4: Success confirmation */}
          {step === 4 && (
            <div className="text-center py-4 space-y-3">
              <div className="inline-flex p-2 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 mb-1">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Trade Submitted Successfully!</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Your card credentials have been securely queued for automated verification. Payouts are triggered instantly as soon as credentials resolve.
              </p>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 max-w-xs mx-auto space-y-1.5 text-left text-xs text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-500">Card brand:</span>
                  <span className="font-bold text-slate-800">{brand}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Submitted Face Value:</span>
                  <span className="font-bold text-slate-800">${parseFloat(initialBalance).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Settlement Priority:</span>
                  <span className="font-bold text-slate-800">{processingSpeed}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-150">
                  <span className="text-slate-500 font-bold">Estimated Payout:</span>
                  <span className="font-mono text-indigo-600 font-bold">${valuation.offerAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
 
        <CardFooter className="bg-slate-50/50 border-t border-slate-100">
          {step < 4 ? (
            <>
              {step > 1 ? (
                <Button
                  id="sell-form-back-btn"
                  type="button"
                  variant="outline"
                  onClick={handlePrevStep}
                  disabled={loading}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
              ) : (
                <div />
              )}

              {step < 3 ? (
                <Button
                  id="sell-form-next-btn"
                  type="button"
                  variant="primary"
                  onClick={handleNextStep}
                >
                  Next <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  id="sell-form-submit-btn"
                  type="submit"
                  variant="primary"
                  loading={loading}
                >
                  Submit Trade <ShieldCheck className="w-4 h-4 ml-2" />
                </Button>
              )}
            </>
          ) : (
            <Button
              id="sell-form-reset-btn"
              type="button"
              variant="secondary"
              onClick={handleReset}
              className="w-full"
            >
              Sell Another Card
            </Button>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}
