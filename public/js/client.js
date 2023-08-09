const bgArea = document.querySelector(".bg-area")
const textArea = document.querySelector(".text-area")

function wsConnectHandler() {
    window.ws.send("restore")
}

function wsDataHandler(data) {
    if (data.startsWith("status=")) {
        bgArea.classList = `bg-area ${data.slice(7)}`
    } else if (data.startsWith("text=")) {
        textArea.innerText = data.slice(5)
    }
}
