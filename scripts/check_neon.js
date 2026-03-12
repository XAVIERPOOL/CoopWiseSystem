import pg from 'pg';
const { Pool } = pg;

const remotePool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_dxk3O1tXZyGI@ep-damp-boat-ah0it3xm-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        const res = await remotePool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';");
        console.log("TABLES ON NEON:", res.rows.map(r => r.table_name));
    } catch (e) {
        console.error(e);
    } finally {
        await remotePool.end();
    }
}
run();
