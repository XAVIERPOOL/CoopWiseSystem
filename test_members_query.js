const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
  try {
    const res = await pool.query(`
      SELECT m.*, c.name as cooperative_name 
      FROM members m 
      LEFT JOIN cooperatives c ON m.cooperative_id = c.id
      WHERE 1=1
      ORDER BY m.created_at DESC
      LIMIT 1
    `);
    console.log("Success! Members:", res.rows);
  } catch (err) {
    console.error("ERROR:", err.message);
  } finally {
    pool.end();
  }
}
check();
