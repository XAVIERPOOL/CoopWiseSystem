require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

async function check() {
  const sql = neon(process.env.DATABASE_URL);
  try {
    const records = await sql`SELECT cooperative_name, requirement_name, status, LENGTH(file_url) as file_len FROM compliance_records WHERE cooperative_name = 'Testing'`;
    console.table(records);
  } catch(e) {
    console.error(e);
  }
}
check();
