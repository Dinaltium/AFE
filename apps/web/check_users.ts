import { db } from "./src/lib/db";
import { users } from "./src/lib/db/schema";

async function check() {
  const allUsers = await db.select().from(users);
  console.log("Users:", JSON.stringify(allUsers, null, 2));
}

check().catch(console.error);
