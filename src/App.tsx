import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { api, User } from "./lib/api.ts";
import HomeDashboard from "./app/page.tsx";
import SellGiftCardPage from "./app/sell/page.tsx";
import AdminDashboard from "./app/admin/page.tsx";
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from "./lib/firebaseClient.ts";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
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
  RefreshCw,
  LogOut,
  Chrome,
  Flame,
  Terminal
} from "lucide-react";

type ViewState = "DASHBOARD" | "SELL" | "ADMIN";

export default function App() {
  const [activeView, setActiveView] = useState<ViewState>("DASHBOARD");
  const [user, setUser] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState<boolean>(true);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

  // Email and password login states
  const [authTab, setAuthTab] = useState<"LOGIN" | "REGISTER">("LOGIN");
  const [emailInput, setEmailInput] = useState<string>("");
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [nameInput, setNameInput] = useState<string>("");
  const [authError, setAuthError] = useState<string | null>(null);

  // Load session user and details
  const fetchSessionUser = async () => {
    try {
      setUserLoading(true);
      const activeUser = await api.getUser();
      setUser(activeUser);
    } catch (err) {
      console.error("Error loading session user details", err);
    } finally {
      setUserLoading(false);
    }
  };

  // Listen to Firebase Auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      setAuthLoading(false);
      
      if (fbUser) {
        await fetchSessionUser();
      } else {
        setUser(null);
        setUserLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    try {
      setUserLoading(true);
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error("Google authentication failed:", err);
      if (err.code === "auth/popup-closed-by-user") {
        setAuthError(
          "The Google sign-in window was closed or blocked. If your browser has popup blockers active within the preview frame, please use the Email & Password form below to sign in or register instantly!"
        );
      } else {
        setAuthError(err.message || "Google sign-in failed. Please try again.");
      }
    } finally {
      setUserLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!emailInput || !passwordInput) {
      setAuthError("Please fill in both email and password fields.");
      return;
    }
    try {
      setUserLoading(true);
      await signInWithEmailAndPassword(auth, emailInput.trim(), passwordInput);
    } catch (err: any) {
      console.error("Email login failed:", err);
      let friendlyMessage = err.message || "Login failed. Please check your credentials.";
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
        friendlyMessage = "Incorrect email or password. Please try again.";
      } else if (err.code === "auth/invalid-email") {
        friendlyMessage = "Please enter a valid email address.";
      }
      setAuthError(friendlyMessage);
    } finally {
      setUserLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!emailInput || !passwordInput || !nameInput) {
      setAuthError("All fields (Name, Email, Password) are required.");
      return;
    }
    if (passwordInput.length < 6) {
      setAuthError("Password must be at least 6 characters long.");
      return;
    }
    try {
      setUserLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, emailInput.trim(), passwordInput);
      if (userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: nameInput.trim()
        });
        await fetchSessionUser();
      }
    } catch (err: any) {
      console.error("Email registration failed:", err);
      let friendlyMessage = err.message || "Registration failed. Please try again.";
      if (err.code === "auth/email-already-in-use") {
        friendlyMessage = "An account with this email already exists.";
      } else if (err.code === "auth/invalid-email") {
        friendlyMessage = "Please enter a valid email address.";
      } else if (err.code === "auth/weak-password") {
        friendlyMessage = "Password is too weak. Please use at least 6 characters.";
      }
      setAuthError(friendlyMessage);
    } finally {
      setUserLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setUserLoading(true);
      await signOut(auth);
      setFirebaseUser(null);
      setUser(null);
      setActiveView("DASHBOARD");
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setUserLoading(false);
    }
  };

  const handleTradeCreated = () => {
    setActiveView("DASHBOARD");
    fetchSessionUser();
  };

  // Fully-featured loading screen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3 font-sans">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
        <div className="text-center">
          <p className="text-xs font-mono font-bold uppercase tracking-widest text-slate-500">Valuex Direct-Buy</p>
          <p className="text-[11px] text-slate-400 mt-1">Synchronizing cryptographic gateway keys...</p>
        </div>
      </div>
    );
  }

  // Login Screen if not logged in
  if (!firebaseUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-indigo-500/10 selection:text-indigo-600 font-sans">
        <div className="h-1 w-full bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700" />
        
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="w-full max-w-md bg-white border border-slate-200 shadow-xl shadow-slate-100/50 rounded-2xl p-8 relative overflow-hidden"
          >
            {/* Top decorative ring */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-indigo-500 to-violet-500" />

            <div className="mx-auto w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4 border border-indigo-100/50 shadow-inner">
              <Coins className="w-6 h-6" />
            </div>

            <div className="text-center mb-6">
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
                Valuex <span className="text-[11px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 font-extrabold border border-indigo-100/50">Direct-Buy</span>
              </h1>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1 font-mono">Gift Card Resale settlements</p>
            </div>

            {/* Render any authentication error message elegantly */}
            {authError && (
              <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-100 text-[11px] text-rose-700 flex items-start gap-2.5 leading-normal font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                <div>
                  {authError}
                </div>
              </div>
            )}

            {/* Continue with Google button */}
            <div className="space-y-4">
              <button
                onClick={handleGoogleSignIn}
                disabled={userLoading}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950 transition-all flex items-center justify-center gap-2.5 shadow-sm cursor-pointer disabled:opacity-50"
              >
                {userLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Chrome className="w-4 h-4 text-rose-500" />
                )}
                <span>Continue with Google</span>
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-150"></div>
                <span className="flex-shrink mx-4 text-[9px] font-bold uppercase tracking-widest text-slate-400 font-mono">Or use email credential</span>
                <div className="flex-grow border-t border-slate-150"></div>
              </div>

              {/* Tab Selector for Email Auth */}
              <div className="flex border-b border-slate-150 mb-4 bg-slate-50/50 rounded-lg p-1 border">
                <button
                  type="button"
                  onClick={() => { setAuthTab("LOGIN"); setAuthError(null); }}
                  className={`flex-1 py-1.5 text-center text-xs font-bold rounded-md transition-all cursor-pointer ${
                    authTab === "LOGIN"
                      ? "bg-white text-indigo-600 shadow-sm border border-slate-200/50"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthTab("REGISTER"); setAuthError(null); }}
                  className={`flex-1 py-1.5 text-center text-xs font-bold rounded-md transition-all cursor-pointer ${
                    authTab === "REGISTER"
                      ? "bg-white text-indigo-600 shadow-sm border border-slate-200/50"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  Create Account
                </button>
              </div>

              {/* Email Login/Sign-up Form */}
              <form onSubmit={authTab === "LOGIN" ? handleEmailSignIn : handleEmailSignUp} className="space-y-3.5">
                {authTab === "REGISTER" && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Your Full Name</label>
                    <input
                      type="text"
                      placeholder="Emma Cent"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none placeholder-slate-350"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Email Address</label>
                  <input
                    type="email"
                    placeholder="emma432cent@gmail.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none placeholder-slate-350"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none placeholder-slate-350"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={userLoading}
                  className="w-full py-2.5 px-4 mt-2 rounded-xl font-bold text-xs bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-indigo-100 cursor-pointer disabled:opacity-50"
                >
                  {userLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                  ) : (
                    <span>{authTab === "LOGIN" ? "Sign In with Email" : "Register & Get Started"}</span>
                  )}
                </button>
              </form>

              <p className="text-[10px] text-slate-400 text-center leading-normal pt-2 font-medium">
                🔒 Registered emails matching <span className="font-semibold text-slate-600 font-mono">emma432cent@gmail.com</span> or admin domains automatically activate admin privileges.
              </p>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-4 text-[10px] text-slate-400 font-semibold font-mono uppercase">
              <div className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Bank-grade SSL</span>
              </div>
              <div className="h-3 w-px bg-slate-200" />
              <div className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Instant Audits</span>
              </div>
            </div>
          </motion.div>
        </div>

        <footer className="py-4 text-center text-[11px] text-slate-400 bg-white border-t border-slate-200">
          <p>© 2026 Valuex Direct-Buy Gift Card Resale Platform. Bank-grade 256-bit secure encryption transfer.</p>
        </footer>
      </div>
    );
  }

  // Authenticated user view
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

          {/* Real User Display */}
          {user && (
            <div className="flex items-center gap-2.5 pl-1">
              {/* Profile Details */}
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-bold text-slate-800">{user.name}</span>
                <span className="text-[10px] text-slate-400 font-mono font-medium">{user.email}</span>
              </div>

              {/* Status and Badges */}
              <div className="flex items-center gap-1.5">
                {user.role === "ADMIN" && (
                  <span className="bg-rose-50 border border-rose-200 text-rose-700 text-[9px] font-bold font-mono px-2 py-0.5 rounded uppercase tracking-wider">
                    🛡️ ADMIN
                  </span>
                )}
                {user.membershipStatus === "PRO" && (
                  <span className="bg-amber-100 border border-amber-250 text-amber-800 text-[9px] font-bold font-mono px-2 py-0.5 rounded uppercase tracking-wider">
                    ✨ VIP PRO
                  </span>
                )}
                {user.role !== "ADMIN" && (
                  <div className={`hidden sm:flex items-center gap-1 py-0.5 px-1.5 rounded border text-[9px] font-bold font-mono uppercase tracking-wider
                    ${user.trustScore >= 60 
                      ? "bg-emerald-50 border-emerald-100 text-emerald-700" 
                      : "bg-amber-50 border-amber-100 text-amber-700"
                    }
                  `}>
                    Score: {user.trustScore}
                  </div>
                )}
              </div>

              {/* Sign Out Button */}
              <button
                onClick={handleSignOut}
                title="Sign Out"
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 cursor-pointer active:bg-slate-100 transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
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
        <p className="mt-1 font-mono text-[9px] text-slate-400 font-semibold uppercase">Real Authentication Mode Active</p>
      </footer>
    </div>
  );
}
