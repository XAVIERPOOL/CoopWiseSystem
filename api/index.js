import express from 'express';
import cors from 'cors';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Database connection
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // SSL is required for Neon/Supabase in production, but we disable it for local dev if needed
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Database connected successfully');
  }
});

// ===== PROFILES API =====

app.get('/api/profiles', async (req, res) => {
  try {
    // Arangged the profiles name to first name middle name last name order//

    const result = await pool.query(`
      SELECT *, 
      TRIM(BOTH ' ' FROM CONCAT(first_name, ' ', middle_name, ' ', last_name)) as full_name 
      FROM profiles 
      ORDER BY last_name, first_name
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching profiles:', error);
    res.status(500).json({ error: 'Failed to fetch profiles' });
  }
});

app.get('/api/profiles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT *, 
      TRIM(BOTH ' ' FROM CONCAT(first_name, ' ', middle_name, ' ', last_name)) as full_name 
      FROM profiles 
      WHERE id = $1
    `, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// ===== TRAININGS API =====

app.get('/api/trainings', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM trainings ORDER BY start_date DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching trainings:', error);
    res.status(500).json({ error: 'Failed to fetch trainings' });
  }
});

app.get('/api/trainings/with-metrics', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*,
        COUNT(DISTINCT tr.id) as registered
      FROM trainings t
      LEFT JOIN training_registrations tr ON t.id = tr.training_id
      GROUP BY t.id
      ORDER BY t.start_date DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching trainings with metrics:', error);
    res.status(500).json({ error: 'Failed to fetch trainings with metrics' });
  }
});

app.get('/api/trainings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM trainings WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Training not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching training:', error);
    res.status(500).json({ error: 'Failed to fetch training' });
  }
});

app.post('/api/trainings', async (req, res) => {
  try {
    const { training_id, title, topic, date, start_date, end_date, time, venue, speaker, capacity, status } = req.body;
    const result = await pool.query(
      `INSERT INTO trainings (training_id, title, topic, date, start_date, end_date, time, venue, speaker, capacity, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [training_id, title, topic, date, start_date, end_date, time, venue, speaker, capacity, status || 'upcoming']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating training:', error);
    res.status(500).json({ error: 'Failed to create training' });
  }
});

app.put('/api/trainings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, topic, date, start_date, end_date, time, venue, speaker, capacity, status } = req.body;
    const result = await pool.query(
      `UPDATE trainings
       SET title = $1, topic = $2, date = $3, start_date = $4, end_date = $5, time = $6,
           venue = $7, speaker = $8, capacity = $9, status = $10, updated_at = NOW()
       WHERE id = $11
       RETURNING *`,
      [title, topic, date, start_date, end_date, time, venue, speaker, capacity, status, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Training not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating training:', error);
    res.status(500).json({ error: 'Failed to update training' });
  }
});

app.delete('/api/trainings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM trainings WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Training not found' });
    }
    res.json({ message: 'Training deleted successfully' });
  } catch (error) {
    console.error('Error deleting training:', error);
    res.status(500).json({ error: 'Failed to delete training' });
  }
});

// ===== TRAINING REGISTRATIONS API =====

app.get('/api/training-registrations', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT tr.*, TRIM(BOTH '' FROM CONCAT(p.first_name, ' '. p.middle_name, ' ', p.last_name)) as officer_name, t.title as training_title
      FROM training_registrations tr
      LEFT JOIN profiles p ON tr.officer_id = p.id
      LEFT JOIN trainings t ON tr.training_id = t.id
      ORDER BY tr.registered_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching training registrations:', error);
    res.status(500).json({ error: 'Failed to fetch training registrations' });
  }
});

app.get('/api/training-registrations/training/:training_id', async (req, res) => {
  try {
    const { training_id } = req.params;
    const result = await pool.query(`
      SELECT tr.*, TRIM(BOTH ' ' FROM CONCAT(p.first_name, ' ', p.middle_name, ' ', p.last_name)) as full_name, p.username, p.position, p.cooperative
      FROM training_registrations tr
      JOIN profiles p ON tr.officer_id = p.id
      WHERE tr.training_id = $1
    `, [training_id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching training registrations:', error);
    res.status(500).json({ error: 'Failed to fetch training registrations' });
  }
});

app.post('/api/training-registrations', async (req, res) => {
  try {
    const { training_id, officer_id } = req.body;
    const result = await pool.query(
      `INSERT INTO training_registrations (training_id, officer_id)
       VALUES ($1, $2)
       ON CONFLICT (training_id, officer_id) DO NOTHING
       RETURNING *`,
      [training_id, officer_id]
    );
    res.status(201).json(result.rows[0] || { message: 'Already registered' });
  } catch (error) {
    console.error('Error creating registration:', error);
    res.status(500).json({ error: 'Failed to create registration' });
  }
});

app.post('/api/training-registrations/enroll-with-companions', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { training_id, officer_id, companions } = req.body;
    
    // Register the officer
    await client.query(
      `INSERT INTO training_registrations (training_id, officer_id)
       VALUES ($1, $2)
       ON CONFLICT (training_id, officer_id) DO NOTHING`,
      [training_id, officer_id]
    );
    
    // Register companions if any
    if (companions && companions.length > 0) {
      for (const companion of companions) {
        await client.query(
          `INSERT INTO companion_registrations (training_id, officer_id, companion_name, companion_email, companion_phone, companion_position)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [training_id, officer_id, companion.name, companion.email, companion.phone || null, companion.position || null]
        );
      }
    }
    
    await client.query('COMMIT');
    res.status(201).json({ message: 'Enrollment successful', companions_registered: companions?.length || 0 });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error enrolling with companions:', error);
    res.status(500).json({ error: 'Failed to enroll with companions' });
  } finally {
    client.release();
  }
});

// ===== ATTENDANCE API =====

app.get('/api/attendance', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*, TRIM(BOTH ' ' FROM CONCAT(p.first_name, ' ', p.middle_name, ' ', p.last_name)) as officer_name, t.title as training_title
      FROM attendance a
      LEFT JOIN profiles p ON a.officer_id = p.id
      LEFT JOIN trainings t ON a.training_id = t.id
      ORDER BY a.recorded_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

app.get('/api/attendance/officer/:officer_id', async (req, res) => {
  try {
    const { officer_id } = req.params;
    const result = await pool.query(`
      SELECT a.*, t.title, t.topic, t.date, t.venue
      FROM attendance a
      JOIN trainings t ON a.training_id = t.id
      WHERE a.officer_id = $1
      ORDER BY a.recorded_at DESC
    `, [officer_id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching officer attendance:', error);
    res.status(500).json({ error: 'Failed to fetch officer attendance' });
  }
});

app.post('/api/attendance', async (req, res) => {
  try {
    const { officer_id, training_id, recorded_by, method, check_in_time } = req.body;
    
    // Convert ISO timestamp to time format (HH:MM:SS) for the database
    let timeOnly = null;
    if (check_in_time) {
      try {
        const date = new Date(check_in_time);
        timeOnly = date.toTimeString().split(' ')[0]; // Extract "HH:MM:SS"
      } catch (e) {
        timeOnly = null;
      }
    }
    
    const result = await pool.query(
      `INSERT INTO attendance (officer_id, training_id, recorded_by, method, check_in_time)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (officer_id, training_id) DO UPDATE
       SET method = EXCLUDED.method, check_in_time = EXCLUDED.check_in_time, recorded_at = NOW()
       RETURNING *`,
      [officer_id, training_id, recorded_by, method, timeOnly]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error recording attendance:', error);
    res.status(500).json({ error: 'Failed to record attendance' });
  }
});

// ===== COMPANION REGISTRATIONS API =====

app.get('/api/companion-registrations', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT cr.*, 
      TRIM(BOTH ' ' FROM CONCAT(p.first_name, ' ', p.middle_name, ' ', p.last_name)) as officer_name, 
      t.title as training_title
      FROM companion_registrations cr
      LEFT JOIN profiles p ON cr.officer_id = p.id
      LEFT JOIN trainings t ON cr.training_id = t.id
      ORDER BY cr.registered_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching companion registrations:', error);
    res.status(500).json({ error: 'Failed to fetch companion registrations' });
  }
});

app.post('/api/companion-registrations', async (req, res) => {
  try {
    const { training_id, officer_id, companion_name, companion_email, companion_phone, companion_position } = req.body;
    const result = await pool.query(
      `INSERT INTO companion_registrations (training_id, officer_id, companion_name, companion_email, companion_phone, companion_position)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [training_id, officer_id, companion_name, companion_email, companion_phone, companion_position]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating companion registration:', error);
    res.status(500).json({ error: 'Failed to create companion registration' });
  }
});

app.get('/api/companion-registrations/training/:trainingId', async (req, res) => {
  try {
    const { trainingId } = req.params;
    const result = await pool.query(`
      SELECT cr.*, 
      TRIM(BOTH ' ' FROM CONCAT(p.first_name, ' ', p.middle_name, ' ', p.last_name)) as officer_name, 
      t.title as training_title
      FROM companion_registrations cr
      LEFT JOIN profiles p ON cr.officer_id = p.id
      LEFT JOIN trainings t ON cr.training_id = t.id
      WHERE cr.training_id = $1
      ORDER BY cr.registered_at DESC
    `, [trainingId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching companion registrations for training:', error);
    res.status(500).json({ error: 'Failed to fetch companion registrations' });
  }
});

// ===== TRAINING SUGGESTIONS API =====

app.get('/api/training-suggestions', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT ts.*, 
      TRIM(BOTH ' ' FROM CONCAT(p.first_name, ' ', p.middle_name, ' ', p.last_name)) as officer_name
      FROM training_suggestions ts
      LEFT JOIN profiles p ON ts.officer_id = p.id
      ORDER BY ts.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching training suggestions:', error);
    res.status(500).json({ error: 'Failed to fetch training suggestions' });
  }
});

app.post('/api/training-suggestions', async (req, res) => {
  try {
    const { title, description, category, preferred_date, justification, priority, officer_id } = req.body;
    const result = await pool.query(
      `INSERT INTO training_suggestions (title, description, category, preferred_date, justification, priority, officer_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [title, description, category, preferred_date, justification, priority, officer_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating training suggestion:', error);
    res.status(500).json({ error: 'Failed to create training suggestion' });
  }
});

app.patch('/api/training-suggestions/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['pending', 'approved', 'implemented', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be one of: pending, approved, implemented, rejected' });
    }
    
    const result = await pool.query(
      `UPDATE training_suggestions SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Training suggestion not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating training suggestion status:', error);
    res.status(500).json({ error: 'Failed to update training suggestion status' });
  }
});

app.post('/api/training-suggestions/:id/implement', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { venue, speaker, capacity, start_date, end_date, time } = req.body;
    
    const suggestionResult = await client.query(
      'SELECT * FROM training_suggestions WHERE id = $1',
      [id]
    );
    
    if (suggestionResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Training suggestion not found' });
    }
    
    const suggestion = suggestionResult.rows[0];
    const trainingId = `TRN-${Date.now().toString(36).toUpperCase()}`;
    
    const today = new Date().toISOString().split('T')[0];
    const effectiveStartDate = (start_date && start_date.trim()) || suggestion.preferred_date || today;
    const effectiveEndDate = (end_date && end_date.trim()) || effectiveStartDate;
    
    const effectiveVenue = (venue && venue.trim()) || 'TBD';
    const effectiveSpeaker = (speaker && speaker.trim()) || 'TBD';
    const effectiveCapacity = capacity || 50;
    const effectiveTime = (time && time.trim()) || '09:00';
    
    const trainingResult = await client.query(
      `INSERT INTO trainings (training_id, title, topic, date, start_date, end_date, time, venue, speaker, capacity, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'upcoming')
       RETURNING *`,
      [
        trainingId,
        suggestion.title,
        suggestion.category,
        effectiveStartDate,
        effectiveStartDate,
        effectiveEndDate,
        effectiveTime,
        effectiveVenue,
        effectiveSpeaker,
        effectiveCapacity
      ]
    );
    
    await client.query(
      `UPDATE training_suggestions SET status = 'implemented' WHERE id = $1`,
      [id]
    );
    
    await client.query('COMMIT');
    
    res.status(201).json({
      message: 'Training created successfully from suggestion',
      training: trainingResult.rows[0],
      suggestion: { ...suggestion, status: 'implemented' }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error implementing training suggestion:', error);
    res.status(500).json({ error: 'Failed to implement training suggestion' });
  } finally {
    client.release();
  }
});

// ===== COOPERATIVES API =====

app.get('/api/cooperatives', async (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM cooperatives';
    let params = [];
    
    if (status) {
      query += ' WHERE status = $1';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching cooperatives:', error);
    res.status(500).json({ error: 'Failed to fetch cooperatives' });
  }
});

app.get('/api/cooperatives/summary', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'approved') as approved,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
        COUNT(*) FILTER (WHERE status = 'needs_resubmission') as needs_resubmission
      FROM cooperatives
    `);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching cooperatives summary:', error);
    res.status(500).json({ error: 'Failed to fetch cooperatives summary' });
  }
});

app.get('/api/cooperatives/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM cooperatives WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cooperative not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching cooperative:', error);
    res.status(500).json({ error: 'Failed to fetch cooperative' });
  }
});

app.post('/api/cooperatives', async (req, res) => {
  try {
    const {
      name, type, address, city, province, region, registration_number,
      cda_registration_date, tin, contact_person, contact_email, contact_phone,
      submitted_documents
    } = req.body;
    
    const coopId = `COOP-${Date.now().toString(36).toUpperCase()}`;
    
    const result = await pool.query(
      `INSERT INTO cooperatives (coop_id, name, type, address, city, province, region, 
        registration_number, cda_registration_date, tin, contact_person, contact_email, 
        contact_phone, submitted_documents, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'pending')
       RETURNING *`,
      [coopId, name, type, address, city, province, region, registration_number,
       cda_registration_date, tin, contact_person, contact_email, contact_phone,
       JSON.stringify(submitted_documents || [])]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating cooperative:', error);
    res.status(500).json({ error: 'Failed to create cooperative' });
  }
});

app.put('/api/cooperatives/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, type, address, city, province, region, registration_number,
      cda_registration_date, tin, contact_person, contact_email, contact_phone,
      submitted_documents
    } = req.body;
    
    const result = await pool.query(
      `UPDATE cooperatives SET
        name = $1, type = $2, address = $3, city = $4, province = $5, region = $6,
        registration_number = $7, cda_registration_date = $8, tin = $9, 
        contact_person = $10, contact_email = $11, contact_phone = $12,
        submitted_documents = $13, updated_at = NOW()
       WHERE id = $14
       RETURNING *`,
      [name, type, address, city, province, region, registration_number,
       cda_registration_date, tin, contact_person, contact_email, contact_phone,
       JSON.stringify(submitted_documents || []), id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cooperative not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating cooperative:', error);
    res.status(500).json({ error: 'Failed to update cooperative' });
  }
});

app.patch('/api/cooperatives/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, review_notes, reviewed_by } = req.body;
    
    const validStatuses = ['pending', 'approved', 'rejected', 'needs_resubmission'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const result = await pool.query(
      `UPDATE cooperatives SET 
        status = $1, review_notes = $2, reviewed_by = $3, reviewed_at = NOW(), updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [status, review_notes, reviewed_by, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cooperative not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating cooperative status:', error);
    res.status(500).json({ error: 'Failed to update cooperative status' });
  }
});

app.delete('/api/cooperatives/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM cooperatives WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cooperative not found' });
    }
    res.json({ message: 'Cooperative deleted successfully' });
  } catch (error) {
    console.error('Error deleting cooperative:', error);
    res.status(500).json({ error: 'Failed to delete cooperative' });
  }
});

// ===== MEMBERS API =====

app.get('/api/members', async (req, res) => {
  try {
    const { status, cooperative_id } = req.query;
    let query = `
      SELECT m.*, c.name as cooperative_name 
      FROM members m 
      LEFT JOIN cooperatives c ON m.cooperative_id = c.id
      WHERE 1=1
    `;
    let params = [];
    let paramIndex = 1;
    
    if (status) {
      query += ` AND m.status = $${paramIndex++}`;
      params.push(status);
    }
    if (cooperative_id) {
      query += ` AND m.cooperative_id = $${paramIndex++}`;
      params.push(cooperative_id);
    }
    
    query += ' ORDER BY m.created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching members:', error);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

app.get('/api/members/summary', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'approved') as approved,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected
      FROM members
    `);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching members summary:', error);
    res.status(500).json({ error: 'Failed to fetch members summary' });
  }
});

app.get('/api/members/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT m.*, c.name as cooperative_name 
      FROM members m 
      LEFT JOIN cooperatives c ON m.cooperative_id = c.id
      WHERE m.id = $1
    `, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching member:', error);
    res.status(500).json({ error: 'Failed to fetch member' });
  }
});

app.post('/api/members', async (req, res) => {
  try {
    const {
      cooperative_id, first_name, middle_name, last_name, suffix, date_of_birth,
      gender, civil_status, address, city, province, email, phone, occupation,
      tin, photo_url, documents
    } = req.body;
    
    const memberId = `MBR-${Date.now().toString(36).toUpperCase()}`;
    
    const result = await pool.query(
      `INSERT INTO members (member_id, cooperative_id, first_name, middle_name, last_name, 
        suffix, date_of_birth, gender, civil_status, address, city, province, email, phone, 
        occupation, tin, photo_url, documents, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, 'pending')
       RETURNING *`,
      [memberId, cooperative_id, first_name, middle_name, last_name, suffix, date_of_birth,
       gender, civil_status, address, city, province, email, phone, occupation, tin, photo_url,
       JSON.stringify(documents || [])]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating member:', error);
    res.status(500).json({ error: 'Failed to create member' });
  }
});

app.put('/api/members/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      cooperative_id, first_name, middle_name, last_name, suffix, date_of_birth,
      gender, civil_status, address, city, province, email, phone, occupation,
      tin, photo_url, documents
    } = req.body;
    
    const result = await pool.query(
      `UPDATE members SET
        cooperative_id = $1, first_name = $2, middle_name = $3, last_name = $4, suffix = $5,
        date_of_birth = $6, gender = $7, civil_status = $8, address = $9, city = $10, 
        province = $11, email = $12, phone = $13, occupation = $14, tin = $15, 
        photo_url = $16, documents = $17, updated_at = NOW()
       WHERE id = $18
       RETURNING *`,
      [cooperative_id, first_name, middle_name, last_name, suffix, date_of_birth,
       gender, civil_status, address, city, province, email, phone, occupation, tin,
       photo_url, JSON.stringify(documents || []), id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating member:', error);
    res.status(500).json({ error: 'Failed to update member' });
  }
});

app.patch('/api/members/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, review_notes, reviewed_by, membership_date } = req.body;
    
    const validStatuses = ['pending', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const result = await pool.query(
      `UPDATE members SET 
        status = $1, review_notes = $2, reviewed_by = $3, reviewed_at = NOW(),
        membership_date = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [status, review_notes, reviewed_by, status === 'approved' ? membership_date || new Date().toISOString().split('T')[0] : null, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating member status:', error);
    res.status(500).json({ error: 'Failed to update member status' });
  }
});

app.delete('/api/members/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM members WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }
    res.json({ message: 'Member deleted successfully' });
  } catch (error) {
    console.error('Error deleting member:', error);
    res.status(500).json({ error: 'Failed to delete member' });
  }
});

// ===== COMPLIANCE RECORDS API =====

app.get('/api/compliance', async (req, res) => {
  try {
    const { status, cooperative_id, year } = req.query;
    let query = `
      SELECT cr.*, c.name as cooperative_name, c.coop_id
      FROM compliance_records cr
      LEFT JOIN cooperatives c ON cr.cooperative_id = c.id
      WHERE 1=1
    `;
    let params = [];
    let paramIndex = 1;
    
    if (status) {
      query += ` AND cr.status = $${paramIndex++}`;
      params.push(status);
    }
    if (cooperative_id) {
      query += ` AND cr.cooperative_id = $${paramIndex++}`;
      params.push(cooperative_id);
    }
    if (year) {
      query += ` AND cr.year = $${paramIndex++}`;
      params.push(year);
    }
    
    query += ' ORDER BY cr.due_date ASC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching compliance records:', error);
    res.status(500).json({ error: 'Failed to fetch compliance records' });
  }
});

app.get('/api/compliance/summary', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'compliant') as compliant,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'non_compliant') as non_compliant,
        COUNT(*) FILTER (WHERE status = 'overdue') as overdue,
        COUNT(*) FILTER (WHERE due_date < CURRENT_DATE AND status NOT IN ('compliant', 'submitted')) as past_due
      FROM compliance_records
    `);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching compliance summary:', error);
    res.status(500).json({ error: 'Failed to fetch compliance summary' });
  }
});

app.get('/api/compliance/cooperative/:cooperative_id', async (req, res) => {
  try {
    const { cooperative_id } = req.params;
    const result = await pool.query(`
      SELECT cr.*, c.name as cooperative_name
      FROM compliance_records cr
      LEFT JOIN cooperatives c ON cr.cooperative_id = c.id
      WHERE cr.cooperative_id = $1
      ORDER BY cr.due_date ASC
    `, [cooperative_id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching cooperative compliance:', error);
    res.status(500).json({ error: 'Failed to fetch cooperative compliance' });
  }
});

app.get('/api/compliance/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT cr.*, c.name as cooperative_name
      FROM compliance_records cr
      LEFT JOIN cooperatives c ON cr.cooperative_id = c.id
      WHERE cr.id = $1
    `, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Compliance record not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching compliance record:', error);
    res.status(500).json({ error: 'Failed to fetch compliance record' });
  }
});

app.post('/api/compliance', async (req, res) => {
  try {
    const {
      cooperative_id, requirement_type, requirement_name, description,
      due_date, year, documents
    } = req.body;
    
    const result = await pool.query(
      `INSERT INTO compliance_records (cooperative_id, requirement_type, requirement_name, 
        description, due_date, year, documents, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
       RETURNING *`,
      [cooperative_id, requirement_type, requirement_name, description, due_date,
       year || new Date().getFullYear(), JSON.stringify(documents || [])]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating compliance record:', error);
    res.status(500).json({ error: 'Failed to create compliance record' });
  }
});

app.put('/api/compliance/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      requirement_type, requirement_name, description, due_date, 
      submitted_date, year, documents
    } = req.body;
    
    const result = await pool.query(
      `UPDATE compliance_records SET
        requirement_type = $1, requirement_name = $2, description = $3, due_date = $4,
        submitted_date = $5, year = $6, documents = $7, updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [requirement_type, requirement_name, description, due_date, submitted_date,
       year, JSON.stringify(documents || []), id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Compliance record not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating compliance record:', error);
    res.status(500).json({ error: 'Failed to update compliance record' });
  }
});

app.patch('/api/compliance/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reviewer_notes, reviewed_by, submitted_date } = req.body;
    
    const validStatuses = ['pending', 'submitted', 'compliant', 'non_compliant', 'overdue'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const result = await pool.query(
      `UPDATE compliance_records SET 
        status = $1, reviewer_notes = $2, reviewed_by = $3, reviewed_at = NOW(),
        submitted_date = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [status, reviewer_notes, reviewed_by, submitted_date, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Compliance record not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating compliance status:', error);
    res.status(500).json({ error: 'Failed to update compliance status' });
  }
});

app.delete('/api/compliance/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM compliance_records WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Compliance record not found' });
    }
    res.json({ message: 'Compliance record deleted successfully' });
  } catch (error) {
    console.error('Error deleting compliance record:', error);
    res.status(500).json({ error: 'Failed to delete compliance record' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'API server is running' });
});

// Vercel Handler - Only listen on port if NOT in production (Vercel handles listening)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`API server running on port ${PORT}`);
  });
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  pool.end(() => {
    process.exit(0);
  });
});

// Export the app for Vercel Serverless Functions
export default app;