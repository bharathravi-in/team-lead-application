import pool from './connection';
import bcrypt from 'bcryptjs';

const initDB = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Initializing database schema...');

    // Create tables
    await client.query(`
      -- Tech Leads (Users) table
      CREATE TABLE IF NOT EXISTS tech_leads (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        avatar_color VARCHAR(7) DEFAULT '#6366f1',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Features table
      CREATE TABLE IF NOT EXISTS features (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tech_lead_id UUID NOT NULL REFERENCES tech_leads(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'in_progress' CHECK (status IN ('planning', 'in_progress', 'review', 'completed')),
        priority VARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
        start_date DATE,
        target_date DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Global People table (Team Directory owned by tech_lead)
      CREATE TABLE IF NOT EXISTS people (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tech_lead_id UUID REFERENCES tech_leads(id) ON DELETE CASCADE,
        feature_id UUID REFERENCES features(id) ON DELETE SET NULL, -- backward compatibility
        name VARCHAR(255) NOT NULL,
        role VARCHAR(255),
        email VARCHAR(255),
        avatar_color VARCHAR(7) DEFAULT '#8b5cf6',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Ensure tech_lead_id column exists on people if table already existed and drop NOT NULL on feature_id for global people
      ALTER TABLE people ADD COLUMN IF NOT EXISTS tech_lead_id UUID REFERENCES tech_leads(id) ON DELETE CASCADE;
      ALTER TABLE people ALTER COLUMN feature_id DROP NOT NULL;

      -- Junction table between Features and People
      CREATE TABLE IF NOT EXISTS feature_people (
        feature_id UUID NOT NULL REFERENCES features(id) ON DELETE CASCADE,
        person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        PRIMARY KEY (feature_id, person_id)
      );

      -- Checklists (per person per feature with time tracking)
      CREATE TABLE IF NOT EXISTS checklists (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
        feature_id UUID NOT NULL REFERENCES features(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        is_completed BOOLEAN DEFAULT FALSE,
        estimated_hours NUMERIC DEFAULT 0,
        actual_hours NUMERIC DEFAULT 0,
        completed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Daily standups (with time logging)
      CREATE TABLE IF NOT EXISTS standups (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        feature_id UUID NOT NULL REFERENCES features(id) ON DELETE CASCADE,
        person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
        standup_date DATE NOT NULL DEFAULT CURRENT_DATE,
        yesterday TEXT,
        today TEXT,
        blockers TEXT,
        hours_logged NUMERIC DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Add columns if existing table
      ALTER TABLE checklists ADD COLUMN IF NOT EXISTS estimated_hours NUMERIC DEFAULT 0;
      ALTER TABLE checklists ADD COLUMN IF NOT EXISTS actual_hours NUMERIC DEFAULT 0;
      ALTER TABLE standups ADD COLUMN IF NOT EXISTS hours_logged NUMERIC DEFAULT 0;

      -- Retrospectives (per feature after completion)
      CREATE TABLE IF NOT EXISTS retrospectives (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        feature_id UUID NOT NULL REFERENCES features(id) ON DELETE CASCADE,
        went_well TEXT,
        to_improve TEXT,
        action_items TEXT,
        created_by UUID REFERENCES tech_leads(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Migrate any legacy people records to tech_lead_id and feature_people junction table
      DO $$
      BEGIN
        -- Populate tech_lead_id on existing people from their feature_id if null
        UPDATE people p 
        SET tech_lead_id = f.tech_lead_id 
        FROM features f 
        WHERE p.feature_id = f.id AND p.tech_lead_id IS NULL;

        -- Populate feature_people junction table from existing people table
        INSERT INTO feature_people (feature_id, person_id)
        SELECT feature_id, id FROM people 
        WHERE feature_id IS NOT NULL
        ON CONFLICT DO NOTHING;
      END $$;

      -- Create indexes for performance
      CREATE INDEX IF NOT EXISTS idx_features_tech_lead ON features(tech_lead_id);
      CREATE INDEX IF NOT EXISTS idx_people_tech_lead ON people(tech_lead_id);
      CREATE INDEX IF NOT EXISTS idx_feature_people_feat ON feature_people(feature_id);
      CREATE INDEX IF NOT EXISTS idx_feature_people_person ON feature_people(person_id);
      CREATE INDEX IF NOT EXISTS idx_checklists_person ON checklists(person_id);
      CREATE INDEX IF NOT EXISTS idx_checklists_feature ON checklists(feature_id);
      CREATE INDEX IF NOT EXISTS idx_standups_feature ON standups(feature_id);
      CREATE INDEX IF NOT EXISTS idx_standups_person ON standups(person_id);
      CREATE INDEX IF NOT EXISTS idx_standups_date ON standups(standup_date);
      CREATE INDEX IF NOT EXISTS idx_retrospectives_feature ON retrospectives(feature_id);
    `);

    console.log('✅ Tables created and migrated successfully');

    // Create or update default tech lead account
    const existingUser = await client.query(
      'SELECT id FROM tech_leads WHERE email = $1',
      ['admin@techlead.com']
    );

    const hashedPassword = await bcrypt.hash('admin123', 10);
    if (existingUser.rows.length === 0) {
      await client.query(
        'INSERT INTO tech_leads (name, email, password, avatar_color) VALUES ($1, $2, $3, $4)',
        ['Tech Lead', 'admin@techlead.com', hashedPassword, '#6366f1']
      );
      console.log('✅ Default user created: admin@techlead.com / admin123');
    } else {
      await client.query(
        'UPDATE tech_leads SET password = $1 WHERE email = $2',
        [hashedPassword, 'admin@techlead.com']
      );
      console.log('✅ Default user password updated: admin@techlead.com / admin123');
    }

    console.log('🎉 Database initialization complete!');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

initDB();
