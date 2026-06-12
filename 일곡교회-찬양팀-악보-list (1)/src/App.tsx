import React, { useState, useEffect } from 'react';
import LandingView from './components/LandingView';
import SearchView from './components/SearchView';
import SetlistView from './components/SetlistView';
import UploadView from './components/UploadView';
import CreateSetlistView from './components/CreateSetlistView';
import ViewerModal from './components/ViewerModal';
import { ViewState, Sheet, Setlist } from './types';
import { getStoredSetlists, saveSetlists } from './store';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('landing');
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [setlists, setSetlists] = useState<Setlist[]>([]);
  
  const [viewerSheets, setViewerSheets] = useState<Sheet[]>([]);
  const [viewerInitialIndex, setViewerInitialIndex] = useState<number>(0);
  const [confirmDialog, setConfirmDialog] = useState<{message: string, onConfirm: () => void} | null>(null);

  const fetchSheets = async () => {
    try {
      const res = await fetch('/api/sheets');
      const data = await res.json();
      if (Array.isArray(data)) {
        setSheets(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSheets();
    setSetlists(getStoredSetlists());
  }, []);

  const handleNavigate = (view: ViewState) => {
    setCurrentView(view);
    window.scrollTo(0, 0);
  };

  const handleUploadComplete = () => {
    fetchSheets();
    handleNavigate('landing');
  };

  const handleDeleteSheet = (id: string) => {
    setConfirmDialog({
      message: '정말로 이 악보를 삭제하시겠습니까?',
      onConfirm: async () => {
        try {
          await fetch('/api/sheets', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pathname: id })
          });
          
          fetchSheets();
          
          const updatedSetlists = setlists.map(sl => ({
             ...sl,
             sheetIds: sl.sheetIds.filter(sid => sid !== id)
          }));
          setSetlists(updatedSetlists);
          saveSetlists(updatedSetlists);
        } catch (e) {
          console.error(e);
        }
      }
    });
  };

  const handleCreateSetlist = (title: string, date: string, sheetIds: string[]) => {
    const newSetlist: Setlist = {
      id: Date.now().toString(),
      title,
      date,
      sheetIds
    };
    const updated = [newSetlist, ...setlists];
    setSetlists(updated);
    saveSetlists(updated);
    handleNavigate('setlist');
  };

  const handleDeleteSetlist = (id: string) => {
    setConfirmDialog({
      message: '이 콘티를 삭제하시겠습니까?',
      onConfirm: () => {
        const updated = setlists.filter(sl => sl.id !== id);
        setSetlists(updated);
        saveSetlists(updated);
      }
    });
  };

  const handleReorderSetlist = (setlistId: string, fromIndex: number, toIndex: number) => {
    const updatedSetlists = setlists.map(sl => {
      if (sl.id === setlistId) {
        const newSheetIds = Array.from(sl.sheetIds);
        const [moved] = newSheetIds.splice(fromIndex, 1);
        newSheetIds.splice(toIndex, 0, moved);
        return { ...sl, sheetIds: newSheetIds };
      }
      return sl;
    });
    setSetlists(updatedSetlists);
    saveSetlists(updatedSetlists);
  };

  const openViewer = (sheetsToView: Sheet[], initialIndex: number = 0) => {
    setViewerSheets(sheetsToView);
    setViewerInitialIndex(initialIndex);
  };

  const closeViewer = () => {
    setViewerSheets([]);
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans selection:bg-zinc-900 selection:text-white">
      
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-100 transition-all">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div 
            className="font-bold text-xl tracking-tight cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => handleNavigate('landing')}
          >
            일곡교회<span className="font-light">_찬양팀_악보List</span>
          </div>
          <div className="flex gap-6 items-center">
             <button 
                onClick={() => handleNavigate('search')}
                className={`text-sm font-medium transition-colors hidden sm:block ${currentView === 'search' ? 'text-zinc-900 font-bold' : 'text-zinc-500 hover:text-zinc-900'}`}
              >
                전체 악보
            </button>
            <button 
                onClick={() => handleNavigate('setlist')}
                className={`text-sm font-medium transition-colors hidden sm:block ${currentView === 'setlist' ? 'text-zinc-900 font-bold' : 'text-zinc-500 hover:text-zinc-900'}`}
              >
                주간 콘티
            </button>
            <button className="text-sm font-medium hover:text-zinc-500 transition-colors">
              문의하기
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main>
        {currentView === 'landing' && <LandingView onNavigate={handleNavigate} />}
        
        {currentView === 'search' && (
          <SearchView 
            sheets={sheets} 
            onNavigate={() => handleNavigate('landing')} 
            onOpenViewer={openViewer} 
            onDeleteSheet={handleDeleteSheet}
          />
        )}
        
        {currentView === 'setlist' && (
          <SetlistView 
            setlists={setlists} 
            sheets={sheets} 
            onNavigate={() => handleNavigate('landing')}
            onOpenViewer={openViewer} 
            onCreateSetlist={() => handleNavigate('create_setlist')}
            onDeleteSetlist={handleDeleteSetlist}
            onReorderSetlist={handleReorderSetlist}
          />
        )}

        {currentView === 'create_setlist' && (
          <CreateSetlistView 
            sheets={sheets} 
            onNavigate={() => handleNavigate('setlist')}
            onCreate={handleCreateSetlist}
          />
        )}
        
        {currentView === 'upload' && (
          <UploadView 
            onUploadComplete={handleUploadComplete}
            onNavigate={() => handleNavigate('landing')}
          />
        )}
      </main>

      {/* Global Sheet Viewer Modal */}
      <ViewerModal 
        sheets={viewerSheets} 
        initialIndex={viewerInitialIndex}
        onClose={closeViewer} 
      />

      {/* Confirm Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white p-6 rounded-2xl max-w-sm w-full mx-4 shadow-2xl">
            <h3 className="font-bold text-lg mb-4 text-zinc-900">{confirmDialog.message}</h3>
            <div className="flex justify-end gap-3 mt-8">
              <button 
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 text-zinc-500 font-medium hover:text-zinc-900 transition-colors"
              >
                취소
              </button>
              <button 
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(null);
                }}
                className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors"
              >
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
