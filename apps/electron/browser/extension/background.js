const { openWindow,setBaseApi,setToken } = require("../../common/utils");

setBaseApi("http://127.0.0.1:3456")
setToken("")

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "open-in-electron",
    title: "Open in Electron",
    contexts: ["all"],
  });

  chrome.contextMenus.create({
    id: "copy-domain-cookies",
    title: "Copy cookies for this domain",
    contexts: ["all"],
  });
  chrome.contextMenus.create({
    id: "copyTgAuth",
    title: "Copy Tg Auth",
    contexts: ["all"],
    documentUrlPatterns: ["https://web.telegram.org/*"],
  });
  chrome.contextMenus.create({
    id: "getLastChatgptReply",
    title: "ChatgptReply",
    contexts: ["all"],
    documentUrlPatterns: ["https://chatgpt.com/*"],
  });
});

const openInElectron = async (tab) => {
  console.log("openInElectron", tab.url);
  const url = tab.url;
  const uri = new URL(url);
  const domain = uri.hostname;
  const cookies = await chrome.cookies.getAll({ domain });
  console.log("openInElectron", domain, cookies);
  openWindow(
    url,
    {
      width: 1460,
    },
    {
      cookies,
      showWin: true,
      openDevtools: { mode: "right" },
    }
  );
};
const copyCookies = async (tab) => {
  console.log("copyCookies", tab.url);
  const uri = new URL(tab.url);
  const domain = uri.hostname;
  const cookies = await chrome.cookies.getAll({ domain });
  chrome.tabs.sendMessage(tab.id, {
    type: "copy-domain-cookies",
    payload: cookies,
    domain,
  });
};

const getLastChatgptReply = async (tab) => {
  chrome.tabs.sendMessage(tab.id, {
    type: "getLastChatgptReply",
  });
};
const copyTgAuth = async (tab) => {
  console.log("copyTgAuth", tab.url);
  chrome.tabs.sendMessage(tab.id, {
    type: "copyTgAuth",
  });
};
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  console.log("contextMenus clicked", info);
  if (info.menuItemId === "open-in-electron") {
    openInElectron(tab);
  }

  if (info.menuItemId === "copy-domain-cookies") {
    copyCookies(tab);
  }
  if (info.menuItemId === "copyTgAuth") {
    copyTgAuth(tab);
  }
  if (info.menuItemId === "getLastChatgptReply") {
    getLastChatgptReply(tab);
  }
});

chrome.runtime.onMessage.addListener(async (message, sender) => {
  const tab = await chrome.tabs.get(sender.tab.id);
  console.log("onMessage", message);

  if (message.type === "copy-domain-cookies") {
    copyCookies(tab);
  }

  if (message.type === "open-in-electron") {
    openInElectron(tab);
  }
});
