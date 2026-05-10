import express from 'express';
import cors from 'cors';
import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
// Increased limit to 50mb to support base64-encoded file uploads stored as JSON
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Database connection using Neon's Serverless WebSockets to bypass Vercel TCP drops
console.log('DATABASE_URL is defined:', !!process.env.DATABASE_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);

// Using the pure connection string. Neon serverless handles pooling and SSL natively over WSS
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

let dbConnectionError = null;

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    dbConnectionError = { message: err.message, code: err.code };
    console.error('Database connection error in Neon serverless pool:', err.message, err.code);
  } else {
    console.log('Database connected successfully via Neon Serverless');
  }
});

// Adding a diagnostic endpoint strictly to see the connection state in prod
app.get(['/api/debug-connection', '/debug-connection'], (req, res) => {
   res.json({
       hasUrl: !!process.env.DATABASE_URL,
       nodeEnv: process.env.NODE_ENV,
       error: dbConnectionError,
       timestamp: new Date().toISOString(),
       path: req.path
   });
});

// ===== PROFILES API =====

app.get('/api/profiles', async (req, res) => {
  try {
    // UPDATED: Construct full_name and sort by last_name
    const result = await pool.query(`
      SELECT *, 
      TRIM(BOTH ' ' FROM CONCAT(first_name, ' ', middle_name, ' ', last_name)) as full_name 
      FROM profiles 
      ORDER BY last_name, first_name
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching profiles:', error);
    res.status(500).json({ 
        error: 'Failed to fetch profiles',
        details: error.message,
        hasUrl: !!process.env.DATABASE_URL
    });
  }
});

app.get('/api/profiles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // UPDATED: Construct full_name
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
    // Auto-update past trainings to completed
    await pool.query(`
      UPDATE trainings 
      SET status = 'completed' 
      WHERE (
        (end_date IS NOT NULL AND end_date < CURRENT_DATE) 
        OR 
        (end_date IS NULL AND start_date IS NOT NULL AND start_date < CURRENT_DATE)
      )
      AND status IN ('upcoming', 'ongoing')
    `);

    const result = await pool.query('SELECT * FROM trainings ORDER BY start_date DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching trainings:', error);
    res.status(500).json({ error: 'Failed to fetch trainings' });
  }
});

app.get('/api/trainings/with-metrics', async (req, res) => {
  try {
    // Auto-update past trainings to completed
    await pool.query(`
      UPDATE trainings 
      SET status = 'completed' 
      WHERE (
        (end_date IS NOT NULL AND end_date < CURRENT_DATE) 
        OR 
        (end_date IS NULL AND start_date IS NOT NULL AND start_date < CURRENT_DATE)
      )
      AND status IN ('upcoming', 'ongoing')
    `);

    const result = await pool.query(`
      SELECT t.*,
        COUNT(DISTINCT tr.id) as registered,
        COUNT(DISTINCT att.id) as attended
      FROM trainings t
      LEFT JOIN training_registrations tr ON t.id = tr.training_id
      LEFT JOIN attendance att ON t.id = att.training_id
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
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { training_id, title, topic, date, start_date, end_date, time, venue, speaker, capacity, status, created_by } = req.body;
    
    // Ensure capacity is an integer
    const capacityInt = parseInt(capacity) || 0;
    
    // Handle time: ensure it's null if empty string
    const timeValue = time && time.trim() !== '' ? time : null;
    
    // Handle dates: ensure they are null if empty string
    const dateValue = date && date.trim() !== '' ? date : null;
    const startDateValue = start_date && start_date.trim() !== '' ? start_date : null;
    const endDateValue = end_date && end_date.trim() !== '' ? end_date : null;

    const result = await client.query(
      `INSERT INTO trainings (training_id, title, topic, date, start_date, end_date, time, venue, speaker, capacity, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [training_id, title, topic, dateValue, startDateValue, endDateValue, timeValue, venue, speaker, capacityInt, status || 'upcoming']
    );

    // LOG ACTIVITY
    if (created_by) {
      const userRes = await client.query('SELECT first_name, middle_name, last_name FROM profiles WHERE id = $1', [created_by]);
      let userName = 'Unknown User';
      
      if (userRes.rows.length > 0) {
        const p = userRes.rows[0];
        userName = [p.first_name, p.middle_name, p.last_name].filter(Boolean).join(' ');
      }

      await client.query(
        `INSERT INTO activity_logs (user_id, user_name, action, module, description, target_id)
         VALUES ($1, $2, 'CREATE', 'Training', $3, $4)`,
        [created_by, userName, `Created new training: ${title}`, result.rows[0].id]
      );
    }

    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating training:', error);
    res.status(500).json({ error: 'Failed to create training' });
  } finally {
    client.release();
  }
});

app.put('/api/trainings/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { title, topic, date, start_date, end_date, time, venue, speaker, capacity, status, updated_by } = req.body;
    
    // 1. Fetch old data to make a descriptive log
    const oldData = await client.query('SELECT title, status FROM trainings WHERE id = $1', [id]);
    const oldTitle = oldData.rows[0]?.title || 'Training';
    const oldStatus = oldData.rows[0]?.status;

    // 2. Perform the Update
    const result = await client.query(
      `UPDATE trainings
       SET title = $1, topic = $2, date = $3, start_date = $4, end_date = $5, time = $6,
           venue = $7, speaker = $8, capacity = $9, status = $10, updated_at = NOW()
       WHERE id = $11
       RETURNING *`,
      [title, topic, date, start_date, end_date, time, venue, speaker, capacity, status, id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Training not found' });
    }

    // 3. LOG THE ACTIVITY (Only if updated_by is provided)
    if (updated_by) {
      const userRes = await client.query('SELECT first_name, middle_name, last_name FROM profiles WHERE id = $1', [updated_by]);
      let userName = 'Unknown User';
      
      if (userRes.rows.length > 0) {
        const p = userRes.rows[0];
        userName = [p.first_name, p.middle_name, p.last_name].filter(Boolean).join(' ');
      }

      // Create a description (e.g., "Changed status of Seminar A from upcoming to ongoing")
      let description = `Updated details for training: ${oldTitle}`;
      if (oldStatus !== status) {
        description = `Changed status of ${oldTitle} from ${oldStatus} to ${status}`;
      }

      await client.query(
        `INSERT INTO activity_logs (user_id, user_name, action, module, description, target_id)
         VALUES ($1, $2, 'UPDATE', 'Training', $3, $4)`,
        [updated_by, userName, description, id]
      );
    }

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating training:', error);
    res.status(500).json({ error: 'Failed to update training' });
  } finally {
    client.release();
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
    // UPDATED: Use CONCAT instead of p.full_name
    const result = await pool.query(`
      SELECT tr.*, 
      TRIM(BOTH ' ' FROM CONCAT(p.first_name, ' ', p.middle_name, ' ', p.last_name)) as officer_name, 
      t.title as training_title
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
    // UPDATED: Use CONCAT instead of p.full_name
    const result = await pool.query(`
      SELECT tr.*, 
      TRIM(BOTH ' ' FROM CONCAT(p.first_name, ' ', p.middle_name, ' ', p.last_name)) as full_name, 
      p.username, p.position, p.cooperative
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
    // UPDATED: Use CONCAT instead of p.full_name
    const result = await pool.query(`
      SELECT a.*, 
      TRIM(BOTH ' ' FROM CONCAT(p.first_name, ' ', p.middle_name, ' ', p.last_name)) as officer_name, 
      t.title as training_title
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
    // UPDATED: Use CONCAT instead of p.full_name
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
    // UPDATED: Use CONCAT instead of p.full_name
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
    // UPDATED: Use CONCAT instead of p.full_name
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

// UPDATED COOPERATIVE STATUS WITH LOGGING
app.patch('/api/cooperatives/:id/status', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { status, review_notes, reviewed_by } = req.body;
    
    // 1. Get old status and documents
    const oldRes = await client.query('SELECT name, type, status, submitted_documents FROM cooperatives WHERE id = $1', [id]);
    if (oldRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Cooperative not found' });
    }
    const oldCoop = oldRes.rows[0];

    // 2. Perform the Update
    const result = await client.query(
      `UPDATE cooperatives SET 
        status = $1, review_notes = $2, reviewed_by = $3, reviewed_at = NOW(),
        updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [status, review_notes, reviewed_by, id]
    );

    // 2.5. Insert Auto-Compliance Records upon strictly Approval
    if (status === 'approved' && oldCoop.status !== 'approved') {
      let docs = [];
      if (typeof oldCoop.submitted_documents === 'string') {
        try { docs = JSON.parse(oldCoop.submitted_documents); } catch(e){}
      } else {
        docs = oldCoop.submitted_documents || [];
      }
      
      const rawType = (oldCoop.type || '').toLowerCase();
      let normalizedType = 'Uncategorized';
      if (rawType.includes('agri')) normalizedType = 'Agriculture';
      else if (rawType.includes('consum')) normalizedType = 'Consumers';
      else if (rawType.includes('credit')) normalizedType = 'Credit';
      else if (rawType.includes('federation')) normalizedType = 'Federation';
      else if (rawType.includes('health')) normalizedType = 'Health Service';
      else if (rawType.includes('labor')) normalizedType = 'Labor Service';
      else if (rawType.includes('multi')) normalizedType = 'Multipurpose';
      else if (rawType.includes('transport')) normalizedType = 'Transport';

      const getBase64 = (type) => docs.find(d => d.type === type)?.data_url || null;

      const recordsToCreate = [
        { reqName: 'Certificate of Compliance', file: getBase64('cda_certificate') },
        { reqName: "Mayor's Permit", file: getBase64('mayors_permit') },
        { reqName: 'CAPR', file: getBase64('capr') }
      ];

      for (const rec of recordsToCreate) {
        if (rec.file) {
          const existRes = await client.query(
             'SELECT id FROM compliance_records WHERE cooperative_name = $1 AND requirement_name = $2',
             [oldCoop.name, rec.reqName]
          );
          if (existRes.rows.length === 0) {
            await client.query(
              `INSERT INTO compliance_records (cooperative_name, cooperative_type, requirement_name, status, submitted_date, reviewed_by, file_url)
               VALUES ($1, $2, $3, $4, NOW(), $5, $6)`,
              [oldCoop.name, normalizedType, rec.reqName, 'compliant', reviewed_by, rec.file]
            );
          }
        }
      }
    }

    // 3. LOG THE ACTIVITY
    if (reviewed_by) {
      const adminRes = await client.query('SELECT first_name, middle_name, last_name FROM profiles WHERE id = $1', [reviewed_by]);
      let adminName = 'System Admin';
      
      if (adminRes.rows.length > 0) {
        const p = adminRes.rows[0];
        adminName = [p.first_name, p.middle_name, p.last_name].filter(Boolean).join(' ');
      }

      await client.query(
        `INSERT INTO activity_logs (user_id, user_name, action, module, description, target_id)
         VALUES ($1, $2, 'UPDATE', 'Cooperative', $3, $4)`,
        [reviewed_by, adminName, `Updated status for cooperative ${oldCoop.name} from ${oldCoop.status} to ${status}`, id]
      );
    }

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating cooperative status:', error);
    res.status(500).json({ error: 'Failed to update cooperative status' });
  } finally {
    client.release();
  }
});

// UPDATED MEMBER STATUS WITH LOGGING + OFFICER ACCOUNT CREATION
app.patch('/api/members/:id/status', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { status, review_notes, reviewed_by, membership_date } = req.body;
    
    const validStatuses = ['pending', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Invalid status' });
    }

    // 1. Get old member data for logging and profile creation
    const oldRes = await client.query(
      'SELECT first_name, last_name, status, email, member_id, role, cooperative_id FROM members WHERE id = $1',
      [id]
    );
    if (oldRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Member not found' });
    }
    const oldMember = oldRes.rows[0];
    const memberName = `${oldMember.first_name} ${oldMember.last_name}`;
    const oldStatus = oldMember.status;

    // 2. Update Status
    const result = await client.query(
      `UPDATE members SET 
        status = $1, review_notes = $2, reviewed_by = $3, reviewed_at = NOW(),
        membership_date = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [status, review_notes, reviewed_by, status === 'approved' ? membership_date || new Date().toISOString().split('T')[0] : null, id]
    );

    // 3. If approving an officer, auto-create a profile account
    let generatedCredentials = null;
    const officerRoles = ['President', 'Vice President', 'Secretary', 'Treasurer', 'Auditor', 'Board Member'];
    if (status === 'approved' && oldStatus !== 'approved' && officerRoles.includes(oldMember.role)) {
      // Get cooperative name
      const coopRes = await client.query('SELECT name FROM cooperatives WHERE id = $1', [oldMember.cooperative_id]);
      const coopName = coopRes.rows.length > 0 ? coopRes.rows[0].name : 'Unknown Cooperative';

      // Use email as username; fall back to member_id
      const username = oldMember.email || oldMember.member_id || `officer_${Date.now()}`;

      // Generate a random 8-character password
      const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
      let randomPassword = '';
      for (let i = 0; i < 8; i++) {
        randomPassword += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      // Only create if no profile with this username exists yet
      const existingProfile = await client.query('SELECT id FROM profiles WHERE username = $1', [username]);
      if (existingProfile.rows.length === 0) {
        await client.query(
          `INSERT INTO profiles (username, first_name, last_name, role, cooperative, position, password_hash)
           VALUES ($1, $2, $3, 'officer', $4, $5, $6)`,
          [username, oldMember.first_name, oldMember.last_name, coopName, oldMember.role, randomPassword]
        );
        generatedCredentials = { username, password: randomPassword };
        console.log(`Officer account created for ${memberName}: username=${username}`);
      } else {
        console.log(`Profile already exists for username: ${username}, skipping creation.`);
      }
    }

    // 4. LOG ACTIVITY
    if (reviewed_by) {
      const adminRes = await client.query('SELECT first_name, middle_name, last_name FROM profiles WHERE id = $1', [reviewed_by]);
      let adminName = 'System Admin';
      if (adminRes.rows.length > 0) {
        const p = adminRes.rows[0];
        adminName = [p.first_name, p.middle_name, p.last_name].filter(Boolean).join(' ');
      }
      await client.query(
        `INSERT INTO activity_logs (user_id, user_name, action, module, description, target_id)
         VALUES ($1, $2, 'UPDATE', 'Membership', $3, $4)`,
        [reviewed_by, adminName, `Updated membership for ${memberName} from ${oldStatus} to ${status}`, id]
      );
    }

    await client.query('COMMIT');
    res.json({ ...result.rows[0], generatedCredentials });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating member status:', error);
    res.status(500).json({ error: 'Failed to update member status' });
  } finally {
    client.release();
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

// ===== COMPLIANCE API =====

app.get('/api/compliance', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM compliance_records ORDER BY deadline ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching compliance records:', error);
    res.status(500).json({ error: 'Failed to fetch compliance records', details: error.message });
  }
});

app.post('/api/compliance', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { cooperative_name, cooperative_type, requirement_name, status, deadline, submitted_date, reviewed_by, file_url } = req.body;
    
    // Check if modifying file_url with base64 string
    const result = await client.query(
      `/* bust PgBouncer cache 2 */ INSERT INTO compliance_records (cooperative_name, cooperative_type, requirement_name, status, deadline, submitted_date, reviewed_by, file_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [cooperative_name, cooperative_type || 'Uncategorized', requirement_name, status || 'pending', deadline || null, submitted_date || null, reviewed_by || null, file_url || null]
    );

    const newRecord = result.rows[0];

    if (reviewed_by) {
      const userRes = await client.query('SELECT first_name, middle_name, last_name FROM profiles WHERE id = $1', [reviewed_by]);
      let adminName = 'Unknown Admin';
      if (userRes.rows.length > 0) {
        const u = userRes.rows[0];
        adminName = [u.first_name, u.middle_name, u.last_name].filter(Boolean).join(' ');
      }
      
      await client.query(
        `INSERT INTO activity_logs (user_id, user_name, action, module, description, target_id)
         VALUES ($1, $2, 'CREATE', 'Compliance', $3, $4)`,
        [reviewed_by, adminName, `Created compliance record of ${newRecord.cooperative_name} to ${status}`, newRecord.id]
      );
    }

    await client.query('COMMIT');
    res.status(201).json(newRecord);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating compliance record:', error);
    res.status(500).json({ error: 'Failed to create compliance record' });
  } finally {
    client.release();
  }
});

app.patch('/api/compliance/:id/status', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { status, reviewer_notes, reviewed_by, submitted_date, file_url } = req.body;
    
    // Update the record
    const result = await client.query(
      `/* bust PgBouncer cache 2 */ UPDATE compliance_records
       SET status = COALESCE($1, status),
           reviewer_notes = COALESCE($2, reviewer_notes),
           reviewed_by = COALESCE($3, reviewed_by),
           submitted_date = COALESCE($4, submitted_date),
           file_url = COALESCE($5, file_url),
           updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [status, reviewer_notes, reviewed_by, submitted_date, file_url, id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Record not found' });
    }

    const updatedRecord = result.rows[0];

    // Log the activity if reviewed_by is provided
    if (reviewed_by) {
      const userRes = await client.query('SELECT first_name, middle_name, last_name FROM profiles WHERE id = $1', [reviewed_by]);
      let adminName = 'Unknown Admin';
      if (userRes.rows.length > 0) {
        const u = userRes.rows[0];
        adminName = [u.first_name, u.middle_name, u.last_name].filter(Boolean).join(' ');
      }
      
      await client.query(
        `INSERT INTO activity_logs (user_id, user_name, action, module, description, target_id)
         VALUES ($1, $2, 'UPDATE', 'Compliance', $3, $4)`,
        [reviewed_by, adminName, `Updated compliance status of ${updatedRecord.cooperative_name} to ${status}`, id]
      );
    }

    await client.query('COMMIT');
    res.json(updatedRecord);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating compliance status:', error);
    res.status(500).json({ error: 'Failed to update compliance status' });
  } finally {
    client.release();
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
      tin, photo_url, documents, role
    } = req.body;
    
    const memberId = `MBR-${Date.now().toString(36).toUpperCase()}`;
    
    const result = await pool.query(
      `INSERT INTO members (member_id, cooperative_id, first_name, middle_name, last_name, 
        suffix, date_of_birth, gender, civil_status, address, city, province, email, phone, 
        occupation, tin, photo_url, documents, role, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, 'pending')
       RETURNING *`,
      [memberId, cooperative_id, first_name, middle_name, last_name, suffix, date_of_birth,
       gender, civil_status, address, city, province, email, phone, occupation, tin, photo_url,
       JSON.stringify(documents || []), role || 'Regular Member']
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

// (Duplicate handler removed — officer status update is handled above)

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

// (Legacy compliance module removed cleanly)

// ===== ACTIVITY LOGS API =====

app.get('/api/activity-logs', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 100');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
});

// UPDATED COMPLIANCE STATUS WITH LOGGING
app.patch('/api/compliance/:id/status', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { status, reviewer_notes, reviewed_by, submitted_date } = req.body;
    
    // 1. Get the Old Status first (for comparison)
    const oldRecordRes = await client.query('SELECT status, requirement_name FROM compliance_records WHERE id = $1', [id]);
    const oldStatus = oldRecordRes.rows[0]?.status || 'Unknown';
    const requirementName = oldRecordRes.rows[0]?.requirement_name || 'Requirement';

    // 2. Perform the Update
    const result = await client.query(
      `UPDATE compliance_records SET 
        status = $1, reviewer_notes = $2, reviewed_by = $3, reviewed_at = NOW(),
        submitted_date = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [status, reviewer_notes, reviewed_by, submitted_date, id]
    );
    
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Compliance record not found' });
    }

    // 3. LOG THE ACTIVITY
    // Fetch the Admin's name using the ID provided in the request
    const adminRes = await client.query('SELECT first_name, last_name FROM profiles WHERE id = $1', [reviewed_by]);
    let adminName = 'System Admin';
    
    if (adminRes.rows.length > 0) {
      const p = adminRes.rows[0];
      // Construct the full name from parts
      adminName = [p.first_name, p.middle_name, p.last_name].filter(Boolean).join(' ');
    }

    const description = `Updated ${requirementName} from ${oldStatus} to ${status}`;
    
    await client.query(
      `INSERT INTO activity_logs (user_id, user_name, action, module, description, target_id)
       VALUES ($1, $2, 'UPDATE', 'Compliance', $3, $4)`,
      [reviewed_by, adminName, description, id]
    );

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating compliance status:', error);
    res.status(500).json({ error: 'Failed to update compliance status' });
  } finally {
    client.release();
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

// ===== DASHBOARD STATS API =====
app.get('/api/dashboard/admin-stats', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM cooperatives) as "totalCooperatives",
        (SELECT COUNT(*) FROM members) as "totalOfficers",
        (SELECT COUNT(*) FROM members WHERE status = 'approved') as "compliantOfficers",
        (SELECT COUNT(*) FROM trainings WHERE date > CURRENT_DATE) as "upcomingEvents",
        (SELECT COUNT(*) FROM cooperatives WHERE status = 'pending') as "pendingRegistrations",
        (SELECT COUNT(*) FROM members WHERE status = 'pending') as "pendingMembers",
        (SELECT COUNT(*) FROM compliance_records WHERE status = 'overdue' OR (deadline < CURRENT_DATE AND status != 'compliant')) as "overdueCompliance"
    `);
    
    // Parse strings from COUNT(*) back to integers
    const stats = result.rows[0];
    const payload = {
      totalCooperatives: parseInt(stats.totalCooperatives || "0", 10),
      totalOfficers: parseInt(stats.totalOfficers || "0", 10),
      compliantOfficers: parseInt(stats.compliantOfficers || "0", 10),
      upcomingEvents: parseInt(stats.upcomingEvents || "0", 10),
      pendingRegistrations: parseInt(stats.pendingRegistrations || "0", 10),
      pendingMembers: parseInt(stats.pendingMembers || "0", 10),
      overdueCompliance: parseInt(stats.overdueCompliance || "0", 10)
    };
    
    res.json(payload);
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Failed to fetch admin stats' });
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
// ===== ATTENDANCE ENHANCEMENTS =====
app.delete('/api/attendance/:training_id/:officer_id', async (req, res) => {
  try {
    const { training_id, officer_id } = req.params;
    await pool.query('DELETE FROM attendance WHERE training_id = $1 AND officer_id = $2', [training_id, officer_id]);
    res.json({ message: 'Attendance revoked' });
  } catch (error) {
    console.error('Error revoking attendance:', error);
    res.status(500).json({ error: 'Failed to revoke attendance' });
  }
});

app.post('/api/attendance/bulk', async (req, res) => {
  try {
    const { training_id, officer_ids, recorded_by, method } = req.body;
    if (!officer_ids || !officer_ids.length) return res.status(400).json({ error: 'No officers provided' });
    for (const officer_id of officer_ids) {
      await pool.query(
        `INSERT INTO attendance (officer_id, training_id, recorded_by, method)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (officer_id, training_id) DO UPDATE SET recorded_at = NOW()`,
        [officer_id, training_id, recorded_by, method]
      );
    }
    res.status(201).json({ message: 'Bulk attendance recorded' });
  } catch (error) {
    console.error('Error bulk recording attendance:', error);
    res.status(500).json({ error: 'Failed to bulk record attendance' });
  }
});

export default app;