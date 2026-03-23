require('dotenv').config();
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

async function run() {
  // Find duplicate "Seminar"
  const duplicates = await sql`
    SELECT t.id, t.training_id, t.title, t.capacity, 
           (SELECT COUNT(*) FROM training_registrations tr WHERE tr.training_id = t.id) as reg_count
    FROM trainings t
    WHERE t.title = 'Seminar'
  `;
  console.log("Seminars:", duplicates);

  // Delete the one with 0 registrations if there are exactly 2
  if (duplicates.length > 1) {
    const emptyOnes = duplicates.filter(d => parseInt(d.reg_count) === 0);
    for (const empty of emptyOnes) {
      console.log("Deleting duplicate empty seminar:", empty.training_id);
      await sql`DELETE FROM trainings WHERE id = ${empty.id}`;
    }
    console.log("Cleaned up duplicates.");
  }
}
run();
