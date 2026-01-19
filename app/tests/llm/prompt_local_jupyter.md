1.the detail window page ,shuold auto reqeust image from server every 1s,
you should requests fetch the arraybuffer and make a blob url to set image sate update image.
2.and button :active window ,close window,hide window ,reload url (call exec js location.reload()), the api you can find ../app/src/main.js rpc endpoind include all rpc method
3.keep View tag to draw main frame html page area,use div also
---
1.fix when open showFloatDiv inner text is null 
2. auto save the window state include size and position to storage,when not click close button close window ,just shutdown exception ,whne restart ,open all saved window 
3. when npm run hot-reload ,when code changed auto npm run build
---
function showFloatDiv(options) {
    const {width,height,top,left} = options||{}
    if(!width) width = 200
    if(!height) height = 80
    if(!top) top = 50
    if(!left) left = 50
---

// Convenience wrappers for window._G API
if (typeof window !== 'undefined') {
window._G.showFloatDiv = showFloatDiv;
window._G.hideFloatDiv = hideFloatDiv;
}

 remove this code
---
./electron.d.ts has all electron interface define

add rpc method:

- sendElectronCtlV use sendInputEvent mock ctl+v

-----


add rpc method:

- sendElectronPressEnter: use sendInputEvent mock press enter
- writeClipboard: use pyperclip.copy(text) to copy to clipboard

- showFloatDiv: executeJavaScript(wc,"window._G.showFloatDiv()")
- hideFloatDiv: executeJavaScript(wc,"window._G.hideFloatDiv()")

fix utils-browser.js showFloatDiv: when mousemove show the size and position in the FLOAT_DIV_ID inner
