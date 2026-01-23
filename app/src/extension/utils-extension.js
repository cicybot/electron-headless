const utils = require("../utils");
const utilsBrowser = require("../utils-browser");

function onReady() {
  utilsBrowser.showPromptIcon();
  console.log("_G extension onReady");
  setInterval(() => {
    console.debug("loop");
    if (location.href.startsWith("https://colab.research.google.com/")) {
      const res = document.querySelector(
        "body > div.notebook-vertical > div.notebook-horizontal > colab-left-pane > colab-resizer"
      );
      if (!res) {
        document
          .querySelector(
            "#cell-3kzh_tuJISRi > div.main-content > div > div.codecell-input-output > div.inputarea.horizontal.layout.code > div.cell-gutter > div > colab-run-button"
          )
          .shadowRoot.querySelector("#run-button")
          .click();
      }
    }

    if (location.href.startsWith("https://shell.cloud.google.com/")) {
      const container = document.querySelector("cloudshell-view-controls");
      if (!container.querySelector('button[aria-label="打开编辑器"]')) {
        return;
      }

      const openBtn = document.querySelector('button[aria-label="打开新标签页"]');
      if (openBtn) {
        const rows = document.querySelectorAll('button[mattooltip="关闭标签"]');
        let i = 0;
        rows.forEach((ele) => {
          i += 1;
          if (i > 1) {
            ele.click();
          }
        });
        openBtn.click();
      }
    }
  }, 20000);
  regVncEvent();
}

window.handleElectronRender = async (textarea)=>{
  const value = textarea.value
  const uri = new URL(location.href)
  let win_id = uri.searchParams.get("win_id")
  //active_rpc_url

  const active_rpc_url = localStorage.getItem("active_rpc_url")
  if(!active_rpc_url || !win_id){
    return
  }
  win_id = Number(win_id)
  const uri1 = new URL(active_rpc_url)
  const token = uri1.searchParams.get("token") || ""
  const apiUrl = active_rpc_url.split("/rpc")[0]
  utils.setBaseApi(apiUrl)
  utils.setToken(token)
  await utils.writeClipboard(value)
  await utils.sendElectronClick(Number(win_id),314,159)
  await utils.sendElectronCtlV(Number(win_id))
  await utils.sendElectronPressEnter(Number(win_id))
}

window.regVncEvent__ = false;

function regVncEvent() {
  if (window.regVncEvent__) {
    return;
  }
  window.regVncEvent__ = true;
  document.addEventListener(
    "keydown",
    async (e) => {
      const url = location.href;
      const vnc_port = "-6080.";
      if (url.indexOf(vnc_port) === -1) return;
      const api = url.replace(vnc_port, "-3456.");
      const uri = new URL(api);
      utils.setBaseApi(`${uri.origin}`);
      utils.setToken(localStorage.getItem("__token"));
      try {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
          if (!localStorage.getItem("__passwd")) {
            alert("__passwd is null");
          } else {
            document.querySelector("#noVNC_password_input").value =
              localStorage.getItem("__passwd");
          }
        }
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "v") {
          try {
            const clipboardData = await navigator.clipboard.readText();
            if (clipboardData) {
              //alert(`Clipboard: ${clipboardData}`);
              console.log("clipboardData", clipboardData);
              await utils.post_rpc({
                method: "writeClipboard",
                params: {
                  text: clipboardData,
                },
              });
              console.log("clear clipboardData");
              await navigator.clipboard.writeText("");
            }
          } catch (err) {
            console.log(err);
          }

          await utils.post_rpc({
            method: "pyautoguiHotkey",
            params: {
              hot: "ctrl",
              key: "v",
            },
          });
        }

        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "c") {
          await utils.post_rpc({
            method: "pyautoguiHotkey",
            params: {
              hot: "ctrl",
              key: "c",
            },
          });
        }
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "a") {
          await utils.post_rpc({
            method: "pyautoguiHotkey",
            params: {
              hot: "ctrl",
              key: "a",
            },
          });
        }

        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "x") {
          await utils.post_rpc({
            method: "pyautoguiHotkey",
            params: {
              hot: "ctrl",
              key: "x",
            },
          });
        }
      } catch (e) {
        console.error(e);
      }
    },
    true
  );
}

module.exports = { onReady };
