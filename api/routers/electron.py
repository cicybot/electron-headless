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
api_url = "http://192.168.100.68:3000/rpc"

def post_rpc(method,params = None):
    res = requests.post(
        api_url,
        json={
            "method": method,
            "params":params
        }
    )
    return res.json()

@router.get("/info")
async def info():
    return post_rpc("info")

@router.get("/loadURL")
async def loadURL(
        url: str = Query(
            ...,
            example="https://www.google.com",
            description="URL to load in Electron BrowserWindow"
        )
):
    return post_rpc("loadURL",{
        "url":url
    })

@router.get("/getURL")
async def getURL():
    return post_rpc("getURL")

@router.get("/getTitle")
async def getTitle():
    return post_rpc("getTitle")

@router.get("/reload")
async def reload():
    return post_rpc("reload")


@router.get("/getUserAgent")
async def getUserAgent():
    return post_rpc("getUserAgent")

@router.get("/getBounds")
async def getBounds():
    return post_rpc("getBounds")



@router.get("/executeJavaScript")
async def executeJavaScript(
        code: str = Query(
            ...,
            example="console.log('executeJavaScript')",
        )
):
    return post_rpc("executeJavaScript",{
        "code":code
    })

