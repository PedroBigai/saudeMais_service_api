// Meal - Refeição individual
export interface Meal {
  id: string;
  title: string;
  time: string;
  fat_g: string;
  carbs_g: string;
  calories: string;
  protein_g: string;
  descricao: string;
  image_url: string;
  alimentos: { nome: string; quantidade_g: string }[];
}

// Exercise - Exercício individual
export interface Exercise {
  id: string;
  title: string;
  muscle_group: string;
  reps: string;
  sets: string;
  weight: string;
  rest_seconds: string;
  distance_km: string;
  time_minutes: string;
  descricao: string;
  image_url: string;
}

// Estrutura do Dia (Pode conter lista de dieta OU treino)
export interface DailyEntry {
  weekday: number;
  entry_date: string;
  meals?: Meal[];        // Opcional, existe se for dieta
  exercises?: Exercise[]; // Opcional, existe se for treino
}

// WeeklyEntry - A entrada principal que vem do frontend
export interface WeeklyEntry {
  id?: number;
  student_id: number;
  professor_id: number;
  week_label: string;
  week_start_date: string;
  week_end_date: string;
  entry_type: 'exercise' | 'diet';
  created_at?: string;
  updated_at?: string;
  data: DailyEntry[]; // Aqui está a mágica: Lista de Dias
}