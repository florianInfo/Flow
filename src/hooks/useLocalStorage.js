import { useState, useEffect } from 'react';
import { Planner } from '../models/DataModels';

export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        const data = JSON.parse(item);
        return Planner.fromJSON(data);
      }
      return initialValue;
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value.toJSON()));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des données:', error);
    }
  };

  return [storedValue, setValue];
};
