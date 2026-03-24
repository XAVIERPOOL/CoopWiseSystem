require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

async function main() {
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    // Attempt standard type conversion
    console.log("Attempting to alter column...");
    await sql`ALTER TABLE compliance_records ALTER COLUMN reviewed_by TYPE VARCHAR(255) USING reviewed_by::varchar`;
    console.log("Success altering reviewed_by to VARCHAR(255) using cast!");
  } catch (err) {
    console.log("Cast failed, dropping and re-adding column...");
    try {
        await sql`ALTER TABLE compliance_records DROP COLUMN reviewed_by`;
        await sql`ALTER TABLE compliance_records ADD COLUMN reviewed_by VARCHAR(255)`;
        console.log("Successfully dropped and re-added reviewed_by as VARCHAR(255)!");
    } catch (dropErr) {
        console.error("Critical failure adjusting column:", dropErr);
    }
  }
}

main();
