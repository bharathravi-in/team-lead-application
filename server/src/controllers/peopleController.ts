import { Response } from 'express';
import pool from '../db/connection';
import { AuthenticatedRequest } from '../middleware/auth';

// ---------------- GLOBAL PEOPLE DIRECTORY ----------------

// Get all global team members for logged-in tech lead
export const getGlobalPeople = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT p.*,
        (SELECT COUNT(DISTINCT feature_id) FROM feature_people fp WHERE fp.person_id = p.id) as feature_count,
        (SELECT COUNT(*) FROM checklists c WHERE c.person_id = p.id) as total_tasks,
        (SELECT COUNT(*) FROM checklists c WHERE c.person_id = p.id AND c.is_completed = true) as completed_tasks
      FROM people p 
      WHERE p.tech_lead_id = $1 
      ORDER BY p.name ASC`,
      [req.user!.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get global people error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create a new global person
export const createGlobalPerson = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, role, email } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#14b8a6', '#a855f7'];
    const avatarColor = colors[Math.floor(Math.random() * colors.length)];

    const result = await pool.query(
      `INSERT INTO people (tech_lead_id, name, role, email, avatar_color)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.user!.id, name, role || null, email || null, avatarColor]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create global person error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update global person
export const updateGlobalPerson = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, role, email } = req.body;

    const result = await pool.query(
      `UPDATE people 
       SET name = COALESCE($1, name),
           role = COALESCE($2, role),
           email = COALESCE($3, email),
           updated_at = NOW()
       WHERE id = $4 AND tech_lead_id = $5
       RETURNING *`,
      [name, role, email, req.params.personId, req.user!.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Person not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update global person error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete global person
export const deleteGlobalPerson = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await pool.query(
      'DELETE FROM people WHERE id = $1 AND tech_lead_id = $2 RETURNING id',
      [req.params.personId, req.user!.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Person not found' });
    }

    res.json({ message: 'Person deleted successfully' });
  } catch (error) {
    console.error('Delete global person error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


// ---------------- FEATURE ASSIGNMENTS ----------------

// Get people assigned to a feature
export const getFeaturePeople = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Verify feature ownership
    const featureCheck = await pool.query(
      'SELECT id FROM features WHERE id = $1 AND tech_lead_id = $2',
      [req.params.featureId, req.user!.id]
    );
    if (featureCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Feature not found' });
    }

    const result = await pool.query(
      `SELECT p.*,
        (SELECT COUNT(*) FROM checklists c WHERE c.person_id = p.id AND c.feature_id = $1) as total_tasks,
        (SELECT COUNT(*) FROM checklists c WHERE c.person_id = p.id AND c.feature_id = $1 AND c.is_completed = true) as completed_tasks
      FROM people p 
      JOIN feature_people fp ON p.id = fp.person_id
      WHERE fp.feature_id = $1 
      ORDER BY p.name ASC`,
      [req.params.featureId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get feature people error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Assign global person(s) to a feature
export const assignPeopleToFeature = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { personIds, name, role, email } = req.body;

    // Verify feature ownership
    const featureCheck = await pool.query(
      'SELECT id FROM features WHERE id = $1 AND tech_lead_id = $2',
      [req.params.featureId, req.user!.id]
    );
    if (featureCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Feature not found' });
    }

    // If personIds array is provided, assign existing global team members
    if (Array.isArray(personIds) && personIds.length > 0) {
      for (const pId of personIds) {
        await pool.query(
          `INSERT INTO feature_people (feature_id, person_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [req.params.featureId, pId]
        );
      }
      return res.json({ message: 'Team members assigned successfully' });
    }

    // Alternatively, create a brand new person and assign to feature directly
    if (name) {
      const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4'];
      const avatarColor = colors[Math.floor(Math.random() * colors.length)];

      const newPerson = await pool.query(
        `INSERT INTO people (tech_lead_id, name, role, email, avatar_color)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [req.user!.id, name, role || null, email || null, avatarColor]
      );

      const person = newPerson.rows[0];

      await pool.query(
        `INSERT INTO feature_people (feature_id, person_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [req.params.featureId, person.id]
      );

      return res.status(201).json(person);
    }

    return res.status(400).json({ error: 'Please provide personIds or a name for a new team member' });
  } catch (error) {
    console.error('Assign people error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Unassign person from a feature
export const unassignPersonFromFeature = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await pool.query(
      `DELETE FROM feature_people WHERE feature_id = $1 AND person_id = $2 RETURNING person_id`,
      [req.params.featureId, req.params.personId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Person assignment not found' });
    }

    res.json({ message: 'Person unassigned from feature successfully' });
  } catch (error) {
    console.error('Unassign person error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
