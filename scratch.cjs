const { neon } = require('@neondatabase/serverless');
require('dotenv').config();
const sql = neon(process.env.DATABASE_URL);
sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'trainings'`
  .then(console.log)
  .catch(console.error);
