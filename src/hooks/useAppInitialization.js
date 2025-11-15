import { useContext } from 'react';
import { DataContext } from '../context/DataContextDef';

export function useAppInitialization() {
  const context = useContext(DataContext);
  return { dataInitialized: context?.dataInitialized || false };
}
