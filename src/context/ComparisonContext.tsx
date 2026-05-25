import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Specialty } from '../data/specialties';

const MAX_COMPARE = 3;

interface ComparisonContextType {
  items: Specialty[];
  isInComparison: (id: string) => boolean;
  toggleComparison: (spec: Specialty) => boolean; // returns false if max reached
  clearComparison: () => void;
  showModal: boolean;
  setShowModal: (v: boolean) => void;
}

const ComparisonContext = createContext<ComparisonContextType>({
  items: [],
  isInComparison: () => false,
  toggleComparison: () => false,
  clearComparison: () => {},
  showModal: false,
  setShowModal: () => {},
});

export function ComparisonProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Specialty[]>([]);
  const [showModal, setShowModal] = useState(false);

  const isInComparison = useCallback(
    (id: string) => items.some(i => i.id === id),
    [items]
  );

  const toggleComparison = useCallback(
    (spec: Specialty): boolean => {
      const exists = items.some(i => i.id === spec.id);
      if (exists) {
        setItems(prev => prev.filter(i => i.id !== spec.id));
        return true;
      }
      if (items.length >= MAX_COMPARE) return false;
      setItems(prev => [...prev, spec]);
      return true;
    },
    [items]
  );

  const clearComparison = useCallback(() => setItems([]), []);

  return (
    <ComparisonContext.Provider value={{ items, isInComparison, toggleComparison, clearComparison, showModal, setShowModal }}>
      {children}
    </ComparisonContext.Provider>
  );
}

export function useComparison() {
  return useContext(ComparisonContext);
}
