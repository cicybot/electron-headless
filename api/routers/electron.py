import logging
from fastapi import APIRouter,Response,Query

import requests

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/electron",
    dependencies=[],
    tags=["Electron"],
    responses={404: {"description": "Not found"}},
)
# api_url = "http://192.168.100.68:3000/rpc"
api_url = "http://127.0.0.1:3000/rpc"
# api_url = "https://jubilant-space-engine-69p7q9wxvx44fr4w5-3000.app.github.dev/rpc"

def post_rpc(method,params = None):
    res = requests.post(
        api_url,
        json={
            "method": method,
            "params":params
        }
    )
    return res.json()
@router.get("/dev")
async def dev():
    code = """
(()=>{
    
    const keyword = "ACCEPT";
    
    const elements = Array.from(
      document.querySelectorAll("button")
    ).filter(el =>
      el.innerText &&
      el.innerText.trim().toUpperCase() === keyword
    );
    
    console.log("Found ACCEPT elements:", elements);
    
    if (elements.length > 0) {
        elements[0].click();
        console.log("Clicked ACCEPT button");
        return true;
    }

    return false;
})()
    """
    return post_rpc("executeJavaScript",{
        "code":code,
        "win_id":1
    })

@router.get("/info")
async def info():
    return post_rpc("info")

@router.get("/openWindow")
async def openWindow(
        url: str = Query(
            ...,
            example="https://www.google.com",
            description="URL to load in Electron BrowserWindow"
        ),
        account_index: str = Query(
            ...,
            example="0",
            description="the account index of browser"
        )
):
    return post_rpc("openWindow",{
        "url":url,
        "account_index":account_index
    })

@router.get("/getWindows")
async def getWindows():
    return post_rpc("getWindows")

@router.get("/loadURL")
async def loadURL(
        url: str = Query(
            ...,
            example="https://www.google.com",
            description="URL to load in Electron BrowserWindow"
        ),
        win_id:int = Query(
            ...,
            description=" Electron BrowserWindow window ID",
            example="1",
        )
):
    return post_rpc("loadURL",{
        "url":url,
        "win_id":win_id
    })

@router.get("/getURL")
async def getURL(
        win_id:int = Query(
            ...,
            description=" Electron BrowserWindow window ID",
            example="1",
        )
):
    return post_rpc("getURL",{
        "win_id":win_id
    })

@router.get("/getTitle")
async def getTitle(
        win_id:int = Query(
            ...,
            description=" Electron BrowserWindow window ID",
            example="1",
        )
):
    return post_rpc("getTitle",{
        "win_id":win_id
    })

@router.get("/reload")
async def reload(
        win_id:int = Query(
            ...,
            description=" Electron BrowserWindow window ID",
            example="1",
        )
):
    return post_rpc("reload",{
        "win_id":win_id
    })


@router.get("/getUserAgent")
async def getUserAgent(
        win_id:int = Query(
            ...,
            description=" Electron BrowserWindow window ID",
            example="1",
        )
):
    return post_rpc("getUserAgent",{"win_id":win_id})

@router.get("/getBounds")
async def getBounds(
        win_id:int = Query(
            ...,
            description=" Electron BrowserWindow window ID",
            example="1",
        )
):
    return post_rpc("getBounds",{
        "win_id":win_id
    })


@router.get("/screenshot")
async def screenshot(
        win_id:int = Query(
            ...,
            description=" Electron BrowserWindow window ID",
            example="1",
        )
):
    return post_rpc("screenshot",{
        "winwin_idId":win_id
    })

@router.get("/executeJavaScript")
async def executeJavaScript(
        code: str = Query(
            ...,
            example="console.log('executeJavaScript')",
        ),
        win_id:int = Query(
            ...,
            description=" Electron BrowserWindow window ID",
            example="1",
        )
):
    return post_rpc("executeJavaScript",{
        "code":code,
        "win_id":win_id
    })



@router.post("/proxy")
async def proxy_set(
        url: str = Query(
            ...,
            example="https://ip:port",
            description="proxy url"
        ),
        account_index: str = Query(
            ...,
            example="0",
            description="the account index of browser"
        )
):
    return post_rpc("setProxy",{
        "url":url,
        "account_index":account_index
    })


@router.get("/proxy")
async def proxy_get(
        account_index: str = Query(
            ...,
            example="0",
            description="the account index of browser"
        )
):
    return post_rpc("getProxy",{
        "account_index":account_index
    })


@router.get("/proxy/list")
async def proxy_list():
    return post_rpc("proxy_list",{})