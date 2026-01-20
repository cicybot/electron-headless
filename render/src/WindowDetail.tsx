
import React, { useState, useEffect } from 'react';
import { useRpc } from './RpcContext';
import { IconArrowLeft } from './Icons';
import View from './View';

export const WindowDetail = ({ windowId, initialUrl, onBack }: { windowId: number, initialUrl: string, onBack: () => void }) => {
    const { rpc, rpcBaseUrl, rpcToken } = useRpc();
    const [_, setCurrentUrl] = useState(initialUrl);

    // Set initial title
    document.title = `${windowId} - ${initialUrl}`;
    const [navUrl, setNavUrl] = useState(initialUrl);
    const [screenshotUrl, setScreenshotUrl] = useState<string>('');

    const [isAutoRefresh, setIsAutoRefresh] = useState(false);

    useEffect(()=>{
        fetchScreenshot()
    },[])

    const fetchScreenshot = async () => {
        try {
            const url = (rpcBaseUrl ? `${rpcBaseUrl}/windowScreenshot` : '/windowScreenshot') + `?id=${windowId}&t=${Date.now()}`;
            const headers: Record<string, string> = {};
            if (rpcToken) {
                headers['Authorization'] = `Bearer ${rpcToken}`;
            }
            const response = await fetch(url, { headers });
            if (response.ok) {
                const arrayBuffer = await response.arrayBuffer();
                const blob = new Blob([arrayBuffer], { type: 'image/png' });
                const blobUrl = URL.createObjectURL(blob);
                setScreenshotUrl(blobUrl);
            }

        } catch (error) {
            console.error('Failed to fetch screenshot:', error);
        }
        // After screenshot is loaded, get bounds and display
        try {
            const bounds = await rpc<{ x: number; y: number; width: number; height: number }>('getBounds', { win_id: windowId });
            if (bounds) {
                const boundElement = document.querySelector("#bound");
                if (boundElement) {
                    boundElement.textContent = `${bounds.width}x${bounds.height} (${bounds.x},${bounds.y})`;
                }
            }
        } catch (e) {
            console.error('Failed to get bounds:', e);
        }
    };



    // Auto-fetch screenshot as blob URL
    useEffect(() => {
        let timeoutId: NodeJS.Timeout | null = null;

        const scheduleNextFetch = () => {
            if (isAutoRefresh) {
                timeoutId = setTimeout(() => {
                    fetchScreenshot().then(scheduleNextFetch);
                }, 1000);
            }
        };

        // No initial fetch - user must manually refresh or enable auto-refresh
        if (isAutoRefresh) {
            scheduleNextFetch();
        }

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [rpcBaseUrl, rpcToken, isAutoRefresh]);

    const handleNavigate = async () => {
        await rpc('loadURL', { win_id: windowId, url: navUrl });
        setCurrentUrl(navUrl);
        setTimeout(fetchScreenshot, 1000);
    };

    const onClickImage = (e,type)=>{
        e.preventDefault();
        // 获取鼠标相对于图片的坐标
        const x = parseInt(e.clientX + document.querySelector("#screen").scrollLeft) -64;
        const y = parseInt(e.clientY+ document.querySelector("#screen").scrollTop) -64;
        // 弹出显示坐标
        rpc(type||"sendElectronClick",{
            win_id:1,
            x,y
        }).finally(()=>{
            //location.reload()
        })
    }
    const onMouseMoveImage = (e)=>{
        e.preventDefault();
        // 获取鼠标相对于图片的坐标
        const x = parseInt(e.clientX + document.querySelector("#screen").scrollLeft) -64;
        const y = parseInt(e.clientY+ document.querySelector("#screen").scrollTop) -64;
        document.querySelector("#position").textContent= `x::${x},y:${y}`
    }

    return (
        <div className="flex flex-col h-full">
            <View w100vw h100vh  xx0 yy0 fixed>
                <View abs xx0 top0 h={64} rowVCenter>
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
                             <button className="btn" onClick={()=>{fetchScreenshot()}}>刷新截屏</button>
                             <button
                                 className={`btn ${isAutoRefresh ? 'btn-success' : 'btn-secondary'}`}
                                 onClick={() => setIsAutoRefresh(!isAutoRefresh)}
                             >
                                 {isAutoRefresh ? '停止自动刷新' : '开启自动刷新'}
                             </button>
                         </div>

                    </div>
                </View>
                <View absFull top={64} right={320} overflowXAuto overflowYAuto id={"screen"}>
                    {
                        screenshotUrl && <img
                            onMouseMove={((e)=>onMouseMoveImage(e))}
                            onClick={(e)=>{
                                onClickImage(e,"sendElectronClick")
                            }}
                            src={screenshotUrl} alt=""/>
                    }
                    {
                        !screenshotUrl && <View wh100p center>Loading...</View>
                    }

                </View>
                <View abs top={64} right0 bottom0 w={320}  borderBox pt12 pl12>
                    <View rowVCenter mb12>
                        <View id={"bound"}></View>
                    </View>
                    <View rowVCenter mb12>
                        <View id={"position"}></View>
                    </View>
                    <View rowVCenter jStart>
                        <button className="btn btn-sm" onClick={async () => {
                            await rpc('showWindow', { win_id: windowId });
                        }} title="Active Window">
                            Active
                        </button>
                        <button className="btn btn-sm" onClick={async () => {
                            if(!confirm("close?")){
                                return;
                            }
                            await rpc('closeWindow', { win_id: windowId });
                        }} title="Close Window">
                            Close
                        </button>
                        <button className="btn btn-sm" onClick={async () => {
                            await rpc('hideWindow', { win_id: windowId });
                        }} title="Hide Window">
                            Hide
                        </button>
                        {/*<button className="btn btn-icon" onClick={handleReload} title="Reload Page">*/}
                        {/*    <IconRefresh />*/}
                        {/*</button>*/}
                        <button className="btn btn-sm" onClick={async () => {
                            await rpc('executeJavaScript', { win_id: windowId, code: 'location.reload()' });
                        }} title="Reload via JavaScript">
                            Reload
                        </button>
                    </View>
                </View>

            </View>
        </div>
    );
};
