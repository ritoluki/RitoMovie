import { useEffect, useState } from 'react';
import { SEARCH_HISTORY_KEY, cleanSearchHistory, rememberSearch } from '@/lib/searchPalette';

function readHistory() {
  try { return cleanSearchHistory(JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) || '[]')); }
  catch { return []; }
}
export function useSearchHistory() {
  const [history, setHistory] = useState(readHistory);
  useEffect(() => {
    const sync = (event: StorageEvent) => { if (event.key === SEARCH_HISTORY_KEY || event.key === null) setHistory(readHistory()); };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  const save = (next: string[]) => {
    setHistory(next);
    try { localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(next)); } catch { /* Search still works with browser storage disabled. */ }
  };
  return { history,
    remember: (keyword: string) => save(rememberSearch(readHistory(), keyword)),
    remove: (keyword: string) => save(readHistory().filter(entry => entry !== keyword)),
    clear: () => save([]),
  };
}
