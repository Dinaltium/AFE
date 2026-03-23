interface PaymentSource {
  name: string;
  type: "creator" | "freelancer" | "consultant" | "any";
  minAmount: number;
  maxAmount: number;
}

export const PAYMENT_SOURCES: PaymentSource[] = [
  // Creators
  { name: "YouTube AdSense", type: "creator", minAmount: 5000, maxAmount: 80000 },
  { name: "Twitch Payout", type: "creator", minAmount: 3000, maxAmount: 40000 },
  { name: "Spotify Podcast Revenue", type: "creator", minAmount: 2000, maxAmount: 25000 },
  { name: "Nike India Brand Deal", type: "creator", minAmount: 30000, maxAmount: 200000 },
  { name: "Boat Lifestyle Sponsorship", type: "creator", minAmount: 25000, maxAmount: 150000 },
  { name: "Mamaearth Campaign", type: "creator", minAmount: 20000, maxAmount: 100000 },
  // Freelancers
  { name: "Upwork Client Payment", type: "freelancer", minAmount: 15000, maxAmount: 120000 },
  { name: "Toptal Project Invoice", type: "freelancer", minAmount: 40000, maxAmount: 250000 },
  { name: "Razorpay Direct Client", type: "freelancer", minAmount: 20000, maxAmount: 150000 },
  { name: "Fiverr Order Completion", type: "freelancer", minAmount: 5000, maxAmount: 50000 },
  { name: "Freelancer.com Milestone", type: "freelancer", minAmount: 10000, maxAmount: 80000 },
  // Consultants
  { name: "Monthly Retainer — Startup", type: "consultant", minAmount: 60000, maxAmount: 300000 },
  { name: "Strategy Workshop Fee", type: "consultant", minAmount: 40000, maxAmount: 150000 },
  { name: "Advisory Board Payment", type: "consultant", minAmount: 50000, maxAmount: 200000 },
  { name: "Project Completion Invoice", type: "consultant", minAmount: 80000, maxAmount: 400000 },
  // Generic — works for all types
  { name: "Direct Bank Transfer", type: "any", minAmount: 10000, maxAmount: 500000 },
  { name: "UPI Payment Received", type: "any", minAmount: 5000, maxAmount: 100000 },
  { name: "NEFT Transfer", type: "any", minAmount: 20000, maxAmount: 600000 },
];

/**
 * Generates a random payment matching the user's type (or "any" sources).
 * Amount is uniformly distributed within the source's min/max range.
 */
export function generateRandomPayment(
  userType: string
): { source: string; amount: number } {
  const pool = PAYMENT_SOURCES.filter(
    (s) => s.type === userType || s.type === "any"
  );
  const source = pool[Math.floor(Math.random() * pool.length)];
  const amount =
    Math.floor(Math.random() * (source.maxAmount - source.minAmount + 1)) +
    source.minAmount;
  return { source: source.name, amount };
}

/**
 * Returns a random interval in milliseconds between min and max seconds.
 */
export function getRandomInterval(min: number, max: number): number {
  return (Math.floor(Math.random() * (max - min + 1)) + min) * 1000;
}
