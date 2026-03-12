import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const {
    Pool
} = pg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
    } : false
});

async function addTargetPositionsColumn() {
    try {
        console.log('Connecting to the database...');

        // Check if the column exists first
        const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='trainings' and column_name='target_positions';
    `;
        const checkRes = await pool.query(checkQuery);

        if (checkRes.rows.length === 0) {
            console.log('Column "target_positions" does not exist. Adding it now...');
            await pool.query(`ALTER TABLE trainings ADD COLUMN target_positions JSONB DEFAULT '[]'::jsonb;`);
            console.log('Successfully added "target_positions" column to "trainings" table.');
        } else {
            console.log('Column "target_positions" already exists in "trainings" table.');
        }
    } catch (error) {
        console.error('Error adding column:', error);
    } finally {
        await pool.end();
        console.log('Database connection closed.');
    }
}

addTargetPositionsColumn();