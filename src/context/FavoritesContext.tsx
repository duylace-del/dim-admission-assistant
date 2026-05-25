import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Specialty } from '../data/specialties';

interface FavoritesContextType {
  favorites: Specialty[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (spec: Specialty) => void;
  clearFavorites: () => void;
}

const FavoritesContext = createContext<FavoritesContextType>({
  favorites: [],
  isFavorite: () => false,
  toggleFavorite: () => {},
  clearFavorites: () => {},
});

const STORAGE_KEY = 'dim_favorites';

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<Specialty[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const persist = (items: Specialty[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    setFavorites(items);
  };

  const isFavorite = useCallback(
    (id: string) => favorites.some(f => f.id === id),
    [favorites]
  );

  const toggleFavorite = useCallback(
    (spec: Specialty) => {
      const exists = favorites.some(f => f.id === spec.id);
      if (exists) {
        persist(favorites.filter(f => f.id !== spec.id));
      } else {
        persist([...favorites, spec]);
      }
    },
    [favorites]
  );

  const clearFavorites = useCallback(() => persist([]), []);

  return (
    <FavoritesContext.Provider value={{ favorites, isFavorite, toggleFavorite, clearFavorites }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  return useContext(FavoritesContext);
}
