from sys import stdout
from hashlib import sha512
from logging import getLogger

from twisted.python import log
from twisted.web.static import File
from twisted.web.server import Site
from twisted.internet import reactor
from autobahn.twisted.resource import WebSocketResource
from autobahn.twisted.websocket import WebSocketServerFactory
from autobahn.twisted.websocket import WebSocketServerProtocol

from manager import PasscodeManager
from manager import RestoreManager

logging = getLogger()


class BeaconServerProtocol(WebSocketServerProtocol):
    def __init__(self):
        super().__init__()
        self.isPanel = False
        self.hasUpgradeRequst = False

    def onOpen(self):
        self.factory.register(self)  # type: ignore

    def onMessage(self, payload, isBinary):
        if not isBinary:
            data: str = payload.decode("utf-8")

            if data == "ping":
                self.sendMessage(b"pong!")
                return

            if data == "restore":
                self.sendMessage(f"status={RestoreManager.status}".encode("utf-8"))
                self.sendMessage(f"text={RestoreManager.text}".encode("utf-8"))
                return

            if self.hasUpgradeRequst:
                self.do_upgrade_request(data)
                return

            if self.isPanel:
                if data == "RestoreManager_export":
                    RestoreManager.export()
                    return

                if data.startswith("status="):
                    RestoreManager.status = data[7:]  # type: ignore
                    RestoreManager.export()
                elif data.startswith("text="):
                    RestoreManager.text = data[5:]  # type: ignore

                self.factory.broadcast(data, self.peer)  # type: ignore
            elif data == "upgrade":
                self.create_upgrade_request()

    def connectionLost(self, reason):
        WebSocketServerProtocol.connectionLost(self, reason)
        self.factory.unregister(self)  # type: ignore

    def create_upgrade_request(self):
        if PasscodeManager.value is None:
            self.hasUpgradeRequst = True
            self.sendMessage(b"create_passcode")
        else:
            self.hasUpgradeRequst = True
            self.sendMessage(b"passcode_required")

    def do_upgrade_request(self, data):
        if len(data) < 10:
            self.sendMessage(b"invalid_passcode")
        elif PasscodeManager.value is None:
            PasscodeManager.value = data
            PasscodeManager.export()

            self.sendMessage(b"passcode_update")
            self.hasUpgradeRequst = False
            self.isPanel = True
        else:
            if PasscodeManager.value == sha512(data.encode("utf-8")).digest():
                self.sendMessage(b"passcode_passed")
                self.hasUpgradeRequst = False
                self.isPanel = True
            else:
                self.sendMessage(b"invalid_passcode")


class BeaconServerFactory(WebSocketServerFactory):
    def __init__(self, url):
        WebSocketServerFactory.__init__(self, url)
        self.clients = []

    def register(self, client):
        if client not in self.clients:
            print("registered client {}".format(client.peer))
            self.clients.append(client)

    def unregister(self, client):
        if client in self.clients:
            print("unregistered client {}".format(client.peer))
            self.clients.remove(client)

    def broadcast(self, msg: str, peer):
        print(f"broadcasting message for overlay '{msg}'")
        for c in self.clients:
            if c.peer != peer:
                c.sendMessage(msg.encode('utf8'))
                print(f"└ message sent to {c.peer}")


if __name__ == '__main__':
    log.startLogging(stdout)

    factory = BeaconServerFactory("ws://127.0.0.1:8280")
    factory.protocol = BeaconServerProtocol

    resource = WebSocketResource(factory)

    public = File("./public")
    public.putChild(b"ws", resource)  # type: ignore

    site = Site(public)

    reactor.listenTCP(8280, site)  # type: ignore
    reactor.run()  # type: ignore
