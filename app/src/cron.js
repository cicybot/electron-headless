const cron = require("node-cron");

const baseUrl = process.env.ELECTRON_BASE_URL || "http://127.0.0.1:3456"

const post_rpc = async ({method,params})=>{
    const res = await fetch(`${baseUrl}/rpc`,{
        method:"POST",
        headers: {
            "Content-Type": "application/json"
        },
        body:JSON.stringify({method,params})
    })
    return res.json()
}
function reload(){
    console.log("Retry 2 min...");
    post_rpc({
        method:"reload",
        params:{
            win_id:2,
        }
    })

}
reload()
cron.schedule("*/2 * * * *", () => {
    reload()
});