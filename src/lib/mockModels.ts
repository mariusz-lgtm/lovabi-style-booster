import { PredefinedModel, CustomModel, ModelPreferences } from "@/types/models";

export const PREDEFINED_MODELS: PredefinedModel[] = [
  {
    id: "emma",
    name: "Emma",
    description: "Professional European model",
    imageUrl: "/placeholder.svg",
    style: "elegant"
  },
  {
    id: "sofia",
    name: "Sofia",
    description: "Modern Mediterranean model",
    imageUrl: "/placeholder.svg",
    style: "contemporary"
  },
  {
    id: "maya",
    name: "Maya",
    description: "Trendy street style model",
    imageUrl: "/placeholder.svg",
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
    photoStyle: "studio"
  };
};

export const saveModelPreferences = (preferences: ModelPreferences): void => {
  localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(preferences));
};
