const {
    Pool
} = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/coopwise_internal',
});

async function main() {
    try {
        console.log('Testing the auto-create officer logic...');

        // Find an existing approved cooperative to link to
        const coopRes = await pool.query("SELECT id, name FROM cooperatives WHERE status = 'approved' LIMIT 1");
        if (coopRes.rows.length === 0) {
            console.log('No approved cooperatives found.');
            return;
        }
        const coop = coopRes.rows[0];
        console.log('Using cooperative:', coop.name);

        // Create a mock pending member who is an officer
        const testEmail = `test.officer.${Date.now()}@example.com`;
        const insertRes = await pool.query(`
      INSERT INTO members (
        cooperative_id, first_name, last_name, role, status, email, phone, city, address
      ) VALUES (
        $1, 'Testy', 'McOfficer', 'President', 'pending', $2, '1234567890', 'Test City', 'Test Address'
      ) RETURNING id
    `, [coop.id, testEmail]);

        const newMemberId = insertRes.rows[0].id;
        console.log('Created pending officer member with ID:', newMemberId);

        // Now, let's call the logic that the PATCH /api/members/:id/status endpoint uses
        // We'll mimic the exact DB queries from api/index.js
        let status = 'approved';
        let oldStatus = 'pending';
        let id = newMemberId;

        let generatedCredentials = null;

        if (status === 'approved' && oldStatus !== 'approved') {
            const memberRes = await pool.query('SELECT member_id, first_name, last_name, email, role, cooperative_id FROM members WHERE id = $1', [id]);
            const memberData = memberRes.rows[0];

            if (memberData && memberData.role !== 'Regular Member' && memberData.role !== 'Representative') {
                const coopRes2 = await pool.query('SELECT name FROM cooperatives WHERE id = $1', [memberData.cooperative_id]);
                const coopName = coopRes2.rows[0] ? .name || 'Unknown Cooperative';

                const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
                let randomPassword = "";
                for (let i = 0; i < 8; i++) {
                    randomPassword += chars.charAt(Math.floor(Math.random() * chars.length));
                }

                const usernameBase = memberData.email || memberData.member_id || `testuser_${Date.now()}`;

                await pool.query('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)');

                const existingProfile = await pool.query('SELECT id FROM profiles WHERE username = $1', [usernameBase]);

                if (existingProfile.rows.length === 0) {
                    await pool.query(
                        `INSERT INTO profiles (username, first_name, last_name, role, cooperative, position, password_hash)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                        [usernameBase, memberData.first_name, memberData.last_name, 'officer', coopName, memberData.role, randomPassword]
                    );
                    generatedCredentials = {
                        username: usernameBase,
                        password: randomPassword
                    };
                    console.log('SUCCESS! Profile created with credentials:', generatedCredentials);
                } else {
                    console.log('Profile already exists!');
                }
            } else {
                console.log('Member was not an officer:', memberData.role);
            }
        }

    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        await pool.end();
    }
}

main();