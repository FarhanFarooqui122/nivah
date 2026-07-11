export const PLANS = {
  FREE: {
    name: "Free",
    storageLimit: 500 * 1024 * 1024,
    storageLabel: "500 MB",
    maxAiConnections: 3,
    price: 0,
  },
  PRO: {
    name: "Pro",
    storageLimit: 50 * 1024 * 1024 * 1024,
    storageLabel: "50 GB",
    maxAiConnections: 10,
    price: 9,
  },
} as const;

export type Plan = keyof typeof PLANS;
