export type RasaLabel = 
  | 'fear' 
  | 'joy' 
  | 'anger' 
  | 'wonder' 
  | 'disgust' 
  | 'love' 
  | 'heroism' 
  | 'sadness';

export interface RasaConfig {
  label: RasaLabel;
  color: string;
  name: string;
  sanskrit: string;
}

export const RASA_CONFIGS: Record<RasaLabel, RasaConfig> = {
  fear: { label: 'fear', color: '#191910', name: 'Fear', sanskrit: 'Bhayanaka' },
  joy: { label: 'joy', color: '#FFC0CB', name: 'Joy', sanskrit: 'Hasya' },
  anger: { label: 'anger', color: '#E14747', name: 'Anger', sanskrit: 'Raudra' },
  wonder: { label: 'wonder', color: '#F8E042', name: 'Wonder', sanskrit: 'Adbhuta' },
  disgust: { label: 'disgust', color: '#05BB60', name: 'Disgust', sanskrit: 'Bibhatsa' },
  love: { label: 'love', color: '#368BE1', name: 'Love', sanskrit: 'Shringara' },
  heroism: { label: 'heroism', color: '#E9953B', name: 'Heroism', sanskrit: 'Vira' },
  sadness: { label: 'sadness', color: '#DDDDDD', name: 'Sadness', sanskrit: 'Karuna' },
};

export interface Class {
  id: string;
  teacher_id: string;
  name: string;
  class_code: string;
  due_date: string | null;
  allow_guests: boolean;
  created_at: string;
}

export interface GuestSession {
  id: string;
  class_id: string;
  display_name: string;
  submitted_texts: string[] | null;
  created_at: string;
  last_active_at: string | null;
}

export interface Text {
  id: string;
  class_id: string;
  title: string;
  author: string | null;
  source: string | null;
  content: string;
  instructions: string | null;
  trigger_warning: string | null;
  due_date: string | null;
  created_at: string;
}

export interface Student {
  id: string;
  class_id: string;
  name: string;
  auth_user_id: string | null;
  last_login_at: string | null;
  submitted_texts: string[] | null;
  created_at: string;
}

export interface Annotation {
  id: string;
  text_id: string;
  student_id: string;
  start_offset: number;
  end_offset: number;
  rasa_label: RasaLabel;
  created_at: string;
}

export interface WritingSubmission {
  id: string;
  text_id: string;
  student_id: string;
  content: string;
  prompt_type: 'choice' | 'random';
  selected_emotion: RasaLabel | null;
  selected_annotation_ids: string[] | null;
  created_at: string;
}

export interface TeacherProfile {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  institution: string;
  created_at: string;
  updated_at: string;
}

export interface StudentProfile {
  id: string;
  first_name: string;
  last_name: string;
  created_at: string;
  updated_at: string;
}

export interface ClassEnrollment {
  id: string;
  student_id: string;
  class_id: string;
  joined_at: string;
  last_active_at: string | null;
  submitted_texts: string[] | null;
}
