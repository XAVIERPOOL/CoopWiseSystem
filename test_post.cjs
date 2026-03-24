async function run() {
  try {
    const res = await fetch('http://localhost:3001/api/compliance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cooperative_name: "Test Coop",
        cooperative_type: "Test",
        requirement_name: "Mayors Permit",
        status: "pending",
        reviewed_by: "11111111-1111-1111-1111-111111111111",
        submitted_date: new Date().toISOString()
      })
    });
    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Body:', text);
  } catch (e) {
    console.error('Fetch error:', e);
  }
}
run();
