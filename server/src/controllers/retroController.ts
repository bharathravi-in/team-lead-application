import { Response } from 'express';
import pool from '../db/connection';
import { AuthenticatedRequest } from '../middleware/auth';

export const getRetrospectives = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT r.*, t.name as created_by_name FROM retrospectives r LEFT JOIN tech_leads t ON r.created_by = t.id WHERE r.feature_id = $1 ORDER BY r.created_at DESC',
      [req.params.featureId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get retrospectives error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createRetrospective = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { went_well, to_improve, action_items } = req.body;
    const result = await pool.query(
      'INSERT INTO retrospectives (feature_id, went_well, to_improve, action_items, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.params.featureId, went_well || null, to_improve || null, action_items || null, req.user!.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create retrospective error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateRetrospective = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { went_well, to_improve, action_items } = req.body;
    const result = await pool.query(
      'UPDATE retrospectives SET went_well = COALESCE($1, went_well), to_improve = COALESCE($2, to_improve), action_items = COALESCE($3, action_items), updated_at = NOW() WHERE id = $4 AND feature_id = $5 RETURNING *',
      [went_well, to_improve, action_items, req.params.retroId, req.params.featureId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Retrospective not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update retrospective error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteRetrospective = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await pool.query('DELETE FROM retrospectives WHERE id = $1 AND feature_id = $2 RETURNING id', [req.params.retroId, req.params.featureId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Retrospective not found' });
    res.json({ message: 'Retrospective deleted' });
  } catch (error) {
    console.error('Delete retrospective error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
