require('dotenv').config();
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

async function run() {
  try {
    const res = await sql`
      SELECT 
        (SELECT COUNT(*) FROM cooperatives) as "totalCooperatives",
        (SELECT COUNT(*) FROM members) as "totalOfficers",
        (SELECT COUNT(*) FROM compliance_records WHERE status = 'compliant') as "compliantOfficers",
        (SELECT COUNT(*) FROM trainings WHERE date > CURRENT_DATE) as "upcomingEvents",
        (SELECT COUNT(*) FROM cooperatives WHERE status = 'pending') as "pendingRegistrations",
        (SELECT COUNT(*) FROM members WHERE status = 'pending') as "pendingMembers",
        (SELECT COUNT(*) FROM compliance_records WHERE status = 'overdue' OR (deadline < CURRENT_DATE AND status != 'compliant')) as "overdueCompliance"
    `;
    console.log("Stats:", res[0]);
  } catch(e) {
    console.error("Error:", e);
  }
}
run();
