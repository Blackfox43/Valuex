/**
 * Frontend API client to query the Express full-stack backend
 */

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
  trustScore: number;
  createdAt: string;
  membershipStatus?: 'STANDARD' | 'PRO';
  membershipExpiresAt?: string;
}

export interface GiftCard {
  id: string;
  sellerId: string;
  brand: string;
  initialBalance: number;
  offerAmount: number;
  cardNumber: string;
  pin?: string;
  status: 'PENDING' | 'VERIFIED' | 'PAID' | 'REJECTED';
  createdAt: string;
  balanceCheckedAt?: string;
  balanceCheckStatus?: 'VALID' | 'INVALID_CARD' | 'ZERO_BALANCE' | 'INSUFFICIENT_DATA' | 'API_ERROR';
  balanceCheckProvider?: 'CARDCASH' | 'GIFTBIT' | 'SIMULATED_GATEWAY';
  balanceCheckMessage?: string;
  processingSpeed?: 'STANDARD' | 'FAST' | 'INSTANT';
  platformFee?: number;
  seller?: {
    id: string;
    email: string;
    name: string;
    trustScore: number;
  } | null;
  transaction?: {
    id: string;
    payoutMethod: string;
    payoutDetails: string;
    status: string;
    completedAt?: string;
    createdAt: string;
    gatewayTxId?: string;
    gatewayMessage?: string;
    gatewayFee?: number;
  } | null;
}

export interface ValuationResult {
  brand: string;
  initialBalance: number;
  baseRate: number;
  finalRate: number;
  trustScore: number;
  trustPenaltyApplied: boolean;
  offerAmount: number;
  tier: string;
}

export interface AdsSettings {
  enabled: boolean;
  client: string;
  headerSlot: string;
  sidebarSlot: string;
  nativeSlot: string;
  impressions: number;
  clicks: number;
  estimatedEarnings: number;
}

export const api = {
  // Get currently logged-in user
  async getUser(): Promise<User> {
    const res = await fetch("/api/user");
    if (!res.ok) throw new Error("Failed to load user profile");
    return res.json();
  },

  // Switch active user
  async switchUser(userId: string): Promise<{ success: boolean; user: User }> {
    const res = await fetch("/api/user/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) throw new Error("Failed to switch user");
    return res.json();
  },

  // List all users
  async listUsers(): Promise<User[]> {
    const res = await fetch("/api/users");
    if (!res.ok) throw new Error("Failed to load users");
    return res.json();
  },

  // Get dynamic pricing valuation
  async getValuation(brand: string, balance: number, userId?: string): Promise<ValuationResult> {
    const params = new URLSearchParams({ brand, balance: balance.toString() });
    if (userId) params.append("userId", userId);
    
    const res = await fetch(`/api/pricing/evaluate?${params.toString()}`);
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Failed to calculate valuation");
    }
    return res.json();
  },

  // Get all cards (visible according to permissions)
  async getCards(): Promise<GiftCard[]> {
    const res = await fetch("/api/cards");
    if (!res.ok) throw new Error("Failed to retrieve gift cards");
    return res.json();
  },

  // Submit new gift card with seller parameters
  async submitCard(data: {
    brand: string;
    initialBalance: number;
    cardNumber: string;
    pin?: string;
    payoutMethod: 'ACH' | 'PAYPAL' | 'DEBIT_CARD';
    payoutDetails: string;
  }): Promise<{ card: GiftCard; transaction: any; valuation: ValuationResult }> {
    const res = await fetch("/api/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Failed to submit gift card");
    }
    return res.json();
  },

  // Verify a gift card balance (Admin only)
  async verifyCard(id: string): Promise<{ success: boolean; card: GiftCard }> {
    const res = await fetch(`/api/cards/${id}/verify`, { method: "POST" });
    if (!res.ok) throw new Error("Verification failed or permission denied");
    return res.json();
  },

  // Trigger payout for a gift card (Admin only)
  async triggerPayout(id: string): Promise<{ success: boolean; card: GiftCard; transaction: any }> {
    const res = await fetch(`/api/cards/${id}/pay`, { method: "POST" });
    if (!res.ok) throw new Error("Payout action failed or permission denied");
    return res.json();
  },

  // Reject a gift card (Admin only)
  async rejectCard(id: string): Promise<{ success: boolean; card: GiftCard }> {
    const res = await fetch(`/api/cards/${id}/reject`, { method: "POST" });
    if (!res.ok) throw new Error("Card rejection failed or permission denied");
    return res.json();
  },

  // Set trust score for a user (Admin only)
  async updateUserTrustScore(userId: string, trustScore: number): Promise<{ success: boolean; user: User }> {
    const res = await fetch(`/api/user/${userId}/trust-score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trustScore }),
    });
    if (!res.ok) throw new Error("Failed to update user trust score");
    return res.json();
  },

  // Upgrade the currently logged-in user to VIP Pro (Monetization feature)
  async upgradeToPro(): Promise<{ success: boolean; user: User }> {
    const res = await fetch("/api/user/upgrade-pro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error("Failed to upgrade subscription to VIP Pro");
    return res.json();
  },

  // Get active Google AdSense settings
  async getAdsSettings(): Promise<AdsSettings> {
    const res = await fetch("/api/ads");
    if (!res.ok) throw new Error("Failed to load Google AdSense settings");
    return res.json();
  },

  // Update Google AdSense settings (Admin only)
  async updateAdsSettings(updates: Partial<AdsSettings>): Promise<{ success: boolean; adsSettings: AdsSettings }> {
    const res = await fetch("/api/ads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error("Failed to update Google AdSense settings");
    return res.json();
  },

  // Track ad impression or click event and update estimated revenue
  async trackAdEvent(type: 'impression' | 'click'): Promise<{ success: boolean; adsSettings: AdsSettings; revenueEarned: number }> {
    const res = await fetch("/api/ads/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    });
    if (!res.ok) throw new Error("Failed to register Google Ads event");
    return res.json();
  },

  // Reset database state to defaults
  async resetState(): Promise<{ success: boolean; message: string }> {
    const res = await fetch("/api/reset", { method: "POST" });
    if (!res.ok) throw new Error("Failed to reset application state");
    return res.json();
  }
};
