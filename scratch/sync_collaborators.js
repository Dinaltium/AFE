const { Pool } = require('@neondatabase/serverless');

async function migrate() {
  const connectionString = "postgresql://neondb_owner:npg_I06jnkbEASJe@ep-bold-haze-a1yxaf28-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";
  const pool = new Pool({ connectionString });
  
  try {
    console.log("Starting data synchronization...");
    
    // 1. Get all users and their collaborator configs
    const profiles = await pool.query('SELECT user_id, collaborators, collaborator_name FROM user_profiles');
    
    for (const profile of profiles.rows) {
      const userId = profile.user_id;
      let collabs = profile.collaborators;
      
      // If collaborators list is empty but collaborator_name exists, create a default list
      if ((!collabs || collabs.length === 0) && profile.collaborator_name) {
        collabs = [{ name: profile.collaborator_name, rate: 0.1 }];
      }
      
      if (!collabs || collabs.length === 0) continue;
      
      console.log(`Syncing payments for user ${userId} with collabs:`, JSON.stringify(collabs));
      
      // 2. Find all payments for this user
      const payments = await pool.query(
        "SELECT id, amount, collaborator_amount FROM payments WHERE user_id = $1",
        [userId]
      );
      
      for (const payment of payments.rows) {
        const totalCollabAmt = Number(payment.collaborator_amount);
        if (totalCollabAmt <= 0) continue;
        
        // 3. Re-calculate splits based on CURRENT profile
        const newSplits = collabs.map(c => ({
          name: c.name,
          amount: Math.round(totalCollabAmt * (c.rate / collabs.reduce((s, curr) => s + curr.rate, 0))),
          rate: c.rate
        }));
        
        console.log(`Updating payment ${payment.id}: setting splits to`, JSON.stringify(newSplits));
        
        await pool.query(
          "UPDATE payments SET collaborator_splits = $1 WHERE id = $2",
          [JSON.stringify(newSplits), payment.id]
        );
      }
    }
    
    console.log("Migration complete. All payments are now synchronized with collaborator names.");
    
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await pool.end();
  }
}

migrate();
