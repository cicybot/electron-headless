
import React, { useState, useEffect } from 'react';
import { useRpc } from './RpcContext';
import { IconArrowLeft } from './Icons';
import View from './View';

export const DesktopDetail = ({  onBack }: { onBack: () => void }) => {
    const { rpc, rpcBaseUrl } = useRpc();

    useEffect(() => {
        document.title = "Desktop";
    }, []);

    const [screenshotUrl, setScreenshotUrl] = useState<string>('');

    // Get screen size on mount
    useEffect(() => {
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

        fetchScreenSize();
    }, [rpc]);

    // Auto-fetch screenshot as blob URL
    useEffect(() => {
        const fetchScreenshot = async () => {
            try {
                const url = (rpcBaseUrl ? `${rpcBaseUrl}/displayScreenshot` : '/displayScreenshot') + `?t=${Date.now()}`;
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
        const interval = setInterval(fetchScreenshot, 1000);

        return () => clearInterval(interval);
    }, [ rpcBaseUrl]);

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
