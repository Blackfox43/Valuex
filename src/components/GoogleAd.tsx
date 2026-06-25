import React, { useState, useEffect } from "react";
import { api, AdsSettings } from "../lib/api.ts";
import { Sparkles, ExternalLink, ShieldCheck, X } from "lucide-react";

interface GoogleAdProps {
  placement: "header" | "sidebar" | "native";
  user?: any;
  onAdClicked?: () => void;
}

export function GoogleAd({ placement, user, onAdClicked }: GoogleAdProps) {
  const [settings, setSettings] = useState<AdsSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [adDismissed, setAdDismissed] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchSettings = async () => {
      try {
        const ads = await api.getAdsSettings();
        if (active) {
          setSettings(ads);
          setLoading(false);
          
          // Track an impression in the background
          if (ads.enabled && user?.membershipStatus !== "PRO") {
            api.trackAdEvent("impression").catch(err => console.warn("Error tracking impression", err));
          }
        }
      } catch (err) {
        console.error("Failed to load Google Ads settings in ad component", err);
        if (active) setLoading(false);
      }
    };

    fetchSettings();
    return () => {
      active = false;
    };
  }, [user]);

  // If user is a Pro member, they get 100% Ad-Free experience
  if (user?.membershipStatus === "PRO") {
    return null;
  }

  if (loading || adDismissed || !settings || !settings.enabled) {
    return null;
  }

  const handleAdClick = () => {
    // Register click in database to calculate simulated earnings
    api.trackAdEvent("click")
      .then(res => {
        if (res.success && res.adsSettings) {
          setSettings(res.adsSettings);
        }
      })
      .catch(err => console.warn("Error tracking click", err));

    if (onAdClicked) {
      onAdClicked();
    }
  };

  // Determine current Slot ID based on placement
  const slotId = 
    placement === "header" ? settings.headerSlot :
    placement === "sidebar" ? settings.sidebarSlot :
    settings.nativeSlot;

  // Render a real Google AdSense unit if it's a real user-defined client ID (and not the default dummy client)
  const isRealAdSense = settings.client && settings.client.startsWith("ca-pub-") && settings.client !== "ca-pub-3940259830192011";

  if (isRealAdSense) {
    // Dynamic AdSense Injection
    return (
      <div className="my-4 p-2 bg-white rounded-lg border border-slate-150 shadow-sm relative group">
        <div className="absolute -top-2 left-3 bg-slate-100 text-slate-400 text-[8px] font-bold font-mono uppercase tracking-widest px-1.5 py-0.5 rounded border border-slate-200">
          Google Sponsor Ad
        </div>
        <div className="pt-2">
          {/* We load the AdSense script dynamically if not already loaded */}
          <AdSenseScriptLoader client={settings.client} />
          
          <ins className="adsbygoogle"
               style={{ display: "block" }}
               data-ad-client={settings.client}
               data-ad-slot={slotId}
               data-ad-format="auto"
               data-full-width-responsive="true"
               onClick={handleAdClick}
          />
          <AdSenseInitializer />
        </div>
      </div>
    );
  }

  // Visual Fallback House Ads designed beautifully to fit each placement perfectly
  if (placement === "header") {
    return (
      <div 
        id="google-ad-header"
        className="relative bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 border border-indigo-950 text-white rounded-xl p-4 shadow-md overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4 my-4"
      >
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <Sparkles className="w-32 h-32 text-indigo-300" />
        </div>
        
        {/* Ad Tag */}
        <div className="absolute top-2 left-3 bg-indigo-500/20 text-indigo-300 text-[8px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded border border-indigo-500/30">
          Sponsor
        </div>

        <button 
          onClick={() => setAdDismissed(true)}
          className="absolute top-2 right-2 p-1 text-indigo-200 hover:text-white hover:bg-white/10 rounded-full transition-colors duration-150"
          title="Dismiss ad"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        <div className="pt-2 md:pt-0 space-y-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-pulse" />
            <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">VIP Member Benefits</span>
          </div>
          <h4 className="text-sm font-bold text-white tracking-tight">Tired of seeing ads? Unlock VIP Pro Status!</h4>
          <p className="text-xs text-indigo-200 max-w-xl font-medium leading-normal">
            VIP Pro sellers get a completely ad-free interface, <strong>+3.0% boost</strong> on all card payouts, and <strong>$0 platform fees</strong> on priority speeds.
          </p>
        </div>

        <div className="shrink-0">
          <button 
            onClick={handleAdClick}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] uppercase tracking-wide px-4 py-2 rounded-lg shadow-sm border-none cursor-pointer flex items-center gap-1.5 transition-all duration-150"
          >
            <span>Upgrade to VIP Pro</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }

  if (placement === "sidebar") {
    return (
      <div 
        id="google-ad-sidebar"
        className="relative bg-white border border-slate-200/90 rounded-xl p-4 shadow-sm overflow-hidden flex flex-col gap-3 my-2"
      >
        <div className="absolute top-2 left-3 bg-slate-100 text-slate-400 text-[8px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded border border-slate-200">
          Platform Sponsor
        </div>

        <button 
          onClick={() => setAdDismissed(true)}
          className="absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors duration-150"
          title="Dismiss ad"
        >
          <X className="w-3 h-3" />
        </button>

        <div className="pt-4 space-y-2">
          <div className="flex items-center gap-1.5">
            <div className="p-1 rounded bg-indigo-50 text-indigo-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="text-xs font-extrabold text-slate-800">Trust Score Optimizer</span>
          </div>
          
          <h4 className="text-xs font-bold text-slate-900 tracking-tight leading-tight">Waive trust penalty fees by completing verified trades</h4>
          <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
            Standard accounts with a Trust Score under 60 pay a minor penalty adjustment. Submit cards with valid codes to watch your trust standing climb to 100!
          </p>
          
          <button 
            onClick={handleAdClick}
            className="w-full text-center bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-extrabold text-[11px] py-1.5 rounded-lg transition-all duration-150 cursor-pointer block"
          >
            Learn How Trust Works
          </button>
        </div>
      </div>
    );
  }

  // Native ad (embedded in card listings or forms)
  return (
    <div 
      id="google-ad-native"
      className="relative bg-gradient-to-br from-indigo-50/40 via-white to-violet-50/20 border border-indigo-100 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 my-3"
    >
      <div className="absolute top-2 left-3 bg-indigo-50 text-indigo-500 text-[7px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded border border-indigo-100">
        Google Partner Ad
      </div>

      <button 
        onClick={() => setAdDismissed(true)}
        className="absolute top-2 right-2 p-1 text-slate-300 hover:text-slate-500 hover:bg-slate-50 rounded-full transition-colors duration-150"
        title="Dismiss ad"
      >
        <X className="w-3 h-3" />
      </button>

      <div className="pt-2 sm:pt-0 space-y-0.5 text-center sm:text-left">
        <h4 className="text-[12px] font-bold text-indigo-950 flex items-center justify-center sm:justify-start gap-1">
          <span>💵 Direct Settlement Boost</span>
        </h4>
        <p className="text-[11px] text-slate-500 leading-normal font-medium max-w-lg">
          Sell <strong>Apple, Steam, or Razer Gold</strong> gift cards for instant cash settlement rates up to <strong>93.0%</strong> face value today.
        </p>
      </div>

      <div className="shrink-0">
        <button 
          onClick={handleAdClick}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[10px] uppercase tracking-wide px-3.5 py-1.5 rounded-lg shadow-sm border-none cursor-pointer"
        >
          Check Brands
        </button>
      </div>
    </div>
  );
}

// Sub-component to ensure AdSense script is injected only once in document head
function AdSenseScriptLoader({ client }: { client: string }) {
  useEffect(() => {
    const scriptId = "google-adsense-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.async = true;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`;
      script.crossOrigin = "anonymous";
      document.head.appendChild(script);
    }
  }, [client]);

  return null;
}

// Sub-component to trigger AdSense load safely inside React loop
function AdSenseInitializer() {
  useEffect(() => {
    try {
      const g = (window as any).adsbygoogle || [];
      g.push({});
    } catch (err) {
      // Catch "All Inserts Must Be Initialized" error typical in fast-rebuild or preview
      console.warn("AdSense initialization warning", err);
    }
  }, []);

  return null;
}
