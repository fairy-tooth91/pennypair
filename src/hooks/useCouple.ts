import { useContext } from 'react';
import { CoupleContext } from '../context/CoupleContext';

export function useCouple() {
  const context = useContext(CoupleContext);
  if (!context) throw new Error('useCouple must be used within CoupleProvider');
  return context;
}
