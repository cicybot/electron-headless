import logging
from fastapi import APIRouter

from common import helpers
from service.Global import Global
import requests

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/dev",
    dependencies=[],
    tags=["Dev"],
    responses={404: {"description": "Not found"}},
)

@router.get("/")
async def dev():
    if Global.get_options("is_cf") is not None:
        return {}
    res = requests.post(
        "http://192.168.100.68:3000/rpc",
        json={
            "method": "loadURL",
            "params":{
                "url":"https://api.myip.com/"
            }
        }
    )
    text = res.json()
    return {
        "text":text,
        "opts":helpers.get_otps(),
        "options":Global.get_options()
    }

