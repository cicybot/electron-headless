
import React, { useState, useEffect } from 'react';
import { useRpc } from './RpcContext';
import { NetworkLog } from './types';
import { IconArrowLeft, IconRefresh, IconCamera, IconPlay, IconTrash } from './Icons';
import View from './View';

export const WindowDetail = ({ windowId, initialUrl, onBack }: { windowId: number, initialUrl: string, onBack: () => void }) => {
    const { rpc, rpcBaseUrl } = useRpc();
    const [currentUrl, setCurrentUrl] = useState(initialUrl);
    const [navUrl, setNavUrl] = useState(initialUrl);
    const [screenshotUrl, setScreenshotUrl] = useState<string>('');

    // JS Exec State
    const [jsCode, setJsCode] = useState(`(() => { 
    return document.title;
})()`);
    const [evalResult, setEvalResult] = useState<string>('');
    const [isAutoRefresh, setIsAutoRefresh] = useState(false);

    // Network State
    const [requests, setRequests] = useState<NetworkLog[]>([]);
    const [activeTab, setActiveTab] = useState<'console' | 'network'>('console');
    const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);
    const [urlFilter, setUrlFilter] = useState('');

    const refreshScreenshot = () => setScreenshotUrl('');

    // Consolidated Refresh Loop
    useEffect(() => {
        let interval: any;

        const tick = async () => {
            if (isAutoRefresh) refreshScreenshot();

            // Poll Network requests
            if (activeTab === 'network') {
                try {
                    const logs = await rpc<NetworkLog[]>('getRequests', { win_id: windowId });
                    if (Array.isArray(logs)) {
                        let filtered = logs;
                        if (urlFilter) {
                            const lowerFilter = urlFilter.toLowerCase();
                            filtered = filtered.filter(l => l.url.toLowerCase().includes(lowerFilter));
                        }
                        setRequests(filtered.reverse().slice(0, 100));
                    }
                } catch (e) {
                    // Silent catch for polling
                }
            }
        };

        // Initial fetch
        tick();

        interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [isAutoRefresh, activeTab, windowId, rpc, urlFilter]);

    const handleReload = async () => {
        await rpc('reload', { win_id: windowId });
        setTimeout(refreshScreenshot, 500); // Delay for render
    };

    const handleNavigate = async () => {
        await rpc('loadURL', { win_id: windowId, url: navUrl });
        setCurrentUrl(navUrl);
        setTimeout(refreshScreenshot, 1000);
    };

    const handleEval = async () => {
        try {
            const res = await rpc('executeJavaScript', { win_id: windowId, code: jsCode });
            setEvalResult(JSON.stringify(res, null, 2));
            refreshScreenshot();
        } catch (e: any) {
            setEvalResult('Error: ' + e.message);
        }
    };

    const getMethodColor = (method: string) => {
        switch (method) {
            case 'GET': return 'text-success';
            case 'POST': return 'text-warning';
            case 'DELETE': return 'text-danger';
            case 'PUT': return 'text-secondary';
            default: return 'text-primary';
        }
    };

    const removeLogin = async () => {
        const code = `document.querySelectorAll('div[id^="login-full-panel-"]').forEach(el => el.remove());`
        await rpc('executeJavaScript', { win_id: windowId, code });
        setTimeout(refreshScreenshot, 500);
    }

    // Auto-fetch screenshot as blob URL
    useEffect(() => {
        let interval: any;

        const fetchScreenshot = async () => {
            try {
                const url = (rpcBaseUrl ? `${rpcBaseUrl}/screenshot` : '/screenshot') + `?id=${windowId}&t=${Date.now()}`;
                const response = await fetch(url);
                if (response.ok) {
                    const arrayBuffer = await response.arrayBuffer();
                    const blob = new Blob([arrayBuffer], { type: 'image/png' });
                    const blobUrl = URL.createObjectURL(blob);
                    setScreenshotUrl(blobUrl);
                }
            } catch (error) {
                console.error('Failed to fetch screenshot:', error);
            }
        };

        // Initial fetch
        fetchScreenshot();

        // Set up interval for auto-refresh
        interval = setInterval(fetchScreenshot, 1000);

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [windowId, rpcBaseUrl]);

    return (
        <div className="flex flex-col h-full">
            {/* Toolbar */}
            <div className="p-2 border-b border-border flex gap-2 items-center bg-card">
                <button className="btn btn-icon" onClick={onBack} title="Back">
                    <IconArrowLeft />
                </button>
                <div className="flex-1 flex gap-2">
                    <input
                        style={{ width: "600px" }}
                        className="input flex-1 font-mono text-sm"
                        value={navUrl}
                        onChange={e => setNavUrl(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleNavigate()}
                    />
                    <button className="btn" onClick={handleNavigate}>Go</button>
                </div>
                <div className="w-px h-6 bg-border mx-2"></div>
                <button className="btn btn-sm" onClick={async () => {
                    await rpc('showWindow', { win_id: windowId });
                }} title="Active Window">
                    Active
                </button>
                <button className="btn btn-sm" onClick={async () => {
                    await rpc('closeWindow', { win_id: windowId });
                }} title="Close Window">
                    Close
                </button>
                <button className="btn btn-sm" onClick={async () => {
                    await rpc('hideWindow', { win_id: windowId });
                }} title="Hide Window">
                    Hide
                </button>
                <button className="btn btn-icon" onClick={handleReload} title="Reload Page">
                    <IconRefresh />
                </button>
                <button className="btn btn-sm" onClick={async () => {
                    await rpc('executeJavaScript', { win_id: windowId, code: 'location.reload()' });
                }} title="Reload via JavaScript">
                    JS Reload
                </button>
            </div>
            <View relative w100p h="calc(100vh - 134px)">
                <div className="relative flex-1 h-full">
                    <div className="absolute inset-0 right-[300px] flex items-center justify-center p-3 bg-black">
                        <div className="absolute top-0 left-0 right-0 px-3 py-2 bg-black border-b border-gray-700">
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-gray-400 text-sm uppercase tracking-wide">Live Preview</h3>
                                <div className="flex gap-2 items-center">
                                    <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                                        <input type="checkbox" checked={isAutoRefresh} onChange={e => setIsAutoRefresh(e.target.checked)} />
                                        Auto-Refresh
                                    </label>
                                    <button className="btn btn-sm btn-icon" onClick={refreshScreenshot}>
                                        <IconCamera />
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="absolute inset-3 rounded-lg overflow-hidden bg-gray-900 border border-gray-700">
                            <img
                                src={screenshotUrl || ''}
                                alt="Window Screenshot"
                                className="preview-img w-full h-full"
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '100%',
                                    height: 'auto',
                                    objectFit: 'contain'
                                }}
                            />
                        </div>
                    </div>
                    <div className="absolute inset-y-0 right-0 w-[300px] bg-gray-900 p-3">
                        <button onClick={removeLogin} className="btn btn-sm w-full">Remove Login</button>
                    </div>
                </div>
            </View>
            <div className="flex flex-1 overflow-hidden" style={{ display: "none" }} >

                {/* Left: Visual - Fixed Width */}
                <div className="flex-shrink-0 p-4 bg-root flex flex-col gap-4 scroll-y" style={{

                    borderRight: '1px solid var(--border)',
                    width: "600px"
                }}>

                    <div className="flex-1 flex items-center justify-center bg-black rounded border border-border overflow-hidden">
                        <img
                            src={screenshotUrl || ''}
                            alt="Window Screenshot"
                            className="preview-img"
                            style={{
                                width: '800px',
                                maxWidth: '100%',
                                maxHeight: '100%',
                                height: 'auto',
                                objectFit: 'contain'
                            }}
                        />
                    </div>
                </div>

                {/* Right: Tools Panel - Flexible */}
                <div style={{ width: "calc(100vw - 600px)" }} className="flex-1 min-w-0 bg-card flex flex-col border-l border-border">
                    {/* Tabs */}
                    <div className="flex border-b border-border bg-bg-root" >
                        <div
                            className={`tab-btn ${activeTab === 'console' ? 'active' : ''}`}
                            onClick={() => setActiveTab('console')}
                        >
                            Console
                        </div>
                        <div
                            className={`tab-btn ${activeTab === 'network' ? 'active' : ''}`}
                            onClick={() => setActiveTab('network')}
                        >
                            Network
                        </div>
                    </div>

                    <div className="flex-1 overflow-hidden flex flex-col">
                        {activeTab === 'console' ? (
                            <div className="p-4 flex flex-col h-full gap-4 scroll-y">
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="font-bold text-sm">Execute JavaScript</h3>
                                        <button className="btn btn-primary btn-sm flex items-center gap-1" style={{ padding: '2px 8px', fontSize: '0.75rem' }} onClick={handleEval}>
                                            <IconPlay /> Run
                                        </button>
                                    </div>
                                    <textarea
                                        className="code-editor"
                                        value={jsCode}
                                        onChange={e => setJsCode(e.target.value)}
                                        spellCheck={false}
                                    />
                                </div>

                                <div className="flex-1 flex flex-col min-h-0">
                                    <h3 className="font-bold text-sm mb-2">Output</h3>
                                    <div className="flex-1 bg-code-bg border border-border p-2 rounded overflow-auto font-mono text-xs text-success whitespace-pre-wrap">
                                        {evalResult || <span className="text-secondary opacity-50">// Execution results will appear here...</span>}
                                    </div>
                                </div>

                                <div className="p-3 border border-border rounded bg-root text-xs text-secondary mt-auto">
                                    <div className="flex justify-between mb-1">
                                        <span>Window ID:</span>
                                        <span className="font-mono text-white">{windowId}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Initial URL:</span>
                                        <span className="font-mono text-white truncate max-w-[200px]" title={initialUrl}>{initialUrl}</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col h-full">
                                <div className="p-2 border-b border-border bg-hover flex gap-2">
                                    <input
                                        className="input flex-1 py-1 text-xs"
                                        placeholder="Filter URLs..."
                                        value={urlFilter}
                                        onChange={e => setUrlFilter(e.target.value)}
                                    />
                                    <button className="btn btn-sm btn-icon" onClick={async () => {
                                        try {

                                            await rpc<NetworkLog[]>('clearRequests', {});
                                        } catch (e) {
                                        } finally {
                                            setRequests([])
                                        }
                                    }} title="Clear Log">
                                        <IconTrash />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-auto">
                                    {requests.length === 0 ? (
                                        <div className="text-center text-secondary text-xs p-8">No requests logged yet</div>
                                    ) : (
                                        requests.map(req => (
                                            <div key={req.id} className="border-b border-border">
                                                <div
                                                    className="p-2 hover:bg-hover cursor-pointer flex gap-2 items-center text-xs"
                                                    onClick={() => setExpandedRequestId(expandedRequestId === req.id ? null : req.id)}
                                                >
                                                    <span className={`font-bold w-12 shrink-0 ${getMethodColor(req.method)}`}>{req.method}</span>
                                                    <span className="flex-1 truncate font-mono opacity-80" title={req.url}>{req.url}</span>
                                                    <span className="text-secondary shrink-0" style={{ fontSize: '0.65rem' }}>
                                                        {new Date(req.timestamp).toLocaleTimeString()}
                                                    </span>
                                                </div>
                                                {expandedRequestId === req.id && (
                                                    <div className="bg-code-bg p-2 text-xs font-mono border-t border-border overflow-auto max-h-48 whitespace-pre-wrap select-all">

                                                        <div className="mb-2 text-secondary">ID: {req.id}</div>

                                                        <div className="mb-2 text-secondary">URL: {req.url}</div>

                                                        {req.requestHeaders && (
                                                            <div>
                                                                <div className="font-bold text-primary mb-1">Request Headers:</div>
                                                                {Object.entries(req.requestHeaders).map(([k, v]) => (
                                                                    <div key={k}><span className="text-accent">{k}:</span> {v}</div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
