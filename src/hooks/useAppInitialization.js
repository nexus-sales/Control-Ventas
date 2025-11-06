import { useContext } from 'react';
import { DataCtx } from '../context/contexts';

export function useAppInitialization() {
  const context = useContext(DataCtx);
  return { dataInitialized: context?.dataInitialized || false };
}
