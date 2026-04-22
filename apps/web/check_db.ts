import { db } from "./src/lib/db";
import { auditEvents, payments, users } from "./src/lib/db/schema";
import { count } from "drizzle-orm";

async function check() {
  const userCount = await db.select({ value: count() }).from(users);
  const paymentCount = await db.select({ value: count() }).from(payments);
  const auditCount = await db.select({ value: count() }).from(auditEvents);

  console.log("Users:", userCount[0].value);
  console.log("Payments:", paymentCount[0].value);
  console.log("Audit Events:", auditCount[0].value);

  const samplePayments = await db.select().from(payments).limit(5);
  console.log("Sample Payments:", JSON.stringify(samplePayments, null, 2));

  const sampleAudit = await db.select().from(auditEvents).limit(5);
  console.log("Sample Audit:", JSON.stringify(sampleAudit, null, 2));
}

check().catch(console.error);
