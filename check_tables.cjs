require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkTables() {
  try {
    const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log("Tables:");
    res.rows.forEach(r => console.log(r.table_name));
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

checkTables();
