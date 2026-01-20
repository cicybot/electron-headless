
import React, { useState, useEffect } from 'react';

interface WindowThumbnailProps {
    id: number;
    url: string;
    refreshKey: number;
    onClick: () => void;
    rpcBaseUrl: string;
    rpcToken?: string;
}

export const WindowThumbnail: React.FC<WindowThumbnailProps> = ({ id, url, refreshKey, onClick, rpcBaseUrl, rpcToken }) => {
    const hostname = new URL(url).hostname;
    // Construct the target URL with timestamp
    const targetUrl = (rpcBaseUrl ? `${rpcBaseUrl}/windowScreenshot` : '/windowScreenshot') + `?id=${id}&t=${refreshKey}`;
    
    // State to hold the URL currently rendered in the DOM
    const [displayedUrl, setDisplayedUrl] = useState<string | null>(null);

    // Preloader effect: Fetch the new image in background with auth headers, update displayedUrl only when loaded.
    useEffect(() => {
        let mounted = true;

        const loadImage = async () => {
            try {
                const headers: Record<string, string> = {};
                if (rpcToken) {
                    headers['Authorization'] = `Bearer ${rpcToken}`;
                }

                const response = await fetch(targetUrl, { headers });
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const blob = await response.blob();
                const objectUrl = URL.createObjectURL(blob);

                if (mounted) {
                    setDisplayedUrl(objectUrl);
                }
            } catch (error) {
                console.error('Failed to load screenshot:', error);
                // On error, still update to show the broken state
                if (mounted) setDisplayedUrl(targetUrl);
            }
        };

        loadImage();

        return () => { mounted = false; };
    }, [targetUrl, rpcToken]);

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
