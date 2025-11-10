export interface PredefinedModel {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  style: string;
}

export interface CustomModel {
  id: string;
  name: string;
  photos: string[]; // base64 data URLs
  createdAt: string;
}

export type PhotoStyle = "selfie" | "studio";

export type BackgroundType = "white" | "outdoor" | "studio-grey" | "home-interior";

export interface ModelPreferences {
  selectedModelId: string;
  photoStyle: PhotoStyle;
  backgroundType?: BackgroundType;
}
