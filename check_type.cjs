require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

async function check() {
  const sql = neon(process.env.DATABASE_URL);
  const result = await sql`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'compliance_records'
    AND column_name = 'reviewed_by';
  `;
  console.log(JSON.stringify(result, null, 2));
}

check();
