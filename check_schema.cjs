require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

async function checkSchema() {
  const sql = neon(process.env.DATABASE_URL);
  const result = await sql`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'compliance_records';
  `;
  console.log(result);
}

checkSchema();
