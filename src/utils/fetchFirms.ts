import { Firm } from '@/types/firm';

export async function fetchFirms(): Promise<Firm[]> {
  const response = await fetch('/data/firms.json');
  if (!response.ok) {
    throw new Error('Failed to fetch firms data');
  }
  const data: Firm[] = await response.json();
  return data;
}