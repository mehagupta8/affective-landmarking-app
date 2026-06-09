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
  fear: { label: 'fear', color: '#1a1a1a', name: 'Fear', sanskrit: 'Bhayanaka' },
  joy: { label: 'joy', color: '#ffd700', name: 'Joy', sanskrit: 'Hasya' },
  anger: { label: 'anger', color: '#d32f2f', name: 'Anger', sanskrit: 'Raudra' },
  wonder: { label: 'wonder', color: '#8e44ad', name: 'Wonder', sanskrit: 'Adbhuta' },
  disgust: { label: 'disgust', color: '#2e7d32', name: 'Disgust', sanskrit: 'Bibhatsa' },
  love: { label: 'love', color: '#ec407a', name: 'Love', sanskrit: 'Shringara' },
  heroism: { label: 'heroism', color: '#ff8c00', name: 'Heroism', sanskrit: 'Vira' },
  sadness: { label: 'sadness', color: '#607d8b', name: 'Sadness', sanskrit: 'Karuna' },
};

export interface Class {
  id: string;
  teacher_id: string;
  name: string;
  class_code: string;
  created_at: string;
}

export interface Text {
  id: string;
  class_id: string;
  title: string;
  content: string;
  trigger_warning: string | null;
  created_at: string;
}

export interface Student {
  id: string;
  class_id: string;
  name: string;
  pin: string | null;
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
