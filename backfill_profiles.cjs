const pg = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
});

async function main() {
    try {
        console.log('Running backfill for missing officer profiles...');

        // Find approved members who are not Regular Members and don't have a profile
        // Match by email or member_id
        const query = `
      SELECT m.id, m.member_id, m.first_name, m.last_name, m.email, m.role, m.cooperative_id
      FROM members m
      WHERE m.status = 'approved'
      AND m.role != 'Regular Member'
      AND NOT EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.username = m.email OR p.username = m.member_id
      )
    `;

        const missingOfficers = await pool.query(query);
        console.log(`Found ${missingOfficers.rows.length} missing officer profiles.`);

        for (const member of missingOfficers.rows) {
            console.log(`Fixing missed profile for: ${member.first_name} ${member.last_name} (${member.role})`);

            const coopRes = await pool.query('SELECT name FROM cooperatives WHERE id = $1', [member.cooperative_id]);
            const coopName = coopRes.rows[0] ?.name || 'Unknown Cooperative';

            const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
            let randomPassword = "";
            for (let i = 0; i < 8; i++) {
                randomPassword += chars.charAt(Math.floor(Math.random() * chars.length));
            }

            const usernameBase = member.email || member.member_id;

            await pool.query(
                `INSERT INTO profiles (username, first_name, last_name, role, cooperative, position, password_hash)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [usernameBase, member.first_name, member.last_name, 'officer', coopName, member.role, randomPassword]
            );

            console.log(`Generated Profile -> Username: ${usernameBase} | Password: ${randomPassword}`);
        }

        console.log('Backfill complete!');
    } catch (err) {
        console.error('Error during backfill:', err);
    } finally {
        pool.end();
    }
}

main();
