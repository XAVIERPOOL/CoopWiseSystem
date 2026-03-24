require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

async function fixActivityLogs() {
  const sql = neon(process.env.DATABASE_URL);
  try {
    console.log("Altering activity_logs.user_id...");
    await sql`ALTER TABLE activity_logs ALTER COLUMN user_id TYPE VARCHAR(255) USING user_id::varchar`;
    console.log("Success!");
  } catch (err) {
    console.log("Cast failed, dropping & re-adding...");
    await sql`ALTER TABLE activity_logs DROP COLUMN user_id`;
    await sql`ALTER TABLE activity_logs ADD COLUMN user_id VARCHAR(255)`;
    console.log("Success by dropping!");
  }
}

fixActivityLogs();
