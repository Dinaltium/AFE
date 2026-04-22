import { db } from "./src/lib/db";
import { userProfiles } from "./src/lib/db/schema";
import { eq } from "drizzle-orm";

async function check() {
  const userId = "42c52649-4e11-49cc-a462-f333b030a2b3";
  const p = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId));
  console.log("Profile:", JSON.stringify(p, null, 2));
}

check().catch(console.error);
