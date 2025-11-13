export interface PredefinedModel {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  style: string;
  gender: 'female' | 'male';
}

export interface CustomModel {
  id: string;
  name: string;
  photos: string[]; // Original photos - kept for regeneration
  generatedPortrait?: string; // AI-generated portrait (signed URL)
  createdAt: string;
  gender: 'female' | 'male';
  // Physical description fields:
  age?: number;
  bodyType?: string; // Dynamic based on gender
  heightCm?: number;
  skinTone?: 'fair' | 'light' | 'medium' | 'olive' | 'tan' | 'brown' | 'dark';
  hairDescription?: string;
  additionalNotes?: string;
}

export type PhotoStyle = "selfie" | "studio";

export type BackgroundType = "white" | "outdoor" | "studio-grey" | "home-interior";

export interface ModelPreferences {
  selectedModelId: string;
  photoStyle: PhotoStyle;
  backgroundType?: BackgroundType;
}
