const {executeJavaScript, sendKey, simulateClick, waitForResult} = require("../utils");
const {showRect} = require("../utils-browser");

async function getChatGptCurrentMessages(win_id) {
    const {result} = await executeJavaScript(`
       const chat = await window._G.getChatGptChats()
       console.log("chat",{chat})
       if(chat){
            return chat.messages
       }else{
            return []
       }
    `, win_id)
    return result
}

async function askChatGptWeb(prompt, win_id) {
    const prompt_ = btoa(encodeURIComponent(prompt))
    await executeJavaScript(`
const ele = document.querySelector("#prompt-textarea")
const {width,height,top,left} = ele.getBoundingClientRect()
// window.showRect({width,height,top,left})
return {    
    left,top,width,height
}
    `, win_id)
    await executeJavaScript(`
const element = document.querySelector('#prompt-textarea');
element.innerText = decodeURIComponent(atob("${prompt_}"));
const inputEvent = new Event('input', {
    bubbles: true,
    cancelable: true,
});
element.dispatchEvent(inputEvent);
return {}
    `, win_id)


    const {result} = await executeJavaScript(`
const ele = document.querySelector("#composer-submit-button")
const {width,height,top,left} = ele.getBoundingClientRect()
return {    
    left,top,width,height
}
    `, win_id)
    const {width, height, top, left} = result


    const messagesOrg = await getChatGptCurrentMessages(win_id)
    const len = messagesOrg.length
    console.log(len)
    console.log("send...")
    await simulateClick(left + width / 2, top + height / 2, win_id)

    const res = await waitForResult(async () => {
        const messages = await getChatGptCurrentMessages(win_id)
        console.log(messages.length)
        return messages.length > len ? messages[0] : false
    }, -1, 1000)
    return res
}

const main = async ({win_id}) => {
    const reply = await askChatGptWeb("给我一个JS demo", 1)
    d(reply)
}

module.exports = {main}