require('dotenv').config();
const { neon } = require('@neondatabase/serverless');
const fs = require('fs');

async function investigate() {
  const sql = neon(process.env.DATABASE_URL);
  try {
    const coops = await sql`SELECT id, name, type, status, created_at FROM cooperatives ORDER BY created_at DESC LIMIT 2`;
    const records = await sql`SELECT id, cooperative_name, cooperative_type, requirement_name, status, submitted_date FROM compliance_records ORDER BY submitted_date DESC NULLS LAST LIMIT 5`;

    let out = "=== Recent Cooperatives ===\n" + JSON.stringify(coops, null, 2) + "\n\n=== Recent Compliance Records ===\n" + JSON.stringify(records, null, 2);
    
    fs.writeFileSync('sync_output.txt', out);
    console.log("Done");
  } catch(e) {
    console.error(e);
  }
}
investigate();
