from json import load
from json import dump


class _PasscodeManager:
    def __init__(self):
        self.value = None

        try:
            with open("passcode.beacon", mode="rb") as fp:
                self.value = fp.read()
        except FileNotFoundError:
            print("warning! `passcode.beacon` not found")

    def export(self):
        if self.value is not None:
            with open("passcode.beacon", mode="wb") as fp:
                fp.write(self.value)


class _RestoreManager:
    def __init__(self):
        self.status = ""
        self.text = ""

        try:
            json = load(open("restore.beacon", mode="r"))
            self.status = json.get("status", self.status)
            self.text = json.get("text", self.text)
        except FileNotFoundError:
            print("warning! `restore.beacon` not found")

    def export(self):
        dump(
            {
                "status": self.status,
                "text": self.text
            },
            open("restore.beacon", mode="w")
        )


PasscodeManager = _PasscodeManager()
RestoreManager = _RestoreManager()
