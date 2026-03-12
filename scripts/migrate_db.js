import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

const localPool = new Pool({
  connectionString: 'postgresql://postgres:admin123@localhost:5432/coopwise_local'
});

const remotePool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_dxk3O1tXZyGI@ep-damp-boat-ah0it3xm-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: { rejectUnauthorized: false }
});

const tables = [
  'profiles', 'cooperatives', 'trainings', 'training_types', 
  'sessions', 'attendance', 'training_suggestions', 'activity_logs',
  'compliance_requirements', 'cooperative_compliance'
];

async function migrate() {
  console.log('Starting migration from local to remote (Neon)...');
  
  try {
    const statements = [
      `CREATE TABLE IF NOT EXISTS profiles (
          id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
          username character varying(255) UNIQUE NOT NULL,
          role character varying(50) NOT NULL,
          cooperative character varying(255),
          "position" character varying(255),
          user_id_display character varying(50),
          first_name character varying(100),
          middle_name character varying(100),
          last_name character varying(100),
          email character varying(255),
          password_hash character varying(255),
          created_at timestamp with time zone DEFAULT now(),
          updated_at timestamp with time zone DEFAULT now()
      );`,
      
      `CREATE TABLE IF NOT EXISTS cooperatives (
          id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
          coop_id character varying(50) UNIQUE,
          name character varying(255) NOT NULL,
          type character varying(100),
          address text,
          city character varying(100),
          province character varying(100),
          region character varying(100),
          registration_number character varying(100),
          cda_registration_date date,
          tin character varying(50),
          contact_person character varying(255),
          contact_email character varying(255),
          contact_phone character varying(50),
          status character varying(50) DEFAULT 'pending',
          submitted_documents jsonb DEFAULT '[]'::jsonb,
          review_notes text,
          reviewed_by uuid,
          reviewed_at timestamp with time zone,
          created_at timestamp with time zone DEFAULT now(),
          updated_at timestamp with time zone DEFAULT now()
      );`,

      `CREATE TABLE IF NOT EXISTS members (
          id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
          member_id character varying(50) UNIQUE,
          cooperative_id uuid REFERENCES cooperatives(id) ON DELETE CASCADE,
          first_name character varying(100) NOT NULL,
          middle_name character varying(100),
          last_name character varying(100) NOT NULL,
          suffix character varying(20),
          date_of_birth date,
          gender character varying(20),
          civil_status character varying(30),
          address text,
          city character varying(100),
          province character varying(100),
          email character varying(255),
          phone character varying(50),
          occupation character varying(100),
          tin character varying(50),
          photo_url text,
          documents jsonb DEFAULT '[]'::jsonb,
          status character varying(50) DEFAULT 'pending',
          membership_date date,
          review_notes text,
          reviewed_by uuid,
          reviewed_at timestamp with time zone,
          role character varying(50) DEFAULT 'Regular Member',
          created_at timestamp with time zone DEFAULT now(),
          updated_at timestamp with time zone DEFAULT now()
      );`,

      `CREATE TABLE IF NOT EXISTS trainings (
          id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
          training_id character varying(50) UNIQUE NOT NULL,
          title character varying(255) NOT NULL,
          topic character varying(255) NOT NULL,
          date date NOT NULL,
          start_date date NOT NULL,
          end_date date,
          "time" time without time zone,
          venue character varying(255) NOT NULL,
          speaker character varying(255) NOT NULL,
          capacity integer NOT NULL,
          status character varying(50) DEFAULT 'upcoming',
          target_positions jsonb DEFAULT '[]'::jsonb,
          created_at timestamp with time zone DEFAULT now(),
          updated_at timestamp with time zone DEFAULT now()
      );`,

      `CREATE TABLE IF NOT EXISTS training_registrations (
          id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
          training_id uuid REFERENCES trainings(id) ON DELETE CASCADE NOT NULL,
          officer_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
          registered_at timestamp with time zone DEFAULT now(),
          UNIQUE (training_id, officer_id)
      );`,

      `CREATE TABLE IF NOT EXISTS attendance (
          id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
          officer_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
          training_id uuid REFERENCES trainings(id) ON DELETE CASCADE,
          recorded_at timestamp with time zone DEFAULT now(),
          recorded_by uuid REFERENCES profiles(id),
          method character varying(50),
          check_in_time time without time zone,
          UNIQUE (officer_id, training_id)
      );`,

      `CREATE TABLE IF NOT EXISTS training_suggestions (
          id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
          title character varying(255) NOT NULL,
          description text NOT NULL,
          category character varying(100) NOT NULL,
          preferred_date date,
          justification text,
          priority character varying(20) DEFAULT 'medium',
          officer_id uuid REFERENCES profiles(id) NOT NULL,
          status character varying(50) DEFAULT 'pending',
          created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
      );`,

      `CREATE TABLE IF NOT EXISTS activity_logs (
          id SERIAL PRIMARY KEY,
          user_id character varying(255),
          user_name character varying(255),
          action character varying(50),
          module character varying(50),
          description text,
          target_id character varying(255),
          created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
      );`,

      `CREATE TABLE IF NOT EXISTS compliance_records (
          id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
          cooperative_id uuid REFERENCES cooperatives(id) ON DELETE CASCADE,
          requirement_type character varying(100) NOT NULL,
          requirement_name character varying(255) NOT NULL,
          description text,
          due_date date,
          submitted_date date,
          status character varying(50) DEFAULT 'pending',
          documents jsonb DEFAULT '[]'::jsonb,
          reviewer_notes text,
          reviewed_by uuid,
          reviewed_at timestamp with time zone,
          year integer,
          created_at timestamp with time zone DEFAULT now(),
          updated_at timestamp with time zone DEFAULT now()
      );`,

      `CREATE TABLE IF NOT EXISTS companion_registrations (
          id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
          training_id uuid REFERENCES trainings(id) ON DELETE CASCADE NOT NULL,
          officer_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
          companion_name text NOT NULL,
          companion_email text NOT NULL,
          companion_phone text,
          companion_position text,
          registered_at timestamp with time zone DEFAULT now(),
          created_at timestamp with time zone DEFAULT now()
      );`
    ];

    // Run the schema queries
    console.log("Applying isolated schema step-by-step...");
    try {
        await remotePool.query('SET search_path TO public;');
        console.log("Search path set to public.");
    } catch (e) {
        console.error("Failed to set search path", e);
    }

    for(const stmt of statements) {
       try {
           await remotePool.query(stmt);
           console.log("Created table.")
       } catch (err) {
           console.error("FATAL ERROR CREATING TABLE:", err.message, stmt.substring(0, 50));
           return;
       }
    }


    for (const table of tables) {
      console.log(`\nMigrating table: ${table}...`);
      
      const res = await localPool.query(`SELECT * FROM ${table}`);
      const rows = res.rows;
      
      if (rows.length === 0) {
        console.log(`  Table ${table} is empty. Skipping.`);
        continue;
      }
      
      const columns = Object.keys(rows[0]);
      
      for (const row of rows) {
        const values = columns.map(c => {
            const val = row[c];
            if (typeof val === 'object' && val !== null && !(val instanceof Date)) {
                return JSON.stringify(val);
            }
            return val;
        });
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
        const colNames = columns.map(c => `"${c}"`).join(', ');
        
        const query = `
          INSERT INTO public."${table}" (${colNames})
          VALUES (${placeholders})
          ON CONFLICT DO NOTHING
        `;
        
        try {
           await remotePool.query(query, values);
        } catch(e) {
           console.log(`Error inserting into ${table}:`, e.message);
        }
      }
      
      console.log(`  Inserted ${rows.length} rows into ${table}.`);
    }

    console.log('\nMigration complete!');
    
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await localPool.end();
    await remotePool.end();
  }
}

migrate();
