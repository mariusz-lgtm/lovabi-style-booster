import { PredefinedModel, CustomModel, ModelPreferences } from "@/types/models";
import emmaImage from "@/assets/model-emma.jpg";
import sofiaImage from "@/assets/model-sofia.jpg";
import mayaImage from "@/assets/model-maya.jpg";

export const PREDEFINED_MODELS: PredefinedModel[] = [
  {
    id: "emma",
    name: "Emma",
    description: "Professional European model",
    imageUrl: emmaImage,
    style: "elegant"
  },
  {
    id: "sofia",
    name: "Sofia",
    description: "Modern Mediterranean model",
    imageUrl: sofiaImage,
    style: "contemporary"
  },
  {
    id: "maya",
    name: "Maya",
    description: "Trendy street style model",
    imageUrl: mayaImage,
    style: "casual"
  }
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
