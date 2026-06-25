import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  limit 
} from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

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
}

export interface Transaction {
  id: string;
  giftCardId: string;
  payoutMethod: 'ACH' | 'PAYPAL' | 'DEBIT_CARD';
  payoutDetails: string;
  status: 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED';
  completedAt?: string;
  createdAt: string;
  gatewayTxId?: string;
  gatewayMessage?: string;
  gatewayFee?: number;
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

// Global cached connection
let firestore: any = null;
let useLocalFallback = false;

const DB_FILE_PATH = path.join(process.cwd(), 'db.json');

const INITIAL_USERS: User[] = [
  {
    id: "usr-default-1",
    email: "emma432cent@gmail.com",
    name: "Emma Cent",
    role: "USER",
    trustScore: 85,
    createdAt: new Date().toISOString()
  },
  {
    id: "usr-admin-1",
    email: "admin@giftcardresale.com",
    name: "System Admin",
    role: "ADMIN",
    trustScore: 100,
    createdAt: new Date().toISOString()
  },
  {
    id: "usr-lowtrust-1",
    email: "risky.seller@example.com",
    name: "Jordan Low",
    role: "USER",
    trustScore: 45,
    createdAt: new Date().toISOString()
  }
];

const INITIAL_CARDS: GiftCard[] = [
  {
    id: "card-1",
    sellerId: "usr-default-1",
    brand: "Amazon",
    initialBalance: 100,
    offerAmount: 85,
    cardNumber: "4820-1928-3928-4829",
    pin: "4921",
    status: "PENDING",
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: "card-2",
    sellerId: "usr-lowtrust-1",
    brand: "Starbucks",
    initialBalance: 50,
    offerAmount: 32.5,
    cardNumber: "6039-1928-4820-2918",
    pin: "1920",
    status: "VERIFIED",
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
  },
  {
    id: "card-3",
    sellerId: "usr-default-1",
    brand: "Target",
    initialBalance: 200,
    offerAmount: 160,
    cardNumber: "7019-2091-3849-2911",
    pin: "9821",
    status: "PAID",
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
  }
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: "tx-1",
    giftCardId: "card-3",
    payoutMethod: "PAYPAL",
    payoutDetails: "emma432cent@gmail.com",
    status: "PAID",
    completedAt: new Date(Date.now() - 3600000 * 23).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
  }
];

const DEFAULT_ADS_SETTINGS: AdsSettings = {
  enabled: true,
  client: "ca-pub-3940259830192011",
  headerSlot: "8390291102",
  sidebarSlot: "1920391022",
  nativeSlot: "4920192831",
  impressions: 4850,
  clicks: 124,
  estimatedEarnings: 38.25
};

interface LocalSchema {
  users: User[];
  giftCards: GiftCard[];
  transactions: Transaction[];
  adsSettings?: AdsSettings;
}

// Local JSON File helper functions
function readLocalDB(): LocalSchema {
  if (!fs.existsSync(DB_FILE_PATH)) {
    const data: LocalSchema = {
      users: [...INITIAL_USERS],
      giftCards: [...INITIAL_CARDS],
      transactions: [...INITIAL_TRANSACTIONS],
      adsSettings: { ...DEFAULT_ADS_SETTINGS }
    };
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return data;
  }
  try {
    const content = fs.readFileSync(DB_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(content);
    if (!parsed.adsSettings) {
      parsed.adsSettings = { ...DEFAULT_ADS_SETTINGS };
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(parsed, null, 2), 'utf-8');
    }
    return parsed;
  } catch (e) {
    const data: LocalSchema = {
      users: [...INITIAL_USERS],
      giftCards: [...INITIAL_CARDS],
      transactions: [...INITIAL_TRANSACTIONS],
      adsSettings: { ...DEFAULT_ADS_SETTINGS }
    };
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return data;
  }
}

function writeLocalDB(data: LocalSchema) {
  fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

function getFirestoreInstance(): any {
  if (firestore) return firestore;
  
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    
    const firebaseConfig = {
      apiKey: config.apiKey,
      authDomain: config.authDomain,
      projectId: config.projectId,
      storageBucket: config.storageBucket,
      messagingSenderId: config.messagingSenderId,
      appId: config.appId,
      measurementId: config.measurementId
    };

    const app = getApps().length === 0 
      ? initializeApp(firebaseConfig) 
      : getApp();
    firestore = getFirestore(app, config.firestoreDatabaseId || undefined);
  } else {
    const app = getApps().length === 0 ? initializeApp({}) : getApp();
    firestore = getFirestore(app);
  }
  return firestore;
}

// Attempt to seed Firestore if empty
async function ensureFirestoreSeeded(fsDb: any) {
  const usersColl = collection(fsDb, 'users');
  const q = query(usersColl, limit(1));
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    console.log("[Firestore] Seeding initial database records...");
    for (const u of INITIAL_USERS) {
      await setDoc(doc(fsDb, 'users', u.id), u);
    }
    for (const c of INITIAL_CARDS) {
      await setDoc(doc(fsDb, 'giftCards', c.id), c);
    }
    for (const t of INITIAL_TRANSACTIONS) {
      await setDoc(doc(fsDb, 'transactions', t.id), t);
    }
    console.log("[Firestore] Seeding completed successfully.");
  }
}

// Wrapper to safely execute Firestore operations, failing back to local DB if they fail
async function executeOp<T>(
  fsOp: (fsDb: any) => Promise<T>, 
  localOp: () => Promise<T>
): Promise<T> {
  if (useLocalFallback) {
    return localOp();
  }
  try {
    const fsDb = getFirestoreInstance();
    await ensureFirestoreSeeded(fsDb);
    return await fsOp(fsDb);
  } catch (err: any) {
    console.warn(`[Firestore Warning] Operational error (falling back to JSON storage): ${err.message}`);
    useLocalFallback = true;
    return localOp();
  }
}

export const db = {
  getUsers: async () => {
    return executeOp(
      async (fsDb) => {
        const snapshot = await getDocs(collection(fsDb, 'users'));
        return snapshot.docs.map(doc => doc.data() as User);
      },
      async () => {
        const local = readLocalDB();
        return local.users;
      }
    );
  },

  getUserById: async (id: string) => {
    return executeOp(
      async (fsDb) => {
        const docSnap = await getDoc(doc(fsDb, 'users', id));
        return docSnap.exists() ? (docSnap.data() as User) : null;
      },
      async () => {
        const local = readLocalDB();
        return local.users.find(u => u.id === id) || null;
      }
    );
  },

  getUserByEmail: async (email: string) => {
    return executeOp(
      async (fsDb) => {
        const q = query(collection(fsDb, 'users'), where('email', '==', email), limit(1));
        const snapshot = await getDocs(q);
        if (snapshot.empty) return null;
        return snapshot.docs[0].data() as User;
      },
      async () => {
        const local = readLocalDB();
        return local.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
      }
    );
  },

  createUser: async (user: Omit<User, 'id' | 'createdAt'>) => {
    const id = `usr-${Math.random().toString(36).substring(2, 11)}`;
    const createdAt = new Date().toISOString();
    const newUser: User = { ...user, id, createdAt };

    return executeOp(
      async (fsDb) => {
        await setDoc(doc(fsDb, 'users', id), newUser);
        return newUser;
      },
      async () => {
        const local = readLocalDB();
        local.users.push(newUser);
        writeLocalDB(local);
        return newUser;
      }
    );
  },

  updateUserTrustScore: async (id: string, score: number) => {
    const cleanScore = Math.max(0, Math.min(100, score));

    return executeOp(
      async (fsDb) => {
        const userRef = doc(fsDb, 'users', id);
        await updateDoc(userRef, { trustScore: cleanScore });
        const updatedSnap = await getDoc(userRef);
        return updatedSnap.data() as User;
      },
      async () => {
        const local = readLocalDB();
        const idx = local.users.findIndex(u => u.id === id);
        if (idx !== -1) {
          local.users[idx].trustScore = cleanScore;
          writeLocalDB(local);
          return local.users[idx];
        }
        throw new Error("User not found to update trust score");
      }
    );
  },

  updateUserMembership: async (id: string, status: 'STANDARD' | 'PRO', expiresAt?: string) => {
    return executeOp(
      async (fsDb) => {
        const userRef = doc(fsDb, 'users', id);
        const updates: any = { membershipStatus: status };
        if (expiresAt) updates.membershipExpiresAt = expiresAt;
        await updateDoc(userRef, updates);
        const updatedSnap = await getDoc(userRef);
        return updatedSnap.data() as User;
      },
      async () => {
        const local = readLocalDB();
        const idx = local.users.findIndex(u => u.id === id);
        if (idx !== -1) {
          local.users[idx].membershipStatus = status;
          if (expiresAt) local.users[idx].membershipExpiresAt = expiresAt;
          writeLocalDB(local);
          return local.users[idx];
        }
        throw new Error("User not found to update membership status");
      }
    );
  },

  getAdsSettings: async (): Promise<AdsSettings> => {
    return executeOp(
      async (fsDb) => {
        const docRef = doc(fsDb, 'settings', 'google_ads');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          return snap.data() as AdsSettings;
        } else {
          await setDoc(docRef, DEFAULT_ADS_SETTINGS);
          return DEFAULT_ADS_SETTINGS;
        }
      },
      async () => {
        const local = readLocalDB();
        if (!local.adsSettings) {
          local.adsSettings = { ...DEFAULT_ADS_SETTINGS };
          writeLocalDB(local);
        }
        return local.adsSettings;
      }
    );
  },

  updateAdsSettings: async (updates: Partial<AdsSettings>): Promise<AdsSettings> => {
    return executeOp(
      async (fsDb) => {
        const docRef = doc(fsDb, 'settings', 'google_ads');
        const snap = await getDoc(docRef);
        const current = snap.exists() ? snap.data() as AdsSettings : { ...DEFAULT_ADS_SETTINGS };
        const updated = { ...current, ...updates };
        await setDoc(docRef, updated);
        return updated;
      },
      async () => {
        const local = readLocalDB();
        const current = local.adsSettings || { ...DEFAULT_ADS_SETTINGS };
        const updated = { ...current, ...updates };
        local.adsSettings = updated;
        writeLocalDB(local);
        return updated;
      }
    );
  },

  incrementAdsMetrics: async (type: 'impression' | 'click', revenueAmount = 0.00): Promise<AdsSettings> => {
    return executeOp(
      async (fsDb) => {
        const docRef = doc(fsDb, 'settings', 'google_ads');
        const snap = await getDoc(docRef);
        const current = snap.exists() ? snap.data() as AdsSettings : { ...DEFAULT_ADS_SETTINGS };
        if (type === 'impression') {
          current.impressions = (current.impressions || 0) + 1;
        } else if (type === 'click') {
          current.clicks = (current.clicks || 0) + 1;
        }
        if (revenueAmount > 0) {
          current.estimatedEarnings = parseFloat(((current.estimatedEarnings || 0) + revenueAmount).toFixed(4));
        }
        await setDoc(docRef, current);
        return current;
      },
      async () => {
        const local = readLocalDB();
        const current = local.adsSettings || { ...DEFAULT_ADS_SETTINGS };
        if (type === 'impression') {
          current.impressions = (current.impressions || 0) + 1;
        } else if (type === 'click') {
          current.clicks = (current.clicks || 0) + 1;
        }
        if (revenueAmount > 0) {
          current.estimatedEarnings = parseFloat(((current.estimatedEarnings || 0) + revenueAmount).toFixed(4));
        }
        local.adsSettings = current;
        writeLocalDB(local);
        return current;
      }
    );
  },

  getGiftCards: async () => {
    return executeOp(
      async (fsDb) => {
        const snapshot = await getDocs(collection(fsDb, 'giftCards'));
        return snapshot.docs.map(doc => doc.data() as GiftCard);
      },
      async () => {
        const local = readLocalDB();
        return local.giftCards;
      }
    );
  },

  getGiftCardById: async (id: string) => {
    return executeOp(
      async (fsDb) => {
        const docSnap = await getDoc(doc(fsDb, 'giftCards', id));
        return docSnap.exists() ? (docSnap.data() as GiftCard) : null;
      },
      async () => {
        const local = readLocalDB();
        return local.giftCards.find(c => c.id === id) || null;
      }
    );
  },

  createGiftCard: async (card: Omit<GiftCard, 'id' | 'createdAt'>) => {
    const id = `card-${Math.random().toString(36).substring(2, 11)}`;
    const createdAt = new Date().toISOString();
    const newCard: GiftCard = { ...card, id, createdAt };

    return executeOp(
      async (fsDb) => {
        await setDoc(doc(fsDb, 'giftCards', id), newCard);
        return newCard;
      },
      async () => {
        const local = readLocalDB();
        local.giftCards.push(newCard);
        writeLocalDB(local);
        return newCard;
      }
    );
  },

  updateGiftCardStatus: async (id: string, status: GiftCard['status']) => {
    return executeOp(
      async (fsDb) => {
        const cardRef = doc(fsDb, 'giftCards', id);
        await updateDoc(cardRef, { status });
        const updatedSnap = await getDoc(cardRef);
        return updatedSnap.data() as GiftCard;
      },
      async () => {
        const local = readLocalDB();
        const idx = local.giftCards.findIndex(c => c.id === id);
        if (idx !== -1) {
          local.giftCards[idx].status = status;
          writeLocalDB(local);
          return local.giftCards[idx];
        }
        throw new Error("Gift card not found to update status");
      }
    );
  },

  updateGiftCardBalanceCheck: async (
    id: string,
    balanceCheckedAt: string,
    balanceCheckStatus: GiftCard['balanceCheckStatus'],
    balanceCheckProvider: GiftCard['balanceCheckProvider'],
    balanceCheckMessage: string
  ) => {
    return executeOp(
      async (fsDb) => {
        const cardRef = doc(fsDb, 'giftCards', id);
        await updateDoc(cardRef, {
          balanceCheckedAt,
          balanceCheckStatus,
          balanceCheckProvider,
          balanceCheckMessage
        });
        const updatedSnap = await getDoc(cardRef);
        return updatedSnap.data() as GiftCard;
      },
      async () => {
        const local = readLocalDB();
        const idx = local.giftCards.findIndex(c => c.id === id);
        if (idx !== -1) {
          local.giftCards[idx].balanceCheckedAt = balanceCheckedAt;
          local.giftCards[idx].balanceCheckStatus = balanceCheckStatus;
          local.giftCards[idx].balanceCheckProvider = balanceCheckProvider;
          local.giftCards[idx].balanceCheckMessage = balanceCheckMessage;
          writeLocalDB(local);
          return local.giftCards[idx];
        }
        throw new Error("Gift card not found to update balance check results");
      }
    );
  },

  getTransactions: async () => {
    return executeOp(
      async (fsDb) => {
        const snapshot = await getDocs(collection(fsDb, 'transactions'));
        return snapshot.docs.map(doc => doc.data() as Transaction);
      },
      async () => {
        const local = readLocalDB();
        return local.transactions;
      }
    );
  },

  getTransactionByGiftCardId: async (cardId: string) => {
    return executeOp(
      async (fsDb) => {
        const q = query(collection(fsDb, 'transactions'), where('giftCardId', '==', cardId), limit(1));
        const snapshot = await getDocs(q);
        if (snapshot.empty) return null;
        return snapshot.docs[0].data() as Transaction;
      },
      async () => {
        const local = readLocalDB();
        return local.transactions.find(t => t.giftCardId === cardId) || null;
      }
    );
  },

  createTransaction: async (tx: Omit<Transaction, 'id' | 'createdAt'>) => {
    const id = `tx-${Math.random().toString(36).substring(2, 11)}`;
    const createdAt = new Date().toISOString();
    const newTx: Transaction = { ...tx, id, createdAt };

    return executeOp(
      async (fsDb) => {
        await setDoc(doc(fsDb, 'transactions', id), newTx);
        return newTx;
      },
      async () => {
        const local = readLocalDB();
        local.transactions.push(newTx);
        writeLocalDB(local);
        return newTx;
      }
    );
  },

  updateTransactionStatus: async (
    id: string, 
    status: Transaction['status'], 
    completedAt?: string,
    gatewayTxId?: string,
    gatewayMessage?: string,
    gatewayFee?: number
  ) => {
    return executeOp(
      async (fsDb) => {
        const txRef = doc(fsDb, 'transactions', id);
        const updates: any = { status };
        if (completedAt) updates.completedAt = completedAt;
        if (gatewayTxId) updates.gatewayTxId = gatewayTxId;
        if (gatewayMessage) updates.gatewayMessage = gatewayMessage;
        if (gatewayFee !== undefined) updates.gatewayFee = gatewayFee;
        
        await updateDoc(txRef, updates);
        const updatedSnap = await getDoc(txRef);
        return updatedSnap.data() as Transaction;
      },
      async () => {
        const local = readLocalDB();
        const idx = local.transactions.findIndex(t => t.id === id);
        if (idx !== -1) {
          local.transactions[idx].status = status;
          if (completedAt) local.transactions[idx].completedAt = completedAt;
          if (gatewayTxId) local.transactions[idx].gatewayTxId = gatewayTxId;
          if (gatewayMessage) local.transactions[idx].gatewayMessage = gatewayMessage;
          if (gatewayFee !== undefined) local.transactions[idx].gatewayFee = gatewayFee;
          writeLocalDB(local);
          return local.transactions[idx];
        }
        throw new Error("Transaction not found to update status");
      }
    );
  },

  resetDB: async () => {
    return executeOp(
      async (fsDb) => {
        // Delete all from Firestore users
        const usersSnapshot = await getDocs(collection(fsDb, 'users'));
        for (const docSnap of usersSnapshot.docs) {
          await deleteDoc(docSnap.ref);
        }
        
        // Delete all from Firestore giftCards
        const cardsSnapshot = await getDocs(collection(fsDb, 'giftCards'));
        for (const docSnap of cardsSnapshot.docs) {
          await deleteDoc(docSnap.ref);
        }
        
        // Delete all from Firestore transactions
        const txSnapshot = await getDocs(collection(fsDb, 'transactions'));
        for (const docSnap of txSnapshot.docs) {
          await deleteDoc(docSnap.ref);
        }
        
        // Seed Firestore
        for (const u of INITIAL_USERS) {
          await setDoc(doc(fsDb, 'users', u.id), u);
        }
        for (const c of INITIAL_CARDS) {
          await setDoc(doc(fsDb, 'giftCards', c.id), c);
        }
        for (const t of INITIAL_TRANSACTIONS) {
          await setDoc(doc(fsDb, 'transactions', t.id), t);
        }
        
        // Also sync local file just in case
        const localData: LocalSchema = {
          users: [...INITIAL_USERS],
          giftCards: [...INITIAL_CARDS],
          transactions: [...INITIAL_TRANSACTIONS],
        };
        writeLocalDB(localData);

        return {
          users: INITIAL_USERS,
          giftCards: INITIAL_CARDS,
          transactions: INITIAL_TRANSACTIONS
        };
      },
      async () => {
        const localData: LocalSchema = {
          users: [...INITIAL_USERS],
          giftCards: [...INITIAL_CARDS],
          transactions: [...INITIAL_TRANSACTIONS],
        };
        writeLocalDB(localData);
        return {
          users: INITIAL_USERS,
          giftCards: INITIAL_CARDS,
          transactions: INITIAL_TRANSACTIONS
        };
      }
    );
  }
};
