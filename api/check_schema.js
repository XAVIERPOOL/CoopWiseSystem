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
        const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'profiles';");
        console.log(res.rows.map(r => r.column_name).join(', '));
    } catch (err) {
        console.error('Database Error:', err.message);
    } finally {
        await pool.end();
    }
}

run();