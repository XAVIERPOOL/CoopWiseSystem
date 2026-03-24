require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

async function testInsert() {
  const sql = neon(process.env.DATABASE_URL);
  try {
    const result = await sql`
      INSERT INTO compliance_records (cooperative_name, cooperative_type, requirement_name, status, reviewed_by)
      VALUES ('Test Coop', 'Test', 'Mayors Permit', 'pending', '11111111-1111-1111-1111-111111111111')
      RETURNING id;
    `;
    console.log("Success! Inserted ID:", result[0].id);

    // Clean up
    await sql`DELETE FROM compliance_records WHERE id = ${result[0].id}`;
    console.log("Cleaned up test record.");
  } catch (err) {
    console.error("Test failed:", err);
  }
}

testInsert();
