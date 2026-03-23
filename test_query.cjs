require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }  });

async function run() {
  try {
    const res = await pool.query('SELECT * FROM compliance_records ORDER BY deadline ASC');
    console.log('Query success! Row count:', res.rows.length);
  } catch(e) {
    console.error('Query failed:', e);
  } finally {
    pool.end();
  }
}
run();
