
function onReady() {
    console.log("_G extension onReady")
    setInterval(() => {
        console.debug("loop")
        if (
            location.href.startsWith("https://colab.research.google.com/")
        ) {
            const res = document.querySelector("body > div.notebook-vertical > div.notebook-horizontal > colab-left-pane > colab-resizer")
            if (!res) {
                document.querySelector("#cell-3kzh_tuJISRi > div.main-content > div > div.codecell-input-output > div.inputarea.horizontal.layout.code > div.cell-gutter > div > colab-run-button").shadowRoot.querySelector("#run-button").click()
            }
        }

        if (
            location.href.startsWith("https://shell.cloud.google.com/")
        ) {
            const container = document.querySelector("cloudshell-view-controls");
            if (!container.querySelector("button[aria-label=\"打开编辑器\"]")) {
                return
            }

            const openBtn = document.querySelector('button[aria-label="打开新标签页"]');
            if (openBtn) {
                const rows = document.querySelectorAll('button[mattooltip="关闭标签"]')
                let i = 0
                rows.forEach(ele => {
                    i += 1
                    if (i > 1) {
                        ele.click()
                    }
                })
                openBtn.click()
            }
        }
    }, 20000)
}

module.exports = {onReady}