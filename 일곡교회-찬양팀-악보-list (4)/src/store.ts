import { Sheet, Setlist } from './types';

const STORAGE_KEY_SHEETS = 'worship_sheets';
const STORAGE_KEY_SETLISTS = 'worship_setlists';

export const getStoredSheets = (): Sheet[] => {
  const data = localStorage.getItem(STORAGE_KEY_SHEETS);
  return data ? JSON.parse(data) : MOCK_SHEETS;
};

export const getStoredSetlists = (): Setlist[] => {
  const data = localStorage.getItem(STORAGE_KEY_SETLISTS);
  return data ? JSON.parse(data) : MOCK_SETLISTS;
};

export const saveSheets = (sheets: Sheet[]) => {
  try {
    localStorage.setItem(STORAGE_KEY_SHEETS, JSON.stringify(sheets));
  } catch (e) {
    console.warn("Storage quota exceeded, could not save sheet.");
  }
};

export const saveSetlists = (setlists: Setlist[]) => {
  localStorage.setItem(STORAGE_KEY_SETLISTS, JSON.stringify(setlists));
};

const MOCK_SHEETS: Sheet[] = [
  {
    id: '1',
    title: '은혜 (Grace)',
    chord: 'G',
    imageUrl: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?q=80&w=800&auto=format&fit=crop',
    createdAt: Date.now() - 10000,
  },
  {
    id: '2',
    title: '시선 (My Gaze)',
    chord: 'A',
    imageUrl: 'https://images.unsplash.com/photo-1544377926-258074dffb29?q=80&w=800&auto=format&fit=crop',
    createdAt: Date.now() - 20000,
  },
  {
    id: '3',
    title: '내 모든 삶의 행동 주 안에 (Every Move I Make)',
    chord: 'G',
    imageUrl: 'https://images.unsplash.com/photo-1470229722913-7c092bb2144d?q=80&w=800&auto=format&fit=crop',
    createdAt: Date.now() - 30000,
  }
];

const MOCK_SETLISTS: Setlist[] = [
  {
    id: '1',
    title: '주일 3부 예배 콘티',
    date: new Date().toISOString().split('T')[0],
    sheetIds: ['1', '2', '3']
  }
];
