import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({
    path: path.join(process.cwd(), '..', '.env')
});

const {
    Pool
} = pg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
    } : undefined
});

async function run() {
    try {
        console.log("Testing connection...");
        const existing = await pool.query('SELECT username FROM profiles LIMIT 1');
        console.log("Connected successfully. Attempting insert...");

        // Ensure password_hash exists
        await pool.query('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)');

        const res = await pool.query(
            `INSERT INTO profiles (username, full_name, role, cooperative, password_hash)
       VALUES ($1, $2, $3, $4, $5)`,
            ['test_reg_123', 'Test Coop', 'cooperative', 'Test Coop', 'password123']
        );
        console.log('Insert successful:', res.rowCount);
    } catch (err) {
        console.error('Database Error:', err.message);
    } finally {
        await pool.end();
    }
}

run();