import { PredefinedModel, CustomModel, ModelPreferences } from "@/types/models";
import emmaImage from "@/assets/model-emma.jpg";
import sofiaImage from "@/assets/model-sofia.jpg";
import mayaImage from "@/assets/model-maya.jpg";
import marcusImage from "@/assets/model-marcus.jpg";
import jakeImage from "@/assets/model-jake.jpg";
import leoImage from "@/assets/model-leo.jpg";

export const PREDEFINED_MODELS: PredefinedModel[] = [
  {
    id: "emma",
    name: "Emma",
    description: "Professional European model",
    imageUrl: emmaImage,
    style: "elegant",
    gender: "female"
  },
  {
    id: "sofia",
    name: "Sofia",
    description: "Modern Mediterranean model",
    imageUrl: sofiaImage,
    style: "contemporary",
    gender: "female"
  },
  {
    id: "maya",
    name: "Maya",
    description: "Trendy street style model",
    imageUrl: mayaImage,
    style: "casual",
    gender: "female"
  }
];

export const PREDEFINED_MALE_MODELS: PredefinedModel[] = [
  {
    id: "marcus",
    name: "Marcus",
    description: "Professional Business Style",
    imageUrl: marcusImage,
    style: "professional",
    gender: "male"
  },
  {
    id: "jake",
    name: "Jake",
    description: "Casual Urban Style",
    imageUrl: jakeImage,
    style: "urban",
    gender: "male"
  },
  {
    id: "leo",
    name: "Leo",
    description: "Athletic Sporty Style",
    imageUrl: leoImage,
    style: "athletic",
    gender: "male"
  }
];

export const ALL_PREDEFINED_MODELS = [
  ...PREDEFINED_MODELS,
  ...PREDEFINED_MALE_MODELS
];

const STORAGE_KEYS = {
  CUSTOM_MODELS: "lovabi_custom_models",
  PREFERENCES: "lovabi_model_preferences"
};

export const getCustomModels = (): CustomModel[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.CUSTOM_MODELS);
  return stored ? JSON.parse(stored) : [];
};

export const saveCustomModels = (models: CustomModel[]): void => {
  localStorage.setItem(STORAGE_KEYS.CUSTOM_MODELS, JSON.stringify(models));
};

export const addCustomModel = (model: Omit<CustomModel, "id" | "createdAt">): CustomModel => {
  const models = getCustomModels();
  const newModel: CustomModel = {
    ...model,
    id: `custom_${Date.now()}`,
    createdAt: new Date().toISOString()
  };
  models.push(newModel);
  saveCustomModels(models);
  return newModel;
};

export const deleteCustomModel = (id: string): void => {
  const models = getCustomModels().filter(m => m.id !== id);
  saveCustomModels(models);
};

export const updateCustomModel = (id: string, updates: Partial<CustomModel>): void => {
  const models = getCustomModels().map(m => 
    m.id === id ? { ...m, ...updates } : m
  );
  saveCustomModels(models);
};

export const getModelPreferences = (): ModelPreferences => {
  const stored = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
  return stored ? JSON.parse(stored) : {
    selectedModelId: "emma",
    photoStyle: "studio",
    backgroundType: "white"
  };
};

export const saveModelPreferences = (preferences: ModelPreferences): void => {
  localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(preferences));
};
