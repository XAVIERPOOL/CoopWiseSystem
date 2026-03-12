import pg from 'pg';
const {
    Pool
} = pg;
const pool = new Pool({
    connectionString: 'postgresql://postgres:admin123@localhost:5432/coopwise_local',
});

async function main() {
    try {
        const res = await pool.query("SELECT pg_size_pretty(pg_database_size('coopwise_local')) AS size, pg_database_size('coopwise_local') as bytes;");
        console.log('DB_SIZE_RESULT:', res.rows[0]);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}
main();