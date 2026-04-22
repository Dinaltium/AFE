const { neonConfig, Pool } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-serverless');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../apps/web/.env.local') });

async function dump() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const rows = await pool.query('SELECT * FROM payments ORDER BY created_at DESC LIMIT 3');
  console.log('PAYMENTS:', JSON.stringify(rows.rows, null, 2));
  
  const profiles = await pool.query('SELECT * FROM user_profiles');
  console.log('PROFILES:', JSON.stringify(profiles.rows, null, 2));
  
  await pool.end();
}

dump();
