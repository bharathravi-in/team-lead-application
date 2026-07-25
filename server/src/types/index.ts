export interface TechLead {
  id: string;
  name: string;
  email: string;
  password: string;
  avatar_color: string;
  created_at: Date;
  updated_at: Date;
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
  created_at: Date;
  updated_at: Date;
}

export interface Person {
  id: string;
  feature_id: string;
  name: string;
  role: string | null;
  email: string | null;
  avatar_color: string;
  created_at: Date;
  updated_at: Date;
}

export interface ChecklistItem {
  id: string;
  person_id: string;
  feature_id: string;
  title: string;
  is_completed: boolean;
  completed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface Standup {
  id: string;
  feature_id: string;
  person_id: string;
  standup_date: string;
  yesterday: string | null;
  today: string | null;
  blockers: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Retrospective {
  id: string;
  feature_id: string;
  went_well: string | null;
  to_improve: string | null;
  action_items: string | null;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}
