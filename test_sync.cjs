require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

async function testSync() {
  const sql = neon(process.env.DATABASE_URL);
  try {
    const id = 'e7d8b3d7-7b9f-4c3c-b965-f52c7e97a047';
    console.log("Checking cooperative:", id);
    const oldRes = await sql`SELECT name, type, status, submitted_documents FROM cooperatives WHERE id = ${id}`;
    const oldCoop = oldRes[0];
    
    let docs = [];
    if (typeof oldCoop.submitted_documents === 'string') {
      try { docs = JSON.parse(oldCoop.submitted_documents); } catch(e){ console.log("JSON parse error"); }
    } else {
      docs = oldCoop.submitted_documents || [];
    }
    
    console.log("Docs array length:", docs.length);
    if(docs.length > 0) console.log("First doc type:", docs[0].type);

    const getBase64 = (type) => docs.find(d => d.type === type)?.data_url || null;

    const recordsToCreate = [
      { reqName: 'Certificate of Compliance', file: getBase64('cda_certificate') },
      { reqName: "Mayor's Permit", file: getBase64('mayors_permit') },
      { reqName: 'CAPR', file: getBase64('capr') }
    ];

    for (const rec of recordsToCreate) {
      console.log(`Found file for ${rec.reqName}:`, !!rec.file);
      if (rec.file) {
        console.log(`Inserting ${rec.reqName}`);
        try {
          await sql`
            INSERT INTO compliance_records (cooperative_name, cooperative_type, requirement_name, status, submitted_date, file_url)
            VALUES (${oldCoop.name}, ${oldCoop.type || 'Uncategorized'}, ${rec.reqName}, 'compliant', NOW(), ${rec.file})
          `;
          console.log(`Successfully inserted ${rec.reqName}`);
        } catch (err) {
          console.error(`Error inserting ${rec.reqName}:`, err.message);
        }
      }
    }
  } catch(e) {
    console.error("Outer error:", e);
  }
}
testSync();
