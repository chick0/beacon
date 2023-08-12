function wsConnectHandler() {
    window.ws.send("upgrade")
    window.ws.send("restore")

    window.statusList = {}

    document.querySelectorAll("button.for-status").forEach((button) => {
        window.statusList[button.dataset.status] = {
            text: button.innerText,
            style: "tag " + Array.from(button.classList).filter((x) => x.startsWith("is-"))[0],
        }

        button.addEventListener("click", (event) => {
            const newStatus = event.currentTarget.dataset.status

            window.ws.send(`status=${newStatus}`)
            Toast.fire({
                icon: "info",
                title: `${window.statusList[newStatus].text}으로 상태를 설정했습니다.`,
            })

            setStatus(newStatus)
        })
    })
}

function wsDataHandler(data) {
    if (data.startsWith("status=")) {
        setStatus(data.slice(7))
    } else if (data.startsWith("text=")) {
        setText(data.slice(5))
    } else if (data == "create_passcode") {
        passwordAsk("설정")
    } else if (data == "passcode_required") {
        let passcode = localStorage.getItem("beaconPasscode")

        if (passcode == null || passcode.length == 0) {
            passwordAsk("입력")
        } else {
            window.ws.send(passcode)
        }
    } else if (data == "invalid_passcode") {
        localStorage.clear()

        Swal.fire({
            icon: "error",
            text: "접속 코드가 올바르지 않습니다.",
            timer: 3000,
            timerProgressBar: true,
            confirmButtonText: "확인",
        }).then(() => {
            passwordAsk("입력")
        })
    } else if (data == "passcode_update") {
        Toast.fire({
            icon: "success",
            title: "접속 코드가 설정되었습니다!",
        })
    } else if (data == "passcode_passed") {
        Toast.fire({
            icon: "success",
            title: "접속 코드가 일치합니다!",
        })
    }
}

function passwordAsk(keyword) {
    let message = `접속 코드를 ${keyword}해주세요`

    Swal.fire({
        icon: "warning",
        input: "password",
        inputLabel: message,
        inputAttributes: {
            minlength: 10,
        },
        confirmButtonText: "확인",
    }).then((result) => {
        if (result.isConfirmed) {
            if (result.value.length < 10) {
                Swal.fire({
                    icon: "error",
                    text: "10자 이상으로 입력해주세요.",
                    timer: 3000,
                    timerProgressBar: true,
                    confirmButtonText: "확인",
                }).then(() => {
                    passwordAsk(keyword)
                })
            } else {
                localStorage.setItem("beaconPasscode", result.value)
                window.ws.send(result.value)
                lockScreen()
            }
        } else {
            Swal.fire({
                icon: "error",
                text: "접속 코드 입력이 취소 되었습니다.",
                timer: 3000,
                timerProgressBar: true,
                confirmButtonText: "확인",
            }).then(() => {
                window.ws.close()
            })
        }
    })
}

function setStatus(newStatus) {
    const display = document.getElementById("status")
    display.innerText = window.statusList[newStatus].text
    display.className = window.statusList[newStatus].style
}

function setText(newText) {
    const display = document.getElementById("text")
    display.value = newText
}

document.addEventListener("DOMContentLoaded", () => {
    document.querySelector("textarea#text").addEventListener("input", (event) => {
        ws.send(`text=${event.currentTarget.value}`)
    })

    document.querySelector("textarea#text").addEventListener("blur", () => {
        ws.send("RestoreManager_export")
    })
})
