import { db } from "./src/lib/db";
import { payments, auditEvents } from "./src/lib/db/schema";
import { eq } from "drizzle-orm";

async function check() {
  const userId = "42c52649-4e11-49cc-a462-f333b030a2b3";
  const p = await db.select().from(payments).where(eq(payments.userId, userId));
  
  console.log("Payments for 42c5...:");
  console.log(JSON.stringify(p.map(x => ({ id: x.id, source: x.source, gst: x.gstApplicable, amount: x.amount })), null, 2));
}

check().catch(console.error);
