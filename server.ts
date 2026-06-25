import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { db } from "./src/lib/db.js";
import { calculatePayout } from "./src/lib/pricing.js";
import { processPayoutGateway } from "./src/lib/gateway.js";
import { checkGiftCardBalance } from "./src/lib/balanceChecker.js";

// Make sure process.env contains needed defaults
process.env.NODE_ENV = process.env.NODE_ENV || "development";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parser middleware
  app.use(express.json());

  // Current session state (simulated session)
  // Default logged in user is Emma Cent (emma432cent@gmail.com)
  let currentUserId = "usr-default-1";

  // --- API ROUTES ---

  // Get active session user
  app.get("/api/user", async (req, res) => {
    try {
      const user = await db.getUserById(currentUserId);
      if (!user) {
        return res.status(404).json({ error: "Active user session not found" });
      }
      res.json(user);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Switch session user (useful for testing admin vs user views)
  app.post("/api/user/switch", async (req, res) => {
    try {
      const { userId } = req.body;
      const user = await db.getUserById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      currentUserId = userId;
      res.json({ success: true, user });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get list of all users
  app.get("/api/users", async (req, res) => {
    try {
      const users = await db.getUsers();
      res.json(users);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Upgrade user to Pro (Monetization sub)
  app.post("/api/user/upgrade-pro", async (req, res) => {
    try {
      const user = await db.getUserById(currentUserId);
      if (!user) {
        return res.status(404).json({ error: "User session not found" });
      }
      // Set to PRO valid for 30 days
      const thirtyDaysFromNow = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();
      const updatedUser = await db.updateUserMembership(user.id, "PRO", thirtyDaysFromNow);
      res.json({ success: true, user: updatedUser });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get active Google AdSense settings
  app.get("/api/ads", async (req, res) => {
    try {
      const adsSettings = await db.getAdsSettings();
      res.json(adsSettings);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update Google AdSense settings (Admin only)
  app.post("/api/ads", async (req, res) => {
    try {
      const activeUser = await db.getUserById(currentUserId);
      if (!activeUser || activeUser.role !== "ADMIN") {
        return res.status(403).json({ error: "Access denied. Admin role required." });
      }
      const { enabled, client, headerSlot, sidebarSlot, nativeSlot, impressions, clicks, estimatedEarnings } = req.body;
      const updates: any = {};
      if (enabled !== undefined) updates.enabled = !!enabled;
      if (client !== undefined) updates.client = String(client);
      if (headerSlot !== undefined) updates.headerSlot = String(headerSlot);
      if (sidebarSlot !== undefined) updates.sidebarSlot = String(sidebarSlot);
      if (nativeSlot !== undefined) updates.nativeSlot = String(nativeSlot);
      if (impressions !== undefined) updates.impressions = Number(impressions);
      if (clicks !== undefined) updates.clicks = Number(clicks);
      if (estimatedEarnings !== undefined) updates.estimatedEarnings = Number(estimatedEarnings);

      const updated = await db.updateAdsSettings(updates);
      res.json({ success: true, adsSettings: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Increment ad impression / clicks metrics and accumulate revenue
  app.post("/api/ads/event", async (req, res) => {
    try {
      const { type } = req.body; // 'impression' or 'click'
      if (type !== "impression" && type !== "click") {
        return res.status(400).json({ error: "Invalid ad event type" });
      }
      
      // Simulate small dynamic ad revenue:
      // impressions generate ~ $0.0015 RPM each ($1.50 per 1000)
      // clicks generate ~ $0.15 to $0.45 per click
      let revenue = 0.00;
      if (type === "impression") {
        revenue = 0.0015;
      } else if (type === "click") {
        revenue = parseFloat((0.15 + Math.random() * 0.30).toFixed(4));
      }

      const updated = await db.incrementAdsMetrics(type, revenue);
      res.json({ success: true, adsSettings: updated, revenueEarned: revenue });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get pricing valuation dynamic check
  app.get("/api/pricing/evaluate", async (req, res) => {
    try {
      const brand = req.query.brand as string;
      const balanceStr = req.query.balance as string;
      const userId = (req.query.userId as string) || currentUserId;
      const processingSpeed = (req.query.processingSpeed as any) || "STANDARD";

      if (!brand || !balanceStr) {
        return res.status(400).json({ error: "Brand and balance query parameters are required" });
      }

      const balance = parseFloat(balanceStr);
      if (isNaN(balance) || balance <= 0) {
        return res.status(400).json({ error: "Balance must be a positive number" });
      }

      const user = (await db.getUserById(userId)) || { trustScore: 80, membershipStatus: "STANDARD" };
      const isPro = user.membershipStatus === "PRO";
      const valuation = calculatePayout(brand, balance, user.trustScore, isPro, processingSpeed);
      res.json(valuation);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get all cards (Admins see everything, regular users see their own)
  app.get("/api/cards", async (req, res) => {
    try {
      const user = await db.getUserById(currentUserId);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const cards = await db.getGiftCards();
      const transactions = await db.getTransactions();
      const users = await db.getUsers();

      // Map and join
      const enrichedCards = cards.map(card => {
        const seller = users.find(u => u.id === card.sellerId);
        const transaction = transactions.find(t => t.giftCardId === card.id);
        return {
          ...card,
          seller: seller ? { id: seller.id, email: seller.email, name: seller.name, trustScore: seller.trustScore } : null,
          transaction
        };
      });

      if (user.role === "ADMIN") {
        res.json(enrichedCards);
      } else {
        // Filter for current seller
        res.json(enrichedCards.filter(c => c.sellerId === currentUserId));
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Submit a new gift card
  app.post("/api/cards", async (req, res) => {
    try {
      const { brand, initialBalance, cardNumber, pin, payoutMethod, payoutDetails, processingSpeed = "STANDARD" } = req.body;

      if (!brand || !initialBalance || !cardNumber || !payoutMethod || !payoutDetails) {
        return res.status(400).json({ error: "Missing required gift card fields or payment details" });
      }

      const balance = parseFloat(initialBalance);
      if (isNaN(balance) || balance <= 0) {
        return res.status(400).json({ error: "Initial balance must be a valid positive number" });
      }

      // Standard structural validation for card numbers: basic length checks
      const cleanedCardNumber = cardNumber.replace(/\s+/g, '');
      if (cleanedCardNumber.length < 8) {
        return res.status(400).json({ error: "Card number must be at least 8 digits long" });
      }

      const user = await db.getUserById(currentUserId);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const isPro = user.membershipStatus === "PRO";
      // Dynamic offer evaluation using pricing algorithm
      const valuation = calculatePayout(brand, balance, user.trustScore, isPro, processingSpeed as any);

      // Save Gift Card
      const newCard = await db.createGiftCard({
        sellerId: user.id,
        brand: valuation.brand,
        initialBalance: balance,
        offerAmount: valuation.offerAmount,
        cardNumber: cleanedCardNumber,
        pin: pin || "",
        status: "PENDING",
        processingSpeed: processingSpeed as any,
        platformFee: valuation.processingFee
      });

      // Create corresponding transaction
      const newTx = await db.createTransaction({
        giftCardId: newCard.id,
        payoutMethod,
        payoutDetails,
        status: "PENDING"
      });

      res.status(201).json({
        card: newCard,
        transaction: newTx,
        valuation
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Verify gift card balance (Admin Only) - Programmatic Balance Checker Integration
  app.post("/api/cards/:id/verify", async (req, res) => {
    try {
      const user = await db.getUserById(currentUserId);
      if (!user || user.role !== "ADMIN") {
        return res.status(403).json({ error: "Forbidden: Admin access required" });
      }

      const cardId = req.params.id;
      const card = await db.getGiftCardById(cardId);
      if (!card) {
        return res.status(404).json({ error: "Gift card not found" });
      }

      // Query Third-Party Programmatic Balance Verification Service (CardCash / Giftbit / Simulator)
      const checkRes = await checkGiftCardBalance(card.brand, card.cardNumber, card.pin);

      let updatedCard;
      if (checkRes.success) {
        // Record balance verification logs & transition gift card to VERIFIED
        await db.updateGiftCardBalanceCheck(
          cardId,
          checkRes.checkedAt,
          checkRes.status,
          checkRes.provider,
          checkRes.message
        );
        updatedCard = await db.updateGiftCardStatus(cardId, "VERIFIED");
        
        const tx = await db.getTransactionByGiftCardId(cardId);
        if (tx) {
          await db.updateTransactionStatus(tx.id, "PROCESSING");
        }
      } else {
        // Record failure logs & transition to REJECTED automatically (e.g. invalid/fraud/expired card)
        await db.updateGiftCardBalanceCheck(
          cardId,
          checkRes.checkedAt,
          checkRes.status,
          checkRes.provider,
          checkRes.message
        );
        updatedCard = await db.updateGiftCardStatus(cardId, "REJECTED");
        
        const tx = await db.getTransactionByGiftCardId(cardId);
        if (tx) {
          await db.updateTransactionStatus(tx.id, "FAILED");
        }
      }

      res.json({ 
        success: checkRes.success, 
        card: updatedCard,
        balanceCheck: {
          checkedAt: checkRes.checkedAt,
          status: checkRes.status,
          provider: checkRes.provider,
          message: checkRes.message
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Pay/Trigger Instant Payout workflow (Admin Only)
  app.post("/api/cards/:id/pay", async (req, res) => {
    try {
      const user = await db.getUserById(currentUserId);
      if (!user || user.role !== "ADMIN") {
        return res.status(403).json({ error: "Forbidden: Admin access required" });
      }

      const cardId = req.params.id;
      const card = await db.getGiftCardById(cardId);
      if (!card) {
        return res.status(404).json({ error: "Gift card not found" });
      }

      const tx = await db.getTransactionByGiftCardId(cardId);
      if (!tx) {
        return res.status(400).json({ error: "No transaction found associated with this gift card" });
      }

      // Trigger the payment gateway transaction
      const gatewayRes = await processPayoutGateway(card.offerAmount, tx.payoutMethod, tx.payoutDetails);
      if (!gatewayRes.success) {
        return res.status(502).json({ 
          error: `Payment Gateway Failure: ${gatewayRes.gatewayMessage}`,
          gatewayTxId: gatewayRes.gatewayTxId,
          gatewayMessage: gatewayRes.gatewayMessage,
          apiMode: gatewayRes.apiMode
        });
      }

      // If gateway is successful, complete database updates
      const updatedCard = await db.updateGiftCardStatus(cardId, "PAID");
      
      const updatedTx = await db.updateTransactionStatus(
        tx.id, 
        "PAID", 
        new Date().toISOString(),
        gatewayRes.gatewayTxId,
        gatewayRes.gatewayMessage,
        gatewayRes.gatewayFee
      );

      // As successful transactions complete, raise the seller's trust score slightly
      const seller = await db.getUserById(card.sellerId);
      if (seller && seller.trustScore < 100) {
        const increment = 5;
        await db.updateUserTrustScore(seller.id, Math.min(100, seller.trustScore + increment));
      }

      res.json({ 
        success: true, 
        card: updatedCard, 
        transaction: updatedTx, 
        gateway: {
          txId: gatewayRes.gatewayTxId,
          message: gatewayRes.gatewayMessage,
          fee: gatewayRes.gatewayFee,
          mode: gatewayRes.apiMode
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Reject gift card (Admin Only)
  app.post("/api/cards/:id/reject", async (req, res) => {
    try {
      const user = await db.getUserById(currentUserId);
      if (!user || user.role !== "ADMIN") {
        return res.status(403).json({ error: "Forbidden: Admin access required" });
      }

      const cardId = req.params.id;
      const card = await db.getGiftCardById(cardId);
      if (!card) {
        return res.status(404).json({ error: "Gift card not found" });
      }

      // Update gift card status
      const updatedCard = await db.updateGiftCardStatus(cardId, "REJECTED");
      
      // Update Transaction
      const tx = await db.getTransactionByGiftCardId(cardId);
      let updatedTx = null;
      if (tx) {
        updatedTx = await db.updateTransactionStatus(tx.id, "FAILED");
      }

      // Substantial trust score penalty for card rejection
      const seller = await db.getUserById(card.sellerId);
      if (seller) {
        await db.updateUserTrustScore(seller.id, Math.max(10, seller.trustScore - 20));
      }

      res.json({ success: true, card: updatedCard, transaction: updatedTx });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin resets or tweaks user trust score
  app.post("/api/user/:id/trust-score", async (req, res) => {
    try {
      const adminUser = await db.getUserById(currentUserId);
      if (!adminUser || adminUser.role !== "ADMIN") {
        return res.status(403).json({ error: "Forbidden: Admin access required" });
      }

      const targetUserId = req.params.id;
      const { trustScore } = req.body;
      
      if (trustScore === undefined || isNaN(parseInt(trustScore))) {
        return res.status(400).json({ error: "Valid trustScore number is required" });
      }

      const updated = await db.updateUserTrustScore(targetUserId, parseInt(trustScore));
      if (!updated) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ success: true, user: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Reset entire database to default seeds
  app.post("/api/reset", async (req, res) => {
    try {
      await db.resetDB();
      res.json({ success: true, message: "Database reset to initial seeds in Firestore" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- VITE / STATIC FILE SERVING MIDDLEWARE ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Full-Stack Server] running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server", err);
});
