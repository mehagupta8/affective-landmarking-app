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
}

export const RASA_CONFIGS: Record<RasaLabel, RasaConfig> = {
  fear: { label: 'fear', color: '#1a1a1a', name: 'Fear' },
  joy: { label: 'joy', color: '#ffd700', name: 'Joy' },
  anger: { label: 'anger', color: '#d32f2f', name: 'Anger' },
  wonder: { label: 'wonder', color: '#8e44ad', name: 'Wonder' },
  disgust: { label: 'disgust', color: '#2e7d32', name: 'Disgust' },
  love: { label: 'love', color: '#ec407a', name: 'Love' },
  heroism: { label: 'heroism', color: '#ff8c00', name: 'Heroism' },
  sadness: { label: 'sadness', color: '#607d8b', name: 'Sadness' },
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
