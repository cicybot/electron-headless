
import React, { useState, useEffect } from 'react';
import { useRpc } from './RpcContext';
import { IconArrowLeft } from './Icons';
import View from './View';

export const DesktopDetail = ({  onBack }: { onBack: () => void }) => {
    const { rpc, rpcBaseUrl, rpcToken } = useRpc();

    useEffect(() => {
        document.title = "Desktop";
    }, []);

    const [screenshotUrl, setScreenshotUrl] = useState<string>('');
    const [isAutoRefresh, setIsAutoRefresh] = useState(false);

    const fetchScreenSize = async () => {
        try {
            const screenInfo = await rpc<{ width: number; height: number }>('getDisplayScreenSize');
            if (screenInfo) {
                const sizeElement = document.querySelector("#windowSize");
                if (sizeElement) {
                    sizeElement.textContent = `${screenInfo.width}x${screenInfo.height}`;
                }
            }
        } catch (e) {
            console.error('Failed to get screen size:', e);
        }
    };

    // Get screen size on mount
    useEffect(() => {
        fetchScreenshot()
        fetchScreenSize();
    }, [rpc, rpcToken]);


    const fetchScreenshot = async () => {
        try {
            const url = (rpcBaseUrl ? `${rpcBaseUrl}/displayScreenshot` : '/displayScreenshot') + `?t=${Date.now()}`;
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

    const onClickImage = (e,type)=>{
        e.preventDefault();
        // 获取鼠标相对于图片的坐标
        const x = parseInt(e.clientX + document.querySelector("#screen").scrollLeft);
        const y = parseInt(e.clientY+ document.querySelector("#screen").scrollTop) -64;
        // 弹出显示坐标
        rpc(type||"pyautoguiClick",{
            win_id:1,
            x,y
        }).finally(()=>{
            //location.reload()
        })
    }
    const onMouseMoveImage = (e)=>{
        e.preventDefault();
        // 获取鼠标相对于图片的坐标
        const x = parseInt(e.clientX + document.querySelector("#screen").scrollLeft);
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
                             <button className="btn" onClick={fetchScreenshot}>刷新截屏</button>
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
                                onClickImage(e,"pyautoguiClick")
                            }}
                            src={screenshotUrl} alt=""/>
                    }
                    {
                        !screenshotUrl && <View wh100p center>Loading...</View>
                    }

                </View>
                <View abs top={64} right0 bottom0 w={320}  >
                    <View rowVCenter mb12>
                        <View id={"windowSize"}></View>
                    </View>
                    <View rowVCenter mb12>
                        <View id={"position"}></View>
                    </View>
                    <View rowVCenter jStart>


                    </View>
                </View>

            </View>
        </div>
    );
};
