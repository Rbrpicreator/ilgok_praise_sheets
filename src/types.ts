export interface Sheet {
  id: string;
  title: string;
  chord: string;
  imageUrl: string;
  createdAt: number;
}

export interface Setlist {
  id: string;
  title: string;
  date: string;
  sheetIds: string[];
}

export type ViewState = 'landing' | 'search' | 'setlist' | 'upload' | 'create_setlist';
