require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

const MOCK_RECORDS = [
  { id: '1', cooperative_name: 'BICOL CARDIOVASCULAR DIAGNOSTIC COOPERATIVE (BCDC)', cooperative_type: 'Health Service', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-03-15', deadline: '2024-04-30', file_url: '/dummy-file.pdf' },
  { id: '2', cooperative_name: 'BICOL CENTRAL STATION CREDIT COOPERATIVE (BICEST CC)', cooperative_type: 'Credit', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-03-20', deadline: '2024-04-30' },
  { id: '3', cooperative_name: 'BICOL ENTREPRENEURS AND TRADERS CREDIT COOPERATIVE (BETCO)', cooperative_type: 'Credit', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-04-01', deadline: '2024-04-30' },
  { id: '4', cooperative_name: 'BICOL MEDICAL CENTER G110 MULTIPURPOSE COOPERATIVE (BMC G110 MPC)', cooperative_type: 'Multipurpose', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-02-10', deadline: '2024-04-30' },
  { id: '5', cooperative_name: 'BICOL PAROLE AND PROBATION ADMINISTRATION EMPLOYEES CREDIT COOPERATIVE (BPPAECC)', cooperative_type: 'Credit', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-01-25', deadline: '2024-04-30' },
  { id: '6', cooperative_name: 'BICOL PRIME CREDIT COOPERATIVE (BPCC)', cooperative_type: 'Credit', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-03-05', deadline: '2024-04-30' },
  { id: '7', cooperative_name: 'BICOL TRANSPORT SERVICE COOPERATIVE FEDERATION (BITSCOMFED)', cooperative_type: 'Federation', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-04-10', deadline: '2024-04-30' },
  { id: '8', cooperative_name: 'BIKOLANAS AGRICULTURE COOPERATIVE (BIKOLANAS)', cooperative_type: 'Agriculture', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-03-28', deadline: '2024-04-30' },
  { id: '9', cooperative_name: 'CAMARINES SUR ELEMENTARY AND SECONDARY TEACHERS AND EMPLOYEES CREDIT COOPERATIVE (CASESTECCO)', cooperative_type: 'Credit', requirement_name: 'Newly Registered', status: 'compliant', submitted_date: '2024-11-15', deadline: '2025-04-30', file_url: '/dummy-file.pdf', reviewer_notes: 'Newly Registered' },
  { id: '10', cooperative_name: 'CAMARINES SUR MUSLIM COMMUNITY CONSUMERS COOPERATIVE', cooperative_type: 'Consumers', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-02-20', deadline: '2024-04-30' },
  { id: '11', cooperative_name: 'CAROLINA PANICUASON TRANSPORT COOPERATIVE (CAPATRANSCO)', cooperative_type: 'Transport', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-01-15', deadline: '2024-04-30' },
  { id: '12', cooperative_name: 'CASURECO II EMPLOYEES MULTIPURPOSE COOPERATIVE (CEMPC)', cooperative_type: 'Multipurpose', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-03-30', deadline: '2024-04-30' },
  { id: '13', cooperative_name: 'CENTRO PANGANIBAN DEL ROSARIO TRANSPORT COOPERATIVE (CEPDELTRANSCO)', cooperative_type: 'Transport', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-04-05', deadline: '2024-04-30' },
  { id: '14', cooperative_name: 'DEL ROSARIO PANGANIBAN CENTRO BAGONG PAG-ASA TRANSPORT COOPERATIVE (DCPC-BAPAGTRANSCO)', cooperative_type: 'Transport', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-02-28', deadline: '2024-04-30' },
  { id: '15', cooperative_name: 'D\'MARILLAC\'S MULTIPURPOSE AND TRANSPORT SERVICE COOPERATIVE', cooperative_type: 'Transport', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-03-12', deadline: '2024-04-30' },
  { id: '16', cooperative_name: 'FEDERATION OF AGRICULTURE COOPERATIVES IN CAMARINES SUR (FACCS)', cooperative_type: 'Federation', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-04-12', deadline: '2024-04-30' },
  { id: '17', cooperative_name: 'GOLDEN BLUE CONSUMERS COOPERATIVE', cooperative_type: 'Consumers', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-01-10', deadline: '2024-04-30' },
  { id: '18', cooperative_name: 'GOLDEN HIGHLANDS AGRICULTURE COOPERATIVE', cooperative_type: 'Agriculture', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-03-22', deadline: '2024-04-30' },
  { id: '19', cooperative_name: 'GREEN AND GOLD MULTIPURPOSE COOPERATIVE (GGMPC)', cooperative_type: 'Multipurpose', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-04-18', deadline: '2024-04-30' },
  { id: '20', cooperative_name: 'MAGSAYSAY ALLIED TRANSPORT COOPERATIVE (MATCO)', cooperative_type: 'Transport', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-02-14', deadline: '2024-04-30' },
  { id: '21', cooperative_name: 'METRO NAGA WATER DISTRICT EMPLOYEES MULTIPURPOSE COOPERATIVE (MNWD EMPC)', cooperative_type: 'Multipurpose', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-03-08', deadline: '2024-04-30' },
  { id: '22', cooperative_name: 'MOTHER SETON HOSPITAL EMPLOYEES CREDIT COOPERATIVE (MSH ECC)', cooperative_type: 'Credit', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-01-20', deadline: '2024-04-30' },
  { id: '23', cooperative_name: 'MULTI-AGRI-FOREST AND COMMUNITY DEVELOPMENT COOPERATIVE (MAFCOOP)', cooperative_type: 'Multipurpose', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-04-02', deadline: '2024-04-30' },
  { id: '24', cooperative_name: 'NAGA CALABANGA NORTHBOUND TRANSPORT COOPERATIVE', cooperative_type: 'Transport', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-03-18', deadline: '2024-04-30' },
  { id: '25', cooperative_name: 'NAGA CITY ALLIED TRANSPORT COOPERATIVE (NACIATRASCO)', cooperative_type: 'Transport', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-02-05', deadline: '2024-04-30' },
  { id: '26', cooperative_name: 'NAGA CITY EMPLOYEES & WORKERS COOPERATIVE (NACEMWCO)', cooperative_type: 'Credit', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-01-30', deadline: '2024-04-30' },
  { id: '27', cooperative_name: 'NAGA CITY MIGRANT WORKERS CONSUMERS COOPERATIVE (NACIMICCO)', cooperative_type: 'Consumers', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-04-20', deadline: '2024-04-30' },
  { id: '28', cooperative_name: 'NAGA CITY PEOPLE\'S MALL CREDIT COOPERATIVE (NACIPEMCCO)', cooperative_type: 'Credit', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-03-25', deadline: '2024-04-30' },
  { id: '29', cooperative_name: 'NAGA CITY VISUALLY IMPAIRED TRANSPORT COOPERATIVE (NACIVITRANSCO)', cooperative_type: 'Transport', requirement_name: 'Newly Registered', status: 'compliant', submitted_date: '2024-10-10', deadline: '2025-04-30', reviewer_notes: 'Newly Registered' },
  { id: '30', cooperative_name: 'NAGA COLLEGE FOUNDATION MULTIPURPOSE COOPERATIVE (NCF MPC)', cooperative_type: 'Multipurpose', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-02-22', deadline: '2024-04-30' },
  { id: '31', cooperative_name: 'NAGA IMAGING CENTER COOPERATIVE (NICC)', cooperative_type: 'Health Service', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-01-18', deadline: '2024-04-30' },
  { id: '32', cooperative_name: 'NAGA-DARAGA TRANSPORT COOPERATIVE (NADATRANSCO)', cooperative_type: 'Transport', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-03-10', deadline: '2024-04-30' },
  { id: '33', cooperative_name: 'PAGLAOM CREDIT COOPERATIVE (PAGLAOM CC)', cooperative_type: 'Credit', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-04-08', deadline: '2024-04-30' },
  { id: '34', cooperative_name: 'PEACE AND UNITY MULTIPURPOSE COOPERATIVE (PUMPCO)', cooperative_type: 'Multipurpose', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-02-12', deadline: '2024-04-30' },
  { id: '35', cooperative_name: 'PHILIPPINE FEDERATION OF CREDIT COOPERATIVES - BICOL (PFCCO - BICOL)', cooperative_type: 'Federation', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-01-28', deadline: '2024-04-30' },
  { id: '36', cooperative_name: 'PINAG-ISANG SAMAHAN TSUPER TRISEKEL OPERATOR SA NAGA DEVELOPMENT MULTIPURPOSE & TRANSPORT SERVICE COOPERATIVE (PISTTON)', cooperative_type: 'Multipurpose', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-03-14', deadline: '2024-04-30' },
  { id: '37', cooperative_name: 'SAN FELIPE NAGA TRANSPORT COOPERATIVE (SAFETRANSCO)', cooperative_type: 'Transport', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-04-15', deadline: '2024-04-30' },
  { id: '38', cooperative_name: 'SAN ISIDRO (SN) DEVELOPMENT COOPERATIVE (SIDECO)', cooperative_type: 'Multipurpose', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-02-26', deadline: '2024-04-30' },
  { id: '39', cooperative_name: 'ST. LOUISE COOPERATIVE', cooperative_type: 'Health Service', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-03-02', deadline: '2024-04-30' },
  { id: '40', cooperative_name: 'SUGAR PLANTERS AGRICULTURE COOPERATIVE', cooperative_type: 'Agriculture', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-01-08', deadline: '2024-04-30' },
  { id: '41', cooperative_name: 'TRADE CREDIT COOPERATIVE (TCC)', cooperative_type: 'Credit', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-04-05', deadline: '2024-04-30' },
  { id: '42', cooperative_name: 'UMASARIG AGRICULTURE COOPERATIVE (UMACOOP)', cooperative_type: 'Agriculture', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-02-16', deadline: '2024-04-30' },
  { id: '43', cooperative_name: 'UNIFIED LABOR SERVICE COOPERATIVE', cooperative_type: 'Labor Service', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-03-26', deadline: '2024-04-30' },
  { id: '44', cooperative_name: 'USWAG FARMERS AGRICULTURE COOPERATIVE (UFAC)', cooperative_type: 'Agriculture', requirement_name: 'Newly Registered', status: 'compliant', submitted_date: '2024-09-15', deadline: '2025-04-30', reviewer_notes: 'Newly Registered' }
];

async function restore() {
  try {
    console.log('Restoring records...');
    
    // Convert to neon tagged template literals format properly
    await sql`DELETE FROM compliance_records`;
    
    for (const record of MOCK_RECORDS) {
      await sql`
         INSERT INTO compliance_records 
         (cooperative_name, cooperative_type, requirement_name, status, submitted_date, deadline, reviewer_notes, file_url)
         VALUES (
           ${record.cooperative_name}, 
           ${record.cooperative_type}, 
           ${record.requirement_name}, 
           ${record.status}, 
           ${record.submitted_date}, 
           ${record.deadline},
           ${record.reviewer_notes || null},
           ${record.file_url || null}
         )
      `;
    }
    
    const finalCount = await sql`SELECT COUNT(*) as count FROM compliance_records`;
    console.log('Successfully restored ' + finalCount[0].count + ' records! Target: ' + MOCK_RECORDS.length);
  } catch(err) {
    console.error('Error during restoration:', err);
  }
}

restore();
