const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
        toast.addEventListener("mouseenter", Swal.stopTimer)
        toast.addEventListener("mouseleave", Swal.resumeTimer)
    },
})

function lockScreen() {
    Swal.fire({
        icon: "info",
        title: "잠시만요",
        text: "요청 사항을 처리하고 있습니다...",
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
    })
}

function connectAlert() {
    Swal.fire({
        icon: "info",
        title: "잠시만요",
        text: "신호기 서버와 연결하고 있습니다...",
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
    })
}

function connectedAlert() {
    Toast.fire({
        icon: "success",
        title: "신호기 서버와 연결되었습니다!",
    })
}

function initWebsocket() {
    const ovHost = location.protocol == "http:" ? "ws://localhost:8280/ws" : `wss://${location.host}/ws`

    connectAlert()

    window.ws = new WebSocket(ovHost)
    window.ws.onclose = () => {
        window.ws = null
        clearInterval(window.pingIntervalId)
        initWebsocket()
    }

    window.ws.onopen = () => {
        Swal.close()
        connectedAlert()

        if (window.wsConnectHandler != undefined) {
            window.wsConnectHandler()
        }

        window.pingIntervalId = setInterval(() => {
            window.ws.send("ping")
            console.log("ping")
        }, 1000)
    }

    window.ws.onmessage = (event) => {
        const data = event.data

        if (window.wsDataHandler != undefined) {
            window.wsDataHandler(data)
        } else {
            console.log(data)
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    initWebsocket()
})
