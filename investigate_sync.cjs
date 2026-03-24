require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

async function investigate() {
  const sql = neon(process.env.DATABASE_URL);
  try {
    console.log("=== Recent Cooperatives ===");
    const coops = await sql`SELECT id, name, type, status, created_at FROM cooperatives ORDER BY created_at DESC LIMIT 5`;
    console.table(coops);

    console.log("=== Recent Compliance Records ===");
    const records = await sql`SELECT id, cooperative_name, cooperative_type, requirement_name, status, submitted_date FROM compliance_records ORDER BY submitted_date DESC NULLS LAST LIMIT 10`;
    console.table(records);
    
    // Check missing ones if any
    if (coops.length > 0) {
      const docs = await sql`SELECT name, submitted_documents FROM cooperatives WHERE id = ${coops[0].id}`;
      console.log("Latest Coop Docs length:", docs[0].submitted_documents ? JSON.stringify(docs[0].submitted_documents).length : 0);
    }
  } catch(e) {
    console.error(e);
  }
}
investigate();
