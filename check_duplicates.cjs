require('dotenv').config();
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

async function checkDuplicates() {
  const res = await sql`
    SELECT id, title, start_date, capacity, time, status, created_at
    FROM trainings 
    WHERE title ILIKE '%Seminar%'
    ORDER BY created_at DESC;
  `;
  console.log("Seminar Trainings found:", res.length);
  console.log(res);
}
checkDuplicates();
