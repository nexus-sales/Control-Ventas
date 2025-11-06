import { useContext } from 'react';
import ThemeContext from './ThemeContextContext';

export function useTheme() {
  return useContext(ThemeContext);
}
