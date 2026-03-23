require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

const INITIAL_RECORDS = [
  { cooperative_name: 'BICOL CARDIOVASCULAR DIAGNOSTIC COOPERATIVE (BCDC)', cooperative_type: 'Health Service', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-03-15', deadline: '2024-04-30' },
  { cooperative_name: 'BICOL CENTRAL STATION CREDIT COOPERATIVE (BICEST CC)', cooperative_type: 'Credit', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-03-20', deadline: '2024-04-30' },
  { cooperative_name: 'BICOL ENTREPRENEURS AND TRADERS CREDIT COOPERATIVE (BETCO)', cooperative_type: 'Credit', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-04-01', deadline: '2024-04-30' },
  { cooperative_name: 'BICOL MEDICAL CENTER G110 MULTIPURPOSE COOPERATIVE (BMC G110 MPC)', cooperative_type: 'Multipurpose', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-02-10', deadline: '2024-04-30' },
  { cooperative_name: 'BICOL PRIME CREDIT COOPERATIVE (BPCC)', cooperative_type: 'Credit', requirement_name: 'Certificate of Compliance', status: 'pending', submitted_date: '2024-03-05', deadline: '2024-04-30' },
  { cooperative_name: 'BIKOLANAS AGRICULTURE COOPERATIVE (BIKOLANAS)', cooperative_type: 'Agriculture', requirement_name: 'Certificate of Compliance', status: 'non-compliant', submitted_date: '2024-03-28', deadline: '2024-04-30' },
  { cooperative_name: 'CAMARINES SUR MUSLIM COMMUNITY CONSUMERS COOPERATIVE', cooperative_type: 'Consumers', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-02-20', deadline: '2024-04-30' },
  { cooperative_name: 'CAROLINA PANICUASON TRANSPORT COOPERATIVE (CAPATRANSCO)', cooperative_type: 'Transport', requirement_name: 'Certificate of Compliance', status: 'pending', submitted_date: '2024-01-15', deadline: '2024-04-30' },
  { cooperative_name: 'CENTRO PANGANIBAN DEL ROSARIO TRANSPORT COOPERATIVE (CEPDELTRANSCO)', cooperative_type: 'Transport', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-04-05', deadline: '2024-04-30' },
  { cooperative_name: 'FEDERATION OF AGRICULTURE COOPERATIVES (FACCS)', cooperative_type: 'Federation', requirement_name: 'Certificate of Compliance', status: 'non-compliant', submitted_date: '2024-04-12', deadline: '2024-04-30' },
  { cooperative_name: 'UNIFIED LABOR SERVICE COOPERATIVE', cooperative_type: 'Labor Service', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-03-26', deadline: '2024-04-30' },
];

async function run() {
  try {
    console.log('Creating compliance_records table...');
    await sql(`
      CREATE TABLE IF NOT EXISTS compliance_records (
        id SERIAL PRIMARY KEY,
        cooperative_name TEXT NOT NULL,
        cooperative_type TEXT,
        requirement_name TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        submitted_date TIMESTAMP,
        deadline TIMESTAMP,
        reviewer_notes TEXT,
        file_url TEXT,
        reviewed_by INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Check if empty before seeding
    const res = await sql('SELECT COUNT(*) as count FROM compliance_records');
    if (parseInt(res[0].count) === 0) {
      console.log('Seeding initial compliance records...');
      for (const record of INITIAL_RECORDS) {
        await sql(
          `INSERT INTO compliance_records 
           (cooperative_name, cooperative_type, requirement_name, status, submitted_date, deadline)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [record.cooperative_name, record.cooperative_type, record.requirement_name, record.status, record.submitted_date, record.deadline]
        );
      }
      console.log('Seeded successfully!');
    } else {
      console.log('Records already exist, skipping seed.');
    }
    
    console.log('Setup finished.');
  } catch (err) {
    console.error('Error during setup:', err);
  }
}

run();
