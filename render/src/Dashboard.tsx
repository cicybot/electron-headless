
import React, { useState, useEffect, useCallback } from 'react';
import { useRpc } from './RpcContext';
import { ConnectionManager } from './ConnectionManager';
import { IconAlert } from './Icons';
import { WindowMap } from './types';
import View from './View';

export const Dashboard = () => {
  const { rpc } = useRpc();

  useEffect(() => {
    document.title = "ElectronMcp";
  }, []);

   // Dashboard State
   const [windows, setWindows] = useState<WindowMap>({});
   const [connectionError, setConnectionError] = useState<string | null>(null);

  // Create Window State
  const [newUrl, setNewUrl] = useState('https://www.google.com');
  const [newAccountIdx, setNewAccountIdx] = useState(0);
  const [isCreating, setIsCreating] = useState(false);

  const fetchWindows = useCallback(async () => {
    try {
      const data = await rpc<WindowMap>('getWindows');
       setWindows(data || {});
       setConnectionError(null);
    } catch (e: unknown) {
      // Only console error if it's NOT a known connection error to reduce noise
      const error = e instanceof Error ? e : new Error(String(e));
      if (!error.message.includes("Connection failed") && !error.message.includes("Invalid Server Response")) {
        console.error(e);
      }
      setConnectionError(error.message || "Failed to connect");
    }
  }, [rpc]);

  useEffect(() => {
    setWindows({}); // Clear windows state when RPC client changes to remove stale data
    setConnectionError(null);
    fetchWindows();
    const interval = setInterval(fetchWindows, 3000); // Poll every 3s
    return () => clearInterval(interval);
  }, [fetchWindows]);

  const handleOpenWindow = async () => {
    setIsCreating(true);
    try {
      await rpc('openWindow', {
        account_index: newAccountIdx,
        url: newUrl,
        options: {
          width: 1280,
          webPreferences: {
            webviewTag: true,
          }
        },
        others: {
          openDevtools: {
            mode: false
          }
        }
      });
      await fetchWindows();
    } catch (e) {
      alert('Failed to open window: ' + e);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSelectWindow = async (id: number, url: string) => {
    try {
      // Open window detail page in new browser tab with win_id parameter
      const detailUrl = `${window.location.origin}/render?win_id=${id}&url=${encodeURIComponent(url)}`;
      window.open(detailUrl, '_blank');
    } catch (e) {
      console.error('Failed to open detail page:', e);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
        <div className="flex items-center gap-2">
          <h1 className="font-bold text-lg">ElectronMcp</h1>
          <span className="badge text-secondary">v1.1</span>
        </div>
        <div>
          <ConnectionManager />
        </div>
      </header>

      {/* Connection Error Banner */}
      {connectionError && (
        <div className="bg-danger/10 border-b border-danger/20 text-danger p-2 text-xs flex items-center justify-center gap-2">
          <IconAlert />
          <span className="font-semibold">{connectionError}</span>
          <button className="underline hover:text-white ml-2" onClick={() => window.location.reload()}>Retry</button>
        </div>
      )}

      <div className="main-content scroll-y p-4">

        {/* Create Bar */}
        <div className="card p-4 mb-6 flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-xs text-secondary mb-1">URL</label>
            <input
              className="input w-full"
              value={newUrl}
              onChange={e => setNewUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div style={{ width: '120px' }}>
            <label className="block text-xs text-secondary mb-1">Account</label>
            <input
              type="number"
              className="input w-full"
              value={newAccountIdx}
              onChange={e => setNewAccountIdx(Number(e.target.value))}
            />
          </div>
          <button
            className="btn btn-primary"
            onClick={handleOpenWindow}
            disabled={isCreating}
          >
            {isCreating ? 'Launching...' : 'Open'}
          </button>
          <View w={12}></View>
          <button
              className="btn btn-success"
              onClick={()=>{
                try {
                  const detailUrl = `${window.location.origin}/render?desktop=1`;
                  window.open(detailUrl, '_blank');
                } catch (e) {
                  console.error('Failed to open detail page:', e);
                }
              }}
          >
            Desktop
          </button>
        </div>

        {/* Window List */}
        <h2 className="text-lg font-bold mb-4">Active Sessions</h2>
        {Object.keys(windows).length === 0 ? (
          <div className="text-secondary text-center p-12 border border-dashed border-border rounded-lg">
            {connectionError ? (
              <div className="text-danger opacity-80">Connection lost. Check server status.</div>
            ) : (
              "No active windows found. Use the control bar above to launch a new session."
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {Object.entries(windows).map(([accIdx, sites]) => (
              <div key={accIdx} className="card flex flex-col">
                <div className="p-3 border-b border-border bg-hover flex justify-between items-center" style={{ background: 'var(--bg-hover)' }}>
                  <span className="font-mono font-bold text-sm">Account #{accIdx}</span>
                  <span className="badge">{Object.keys(sites).length} Sessions</span>
                </div>
                <div className="p-2">
                  {Object.entries(sites).map(([url, info]) => (
                    <div
                      key={info.id}
                      className="p-3 border border-border rounded mb-2 cursor-pointer hover:bg-hover transition-colors"
                      onClick={() => handleSelectWindow(info.id, url)}
                      style={{ background: 'var(--bg-card)',marginBottom:16 }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-mono text-sm font-semibold">win_id: {info.id}</div>
                          <div className="text-xs text-secondary truncate" style={{ maxWidth: '500px' }}>
                            {url}
                          </div>
                        </div>
                        <div className="badge font-mono" style={{fontSize: '0.7rem'}}>
                          #{info.id}
                        </div>
                      </div>
                      {info.bounds && (
                        <div className="flex gap-4 text-xs font-mono text-secondary">
                          <span>📐 {info.bounds.width}×{info.bounds.height}</span>
                          <span>📍 ({info.bounds.x}, {info.bounds.y})</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
