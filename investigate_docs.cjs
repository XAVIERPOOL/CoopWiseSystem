require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

async function check() {
  const sql = neon(process.env.DATABASE_URL);
  try {
    const res = await sql`SELECT submitted_documents FROM cooperatives WHERE name = 'Testing' ORDER BY created_at DESC LIMIT 1`;
    let docs = [];
    if (typeof res[0].submitted_documents === 'string') {
      docs = JSON.parse(res[0].submitted_documents);
    } else {
      docs = res[0].submitted_documents || [];
    }
    
    console.log("Found types:", docs.map(d => d.type));
  } catch(e) {
    console.error(e);
  }
}
check();
