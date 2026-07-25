import { Response } from 'express';
import pool from '../db/connection';
import { AuthenticatedRequest } from '../middleware/auth';

// Get all features for the logged-in tech lead
export const getFeatures = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT f.*, 
        (SELECT COUNT(*) FROM feature_people fp WHERE fp.feature_id = f.id) as people_count,
        (SELECT COUNT(*) FROM checklists c WHERE c.feature_id = f.id) as total_tasks,
        (SELECT COUNT(*) FROM checklists c WHERE c.feature_id = f.id AND c.is_completed = true) as completed_tasks,
        COALESCE((SELECT SUM(estimated_hours) FROM checklists c WHERE c.feature_id = f.id), 0) as total_estimated_hours,
        COALESCE((SELECT SUM(actual_hours) FROM checklists c WHERE c.feature_id = f.id), 0) as total_actual_hours,
        COALESCE((SELECT SUM(hours_logged) FROM standups s WHERE s.feature_id = f.id), 0) as total_standup_hours
      FROM features f 
      WHERE f.tech_lead_id = $1 
      ORDER BY f.created_at DESC`,
      [req.user!.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get features error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get a single feature by ID
export const getFeature = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT f.*, 
        (SELECT COUNT(*) FROM feature_people fp WHERE fp.feature_id = f.id) as people_count,
        (SELECT COUNT(*) FROM checklists c WHERE c.feature_id = f.id) as total_tasks,
        (SELECT COUNT(*) FROM checklists c WHERE c.feature_id = f.id AND c.is_completed = true) as completed_tasks,
        COALESCE((SELECT SUM(estimated_hours) FROM checklists c WHERE c.feature_id = f.id), 0) as total_estimated_hours,
        COALESCE((SELECT SUM(actual_hours) FROM checklists c WHERE c.feature_id = f.id), 0) as total_actual_hours,
        COALESCE((SELECT SUM(hours_logged) FROM standups s WHERE s.feature_id = f.id), 0) as total_standup_hours
      FROM features f 
      WHERE f.id = $1 AND f.tech_lead_id = $2`,
      [req.params.id, req.user!.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Feature not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get feature error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create a new feature
export const createFeature = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, description, status, priority, start_date, target_date } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const result = await pool.query(
      `INSERT INTO features (tech_lead_id, title, description, status, priority, start_date, target_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [req.user!.id, title, description || null, status || 'planning', priority || 'medium', start_date || null, target_date || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create feature error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update a feature
export const updateFeature = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, description, status, priority, start_date, target_date } = req.body;

    const result = await pool.query(
      `UPDATE features 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           status = COALESCE($3, status),
           priority = COALESCE($4, priority),
           start_date = COALESCE($5, start_date),
           target_date = COALESCE($6, target_date),
           updated_at = NOW()
       WHERE id = $7 AND tech_lead_id = $8
       RETURNING *`,
      [title, description, status, priority, start_date, target_date, req.params.id, req.user!.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Feature not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update feature error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete a feature
export const deleteFeature = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await pool.query(
      'DELETE FROM features WHERE id = $1 AND tech_lead_id = $2 RETURNING id',
      [req.params.id, req.user!.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Feature not found' });
    }

    res.json({ message: 'Feature deleted successfully' });
  } catch (error) {
    console.error('Delete feature error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
