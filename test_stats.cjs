require('dotenv').config();
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

async function run() {
  console.log("Cooperatives cols:", (await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'cooperatives'`).map(x=>x.column_name).join(', '));
  console.log("Members cols:", (await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'members'`).map(x=>x.column_name).join(', '));
  console.log("Trainings cols:", (await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'trainings'`).map(x=>x.column_name).join(', '));
}
run();
