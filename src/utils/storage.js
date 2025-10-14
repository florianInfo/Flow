// Utilitaires pour la sauvegarde et le chargement des données
// Utilise localStorage pour persister les données côté client

const STORAGE_KEY = 'zen-weekly-planner-data';

// Sauvegarder les données dans localStorage
export const saveData = (data) => {
  try {
    const serializedData = JSON.stringify({
      ...data,
      lastSaved: new Date().toISOString(),
      version: '1.0.0'
    });
    
    localStorage.setItem(STORAGE_KEY, serializedData);
    
    // Sauvegarder aussi une copie de sauvegarde
    const backupKey = `${STORAGE_KEY}-backup-${new Date().toISOString().split('T')[0]}`;
    localStorage.setItem(backupKey, serializedData);
    
    // Nettoyer les anciennes sauvegardes (garder seulement les 7 derniers jours)
    cleanupOldBackups();
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error);
    return false;
  }
};

// Charger les données depuis localStorage
export const loadData = () => {
  try {
    const serializedData = localStorage.getItem(STORAGE_KEY);
    
    if (!serializedData) {
      return null;
    }
    
    const data = JSON.parse(serializedData);
    
    // Vérifier la version et migrer si nécessaire
    if (data.version !== '1.0.0') {
      return migrateData(data);
    }
    
    return data;
  } catch (error) {
    console.error('Erreur lors du chargement:', error);
    
    // Essayer de charger une sauvegarde
    return loadFromBackup();
  }
};

// Charger depuis une sauvegarde
const loadFromBackup = () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const backupKey = `${STORAGE_KEY}-backup-${today}`;
    const backupData = localStorage.getItem(backupKey);
    
    if (backupData) {
      return JSON.parse(backupData);
    }
    
    return null;
  } catch (error) {
    console.error('Erreur lors du chargement de la sauvegarde:', error);
    return null;
  }
};

// Nettoyer les anciennes sauvegardes
const cleanupOldBackups = () => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(`${STORAGE_KEY}-backup-`)) {
        const dateStr = key.replace(`${STORAGE_KEY}-backup-`, '');
        const backupDate = new Date(dateStr);
        
        if (backupDate < sevenDaysAgo) {
          localStorage.removeItem(key);
        }
      }
    });
  } catch (error) {
    console.error('Erreur lors du nettoyage des sauvegardes:', error);
  }
};

// Migrer les données vers une nouvelle version
const migrateData = (data) => {
  // Pour l'instant, pas de migration nécessaire
  // Cette fonction peut être étendue pour les futures versions
  return data;
};

// Exporter les données (pour sauvegarde manuelle)
export const exportData = () => {
  const data = loadData();
  if (!data) return null;
  
  const exportData = {
    ...data,
    exportedAt: new Date().toISOString(),
    exportedBy: 'Zen Weekly Planner'
  };
  
  return JSON.stringify(exportData, null, 2);
};

// Importer les données (depuis un fichier JSON)
export const importData = (jsonString) => {
  try {
    const data = JSON.parse(jsonString);
    
    // Valider la structure des données
    if (!isValidDataStructure(data)) {
      throw new Error('Structure de données invalide');
    }
    
    // Sauvegarder les données importées
    return saveData(data);
  } catch (error) {
    console.error('Erreur lors de l\'importation:', error);
    return false;
  }
};

// Valider la structure des données
const isValidDataStructure = (data) => {
  return (
    data &&
    typeof data === 'object' &&
    Array.isArray(data.activities) &&
    typeof data.schedule === 'object' &&
    typeof data.statistics === 'object'
  );
};

// Obtenir les informations de stockage
export const getStorageInfo = () => {
  try {
    const data = loadData();
    if (!data) {
      return {
        hasData: false,
        lastSaved: null,
        activitiesCount: 0,
        storageSize: 0
      };
    }
    
    const serializedData = localStorage.getItem(STORAGE_KEY);
    const storageSize = serializedData ? serializedData.length : 0;
    
    return {
      hasData: true,
      lastSaved: data.lastSaved,
      activitiesCount: data.activities?.length || 0,
      storageSize: storageSize,
      version: data.version || '1.0.0'
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des informations:', error);
    return {
      hasData: false,
      lastSaved: null,
      activitiesCount: 0,
      storageSize: 0
    };
  }
};

// Effacer toutes les données
export const clearAllData = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    
    // Effacer aussi les sauvegardes
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(`${STORAGE_KEY}-backup-`)) {
        localStorage.removeItem(key);
      }
    });
    
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'effacement des données:', error);
    return false;
  }
};
