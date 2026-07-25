import { Response } from 'express';
import pool from '../db/connection';
import { AuthenticatedRequest } from '../middleware/auth';

// Get checklists for a person in a feature
export const getChecklists = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT * FROM checklists 
       WHERE person_id = $1 AND feature_id = $2 
       ORDER BY created_at ASC`,
      [req.params.personId, req.params.featureId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get checklists error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Add a checklist item with estimated and actual hours
export const addChecklistItem = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, estimated_hours, actual_hours } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const est = parseFloat(estimated_hours) || 0;
    const act = parseFloat(actual_hours) || 0;

    const result = await pool.query(
      'INSERT INTO checklists (person_id, feature_id, title, estimated_hours, actual_hours) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.params.personId, req.params.featureId, title, est, act]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Add checklist error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Toggle checklist item completion
export const toggleChecklistItem = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { is_completed, actual_hours } = req.body;

    let query = `
      UPDATE checklists 
      SET is_completed = $1,
          completed_at = CASE WHEN $1 = true THEN NOW() ELSE NULL END,
          updated_at = NOW()`;
    
    const params: any[] = [is_completed];
    if (actual_hours !== undefined) {
      query += `, actual_hours = $2 WHERE id = $3 RETURNING *`;
      params.push(parseFloat(actual_hours) || 0, req.params.checklistId);
    } else {
      query += ` WHERE id = $2 RETURNING *`;
      params.push(req.params.checklistId);
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Checklist item not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Toggle checklist error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update checklist item
export const updateChecklistItem = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, estimated_hours, actual_hours } = req.body;

    const result = await pool.query(
      `UPDATE checklists 
       SET title = COALESCE($1, title),
           estimated_hours = COALESCE($2, estimated_hours),
           actual_hours = COALESCE($3, actual_hours),
           updated_at = NOW() 
       WHERE id = $4 RETURNING *`,
      [title, estimated_hours !== undefined ? parseFloat(estimated_hours) : null, actual_hours !== undefined ? parseFloat(actual_hours) : null, req.params.checklistId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Checklist item not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update checklist error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete checklist item
export const deleteChecklistItem = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await pool.query(
      'DELETE FROM checklists WHERE id = $1 RETURNING id',
      [req.params.checklistId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Checklist item not found' });
    }

    res.json({ message: 'Checklist item deleted' });
  } catch (error) {
    console.error('Delete checklist error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
