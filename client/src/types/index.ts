export interface User {
  id: string;
  name: string;
  email: string;
  avatar_color: string;
  created_at: string;
}

export interface Feature {
  id: string;
  tech_lead_id: string;
  title: string;
  description: string | null;
  status: 'planning' | 'in_progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  start_date: string | null;
  target_date: string | null;
  people_count: string;
  total_tasks: string;
  completed_tasks: string;
  total_estimated_hours?: string | number;
  total_actual_hours?: string | number;
  total_standup_hours?: string | number;
  created_at: string;
  updated_at: string;
}

export interface Person {
  id: string;
  tech_lead_id?: string;
  feature_id?: string;
  name: string;
  role: string | null;
  email: string | null;
  avatar_color: string;
  feature_count?: string;
  total_tasks: string;
  completed_tasks: string;
  created_at: string;
}

export interface ChecklistItem {
  id: string;
  person_id: string;
  feature_id: string;
  title: string;
  is_completed: boolean;
  estimated_hours?: number | string;
  actual_hours?: number | string;
  completed_at: string | null;
  created_at: string;
}

export interface Standup {
  id: string;
  feature_id: string;
  person_id: string;
  person_name: string;
  person_role: string | null;
  avatar_color: string;
  standup_date: string;
  yesterday: string | null;
  today: string | null;
  blockers: string | null;
  hours_logged?: number | string;
  created_at: string;
}

export interface Retrospective {
  id: string;
  feature_id: string;
  went_well: string | null;
  to_improve: string | null;
  action_items: string | null;
  created_by: string;
  created_by_name: string;
  created_at: string;
}
