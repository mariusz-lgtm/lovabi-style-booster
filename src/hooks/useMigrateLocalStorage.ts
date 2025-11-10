import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { getCustomModels, getModelPreferences } from '@/lib/mockModels';
import { toast } from 'sonner';

export const useMigrateLocalStorage = () => {
  const { user } = useAuth();
  const [migrated, setMigrated] = useState(false);

  useEffect(() => {
    const migrateData = async () => {
      if (!user || migrated) return;

      const migrationKey = `lovabi_migration_${user.id}`;
      if (localStorage.getItem(migrationKey)) return;

      try {
        const localModels = getCustomModels();
        const localPrefs = getModelPreferences();

        if (localModels.length === 0) {
          localStorage.setItem(migrationKey, 'done');
          setMigrated(true);
          return;
        }

        console.log('Starting migration of localStorage data...');

        for (const model of localModels) {
          await supabase.functions.invoke('manage-custom-model', {
            body: {
              action: 'create',
              modelName: model.name,
              photos: model.photos,
              setActive: false
            }
          });
        }

        await supabase.from('model_preferences').upsert({
          user_id: user.id,
          selected_model_id: localPrefs.selectedModelId,
          photo_style: localPrefs.photoStyle || 'studio',
          background_type: localPrefs.backgroundType || 'white'
        });

        localStorage.removeItem('lovabi_custom_models');
        localStorage.removeItem('lovabi_model_preferences');
        localStorage.setItem(migrationKey, 'done');

        toast.success('Your data has been migrated to your account!');
        setMigrated(true);
      } catch (error) {
        console.error('Migration error:', error);
      }
    };

    migrateData();
  }, [user, migrated]);

  return { migrated };
};
