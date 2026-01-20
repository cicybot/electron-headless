
import React, { useState, useEffect } from 'react';

interface WindowThumbnailProps { 
    id: number; 
    url: string; 
    refreshKey: number; 
    onClick: () => void; 
    rpcBaseUrl: string; 
}

export const WindowThumbnail: React.FC<WindowThumbnailProps> = ({ id, url, refreshKey, onClick, rpcBaseUrl }) => {
    const hostname = new URL(url).hostname;
    // Construct the target URL with timestamp
    const targetUrl = (rpcBaseUrl ? `${rpcBaseUrl}/windowScreenshot` : '/windowScreenshot') + `?id=${id}&t=${refreshKey}`;
    
    // State to hold the URL currently rendered in the DOM
    const [displayedUrl, setDisplayedUrl] = useState<string | null>(null);

    // Preloader effect: Fetch the new image in background, update displayedUrl only when loaded.
    useEffect(() => {
        let mounted = true;
        const img = new Image();
        img.src = targetUrl;
        img.onload = () => {
            if (mounted) setDisplayedUrl(targetUrl);
        };
        img.onerror = () => {
            // Even on error, update to targetUrl (could show broken image or retry)
            // ensuring we don't get stuck on an old frame indefinitely.
            if (mounted) setDisplayedUrl(targetUrl);
        }
        return () => { mounted = false; };
    }, [targetUrl]);

    // Initial load check: displayedUrl is null until the first image loads
    const isReady = displayedUrl !== null;

    return (
        <div 
            className="window-thumb" 
            onClick={onClick} 
            title={`Open ${url}`}
            style={{ overflow: 'hidden', isolation: 'isolate', borderRadius: '12px' }}
        >
            {/* Skeleton: Only show if we have NEVER loaded an image for this component instance */}
            {!isReady && (
                <div 
                    style={{ 
                        position: 'absolute', inset: 0, 
                        backgroundColor: '#2c2c2c', 
                        zIndex: 1, 
                        animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                    }} 
                />
            )}
            
            {/* Image: Only render when ready. 
                When targetUrl changes, displayedUrl remains the old one until new one loads, 
                preventing flashing. */}
            {isReady && (
                <img 
                    src={displayedUrl!} 
                    alt={hostname} 
                    loading="lazy"
                    style={{ 
                        display: 'block',
                        opacity: 1, 
                        transition: 'none' // Disable transition to avoid fade-out/fade-in gap
                    }}
                />
            )}

            <div className="window-thumb-overlay" style={{ zIndex: 2 }}>
                <div className="window-thumb-title">{hostname}</div>
                <div className="window-thumb-subtitle">
                    <span>{url.length > 30 ? '...' + url.slice(-25) : url}</span>
                    <span className="badge font-mono" style={{fontSize: '0.6rem'}}>#{id}</span>
                </div>
            </div>
            
            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            `}</style>
        </div>
    );
};
