import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { api, User } from "./lib/api.ts";
import HomeDashboard from "./app/page.tsx";
import SellGiftCardPage from "./app/sell/page.tsx";
import AdminDashboard from "./app/admin/page.tsx";
import { 
  DollarSign, 
  Wallet, 
  Coins, 
  ShieldCheck, 
  ShieldAlert, 
  User as UserIcon, 
  Layers, 
  History,
  Settings,
  HelpCircle,
  AlertCircle,
  RefreshCw
} from "lucide-react";

type ViewState = "DASHBOARD" | "SELL" | "ADMIN";

export default function App() {
  const [activeView, setActiveView] = useState<ViewState>("DASHBOARD");
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [userLoading, setUserLoading] = useState<boolean>(true);
  const [navCollapsed, setNavCollapsed] = useState<boolean>(false);

  const fetchSessionUser = async () => {
    try {
      setUserLoading(true);
      const activeUser = await api.getUser();
      setUser(activeUser);
      
      const userList = await api.listUsers();
      setAllUsers(userList);
    } catch (err) {
      console.error("Error loading session user details", err);
    } finally {
      setUserLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionUser();
  }, []);

  const handleSwitchUser = async (userId: string) => {
    try {
      setUserLoading(true);
      const res = await api.switchUser(userId);
      setUser(res.user);
      
      // Auto routing convenience
      if (res.user.role === "ADMIN") {
        setActiveView("ADMIN");
      } else {
        setActiveView("DASHBOARD");
      }
    } catch (err) {
      console.error("Failed to swap user profile", err);
    } finally {
      setUserLoading(false);
    }
  };

  const handleTradeCreated = () => {
    // Navigate back to the dashboard to monitor the status
    setActiveView("DASHBOARD");
    fetchSessionUser();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-850 font-sans flex flex-col selection:bg-indigo-500/10 selection:text-indigo-600">
      
      {/* Upper Global Accent Bars */}
      <div className="h-1 w-full bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700" />

      {/* Main App Bar / Header */}
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-50 px-4 md:px-6 py-2.5 flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-sm shadow-indigo-200">
            <Coins className="w-4 h-4 font-bold" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-slate-900 leading-none">
              Valuex <span className="text-[10px] font-bold text-indigo-600 font-mono tracking-normal ml-0.5">DIRECT-BUY</span>
            </h1>
            <span className="text-[9px] text-slate-400 font-semibold font-mono">GIFT CARD SETTLEMENTS</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center bg-slate-100/80 border border-slate-200 p-0.5 rounded-lg">
          <button
            onClick={() => setActiveView("DASHBOARD")}
            className={`px-3 py-1 rounded-md text-xs font-semibold tracking-wide transition-all duration-150 cursor-pointer
              ${activeView === "DASHBOARD" 
                ? "bg-white text-slate-900 shadow-sm border border-slate-200/30" 
                : "text-slate-500 hover:text-slate-800"
              }
            `}
          >
            Dashboard
          </button>
          
          <button
            onClick={() => setActiveView("SELL")}
            className={`px-3 py-1 rounded-md text-xs font-semibold tracking-wide transition-all duration-150 cursor-pointer
              ${activeView === "SELL" 
                ? "bg-white text-slate-900 shadow-sm border border-slate-200/30" 
                : "text-slate-500 hover:text-slate-800"
              }
            `}
          >
            Sell Card
          </button>

          {user?.role === "ADMIN" && (
            <button
              onClick={() => setActiveView("ADMIN")}
              className={`px-3 py-1 rounded-md text-xs font-semibold tracking-wide transition-all duration-150 cursor-pointer
                ${activeView === "ADMIN" 
                  ? "bg-indigo-50 text-indigo-700 border border-indigo-100" 
                  : "text-slate-500 hover:text-slate-800"
                }
              `}
            >
              Admin Queue
            </button>
          )}
        </nav>

        {/* Profile Swap & Stats Controls */}
        <div className="flex items-center gap-2.5">
          
          {/* User Swapper (Extremely convenient audit control) */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 py-1 px-2 rounded-lg">
            <UserIcon className="w-3 h-3 text-slate-500" />
            <select
              value={user?.id || ""}
              onChange={(e) => handleSwitchUser(e.target.value)}
              className="bg-transparent text-xs text-slate-700 font-semibold focus:outline-none cursor-pointer border-none p-0 pr-5"
              disabled={userLoading}
            >
              {allUsers.map((u) => (
                <option key={u.id} value={u.id} className="bg-white text-slate-800">
                  {u.name} ({u.role === "ADMIN" ? "Admin" : `Score: ${u.trustScore}`})
                </option>
              ))}
            </select>
          </div>

          {/* Quick trust indicator header button */}
          {user && user.role !== "ADMIN" && (
            <div className="flex items-center gap-1.5">
              {user.membershipStatus === "PRO" && (
                <div className="bg-amber-100 border border-amber-250 text-amber-800 text-[9px] font-bold font-mono px-2 py-1 rounded-md uppercase tracking-wider flex items-center gap-0.5">
                  ✨ VIP PRO
                </div>
              )}
              <div className={`hidden sm:flex items-center gap-1.5 py-1 px-2 rounded-md border text-[9px] font-bold font-mono uppercase tracking-wider
                ${user.trustScore >= 60 
                  ? "bg-emerald-50 border-emerald-100 text-emerald-700" 
                  : "bg-amber-50 border-amber-100 text-amber-700"
                }
              `}>
                {user.trustScore >= 60 ? "HIGH_TRUST" : "LOW_TRUST_PENALTY"}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Mobile Sticky Navigation Panel */}
      <div className="md:hidden border-b border-slate-200 bg-white/80 p-1.5 flex justify-center gap-1.5">
        <button
          onClick={() => setActiveView("DASHBOARD")}
          className={`flex-1 py-1.5 text-center rounded-md text-xs font-semibold cursor-pointer
            ${activeView === "DASHBOARD" ? "bg-slate-100 text-slate-900 border border-slate-200/50" : "text-slate-500 hover:text-slate-800"}
          `}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActiveView("SELL")}
          className={`flex-1 py-1.5 text-center rounded-md text-xs font-semibold cursor-pointer
            ${activeView === "SELL" ? "bg-slate-100 text-slate-900 border border-slate-200/50" : "text-slate-500 hover:text-slate-800"}
          `}
        >
          Sell Card
        </button>
        {user?.role === "ADMIN" && (
          <button
            onClick={() => setActiveView("ADMIN")}
            className={`flex-1 py-1.5 text-center rounded-md text-xs font-semibold cursor-pointer
              ${activeView === "ADMIN" ? "bg-indigo-50 text-indigo-700 border border-indigo-150" : "text-slate-500 hover:text-slate-800"}
            `}
          >
            Admin Queue
          </button>
        )}
      </div>

      {/* Main Content Area Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 md:p-6">
        {userLoading ? (
          <div className="h-[60vh] w-full flex flex-col items-center justify-center gap-2.5 text-slate-500 text-xs font-mono">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
            Synchronizing secure ledger state...
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.12 }}
            >
              {activeView === "DASHBOARD" && (
                <HomeDashboard 
                  user={user} 
                  onNavigateToSell={() => setActiveView("SELL")}
                  onRefreshUser={fetchSessionUser}
                />
              )}
              {activeView === "SELL" && (
                <SellGiftCardPage 
                  user={user} 
                  onTradeCreated={handleTradeCreated} 
                />
              )}
              {activeView === "ADMIN" && (
                <AdminDashboard 
                  adminUser={user} 
                  onRefreshPlatform={fetchSessionUser}
                />
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* Footer copyright */}
      <footer className="border-t border-slate-200 py-4 text-center text-[11px] text-slate-400 bg-white">
        <p>© 2026 Valuex Direct-Buy Gift Card Resale Platform. Bank-grade 256-bit secure encryption transfer.</p>
        <p className="mt-1 font-mono text-[9px] text-slate-400">PREVIEW ENVIRONMENT LOCAL TIME: 2026-06-24T06:14:41-07:00</p>
      </footer>
    </div>
  );
}
