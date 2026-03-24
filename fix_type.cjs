require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

async function fix() {
  const sql = neon(process.env.DATABASE_URL);
  try {
    await sql`UPDATE compliance_records SET cooperative_type = 'Agriculture' WHERE cooperative_type ILIKE '%agri%'`;
    await sql`UPDATE compliance_records SET cooperative_type = 'Consumers' WHERE cooperative_type ILIKE '%consum%'`;
    await sql`UPDATE compliance_records SET cooperative_type = 'Credit' WHERE cooperative_type ILIKE '%credit%'`;
    await sql`UPDATE compliance_records SET cooperative_type = 'Federation' WHERE cooperative_type ILIKE '%federation%'`;
    await sql`UPDATE compliance_records SET cooperative_type = 'Health Service' WHERE cooperative_type ILIKE '%health%'`;
    await sql`UPDATE compliance_records SET cooperative_type = 'Labor Service' WHERE cooperative_type ILIKE '%labor%'`;
    await sql`UPDATE compliance_records SET cooperative_type = 'Multipurpose' WHERE cooperative_type ILIKE '%multi%'`;
    await sql`UPDATE compliance_records SET cooperative_type = 'Transport' WHERE cooperative_type ILIKE '%transport%'`;

    console.log("Fixed compliance record types!");
  } catch(e) {
    console.error(e);
  }
}
fix();
