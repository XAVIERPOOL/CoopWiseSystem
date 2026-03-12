const {
    Pool
} = require('pg');
require('dotenv').config();
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

pool.query("SELECT id, username, first_name, last_name, role, position, cooperative FROM profiles ORDER BY created_at DESC LIMIT 5")
    .then(res => {
        console.log(res.rows);
        pool.end();
    })
    .catch(err => {
        console.error(err);
        pool.end();
    });