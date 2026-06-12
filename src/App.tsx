import React, { useState, useEffect } from 'react';
import LandingView from './components/LandingView';
import SearchView from './components/SearchView';
import SetlistView from './components/SetlistView';
import UploadView from './components/UploadView';
import CreateSetlistView from './components/CreateSetlistView';
import ViewerModal from './components/ViewerModal';
import { ViewState, Sheet, Setlist } from './types';
import { getStoredSetlists, saveSetlists } from './store';
import { initAuth, googleSignIn, logout, getAccessToken } from './auth';
import { getSheetsFromDrive, fetchFileContentBase64, deleteFromDrive } from './drive';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('landing');
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [setlists, setSetlists] = useState<Setlist[]>([]);
  
  const [viewerSheets, setViewerSheets] = useState<Sheet[]>([]);
  const [viewerInitialIndex, setViewerInitialIndex] = useState<number>(0);
  const [confirmDialog, setConfirmDialog] = useState<{message: string, onConfirm: () => void} | null>(null);

  const [needsAuth, setNeedsAuth] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize Auth
  useEffect(() => {
    const unsubscribe = initAuth(
      () => {
        setNeedsAuth(false);
        fetchSheets();
      },
      () => {
        setNeedsAuth(true);
        setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setNeedsAuth(false);
        fetchSheets();
      }
    } catch (err: any) {
      console.error('Login failed:', err);
      alert('로그인에 실패했습니다. (API 키 누락 등 환경 설정 문제일 수 있습니다): ' + (err.message || ''));
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setSheets([]);
  };

  const fetchSheets = async () => {
    try {
      setIsLoading(true);
      const token = await getAccessToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      const files = await getSheetsFromDrive();
      const loadedSheets: Sheet[] = files.map((file: any) => ({
        id: file.id,
        title: file.appProperties?.title || file.name,
        chord: file.appProperties?.chord || 'C',
        // Instead of fetching base64 for everyone on load (which is too slow),
        // we store the ID and fetch the image dynamically when rendering, 
        // OR we use the thumbnailLink for list view.
        imageUrl: file.thumbnailLink || `/api/dl?id=${file.id}`, 
        createdAt: new Date(file.createdTime).getTime(),
        mimeType: file.mimeType
      }));
      setSheets(loadedSheets.sort((a, b) => b.createdAt - a.createdAt));
    } catch (err) {
      console.error(err);
      if (err instanceof Error && err.message.includes("missing")) {
        setNeedsAuth(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
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
      message: '정말로 이 악보를 구글 드라이브에서 삭제하시겠습니까?',
      onConfirm: async () => {
        try {
          await deleteFromDrive(id);
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

  const openViewer = async (sheetsToView: Sheet[], initialIndex: number = 0) => {
    // Before opening, fetch full high-res content for the sheets since thumbnailLink is low res.
    const fullSheets = [...sheetsToView];
    try {
      // Lazy load the full content just for the initial image, or all if small
      const sheet = fullSheets[initialIndex];
      if (sheet.imageUrl && sheet.imageUrl.includes('googleusercontent.com')) {
         sheet.imageUrl = await fetchFileContentBase64(sheet.id, sheet.mimeType || 'image/jpeg');
      }
    } catch(e) {
      console.error(e);
    }
    setViewerSheets(fullSheets);
    setViewerInitialIndex(initialIndex);
  };

  const closeViewer = () => {
    setViewerSheets([]);
  };

  if (needsAuth) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
        <h1 className="text-3xl font-bold tracking-tight mb-2">일곡교회 찬양팀 악보 데이터베이스</h1>
        <p className="text-zinc-500 mb-8 max-w-sm">악보 데이터를 구글 드라이브와 동기화하여 언제 어디서든 접근할 수 있습니다.</p>
        
        <button 
          onClick={handleLogin}
          disabled={isLoggingIn}
          className="flex items-center gap-3 px-6 py-3 bg-white border border-zinc-200 rounded-full shadow-sm hover:shadow-md hover:bg-zinc-50 transition-all font-medium text-zinc-700 disabled:opacity-50"
        >
          {isLoggingIn ? (
            <span className="animate-pulse">로그인 중...</span>
          ) : (
            <>
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                <path fill="none" d="M0 0h48v48H0z"></path>
              </svg>
              Google 계정으로 계속
            </>
          )}
        </button>
      </div>
    );
  }

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
            <button onClick={handleLogout} className="text-sm font-medium text-red-500 hover:text-red-600 transition-colors">
              로그아웃
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main>
        {isLoading ? (
          <div className="flex items-center justify-center p-24">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900"></div>
          </div>
        ) : (
          <>
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
          </>
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
