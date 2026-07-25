import { Response } from 'express';
import pool from '../db/connection';
import { AuthenticatedRequest } from '../middleware/auth';

export const getStandups = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { date, person_id } = req.query;
    let query = `
      SELECT s.*, p.name as person_name, p.role as person_role, p.avatar_color
      FROM standups s JOIN people p ON s.person_id = p.id
      WHERE s.feature_id = $1`;
    const params: any[] = [req.params.featureId];
    if (date) { params.push(date); query += ` AND s.standup_date = $${params.length}`; }
    if (person_id) { params.push(person_id); query += ` AND s.person_id = $${params.length}`; }
    query += ' ORDER BY s.standup_date DESC, p.name ASC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get standups error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getStandupDates = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT DISTINCT standup_date FROM standups WHERE feature_id = $1 ORDER BY standup_date DESC',
      [req.params.featureId]
    );
    res.json(result.rows.map((r: any) => r.standup_date));
  } catch (error) {
    console.error('Get standup dates error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const upsertStandup = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { person_id, standup_date, yesterday, today, blockers, hours_logged } = req.body;
    if (!person_id) return res.status(400).json({ error: 'person_id is required' });
    const date = standup_date || new Date().toISOString().split('T')[0];
    const hrs = parseFloat(hours_logged) || 0;

    const existing = await pool.query(
      'SELECT id FROM standups WHERE feature_id = $1 AND person_id = $2 AND standup_date = $3',
      [req.params.featureId, person_id, date]
    );
    let result;
    if (existing.rows.length > 0) {
      result = await pool.query(
        'UPDATE standups SET yesterday = $1, today = $2, blockers = $3, hours_logged = $4, updated_at = NOW() WHERE id = $5 RETURNING *',
        [yesterday || null, today || null, blockers || null, hrs, existing.rows[0].id]
      );
    } else {
      result = await pool.query(
        'INSERT INTO standups (feature_id, person_id, standup_date, yesterday, today, blockers, hours_logged) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [req.params.featureId, person_id, date, yesterday || null, today || null, blockers || null, hrs]
      );
    }
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Upsert standup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteStandup = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await pool.query('DELETE FROM standups WHERE id = $1 RETURNING id', [req.params.standupId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Standup not found' });
    res.json({ message: 'Standup deleted' });
  } catch (error) {
    console.error('Delete standup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
