import { useContext } from 'react';
import { DataCtx } from '../context/contexts';

export function useData() {
  const context = useContext(DataCtx);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
