require('dotenv').config();
const { Pool } = require('@neondatabase/serverless');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function test() {
  try {
    const res = await pool.query('SELECT * FROM compliance_records ORDER BY deadline ASC');
    console.log("Success! Data length:", res.rows.length);
  } catch(e) {
    console.error("Error calling pool.query:", e);
  } finally {
    pool.end();
  }
}
test();
