require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function run() {
  try {
    console.log('Altering compliance_records table...');
    // Drop the column and recreate it as text/uuid since it's probably empty or we don't care about old integer IDs
    await sql(`
      ALTER TABLE compliance_records 
      ALTER COLUMN reviewed_by TYPE TEXT USING reviewed_by::text
    `);
    console.log('Altered successfully!');
  } catch (err) {
    console.error('Error during setup:', err);
  }
}

run();
