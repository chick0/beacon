from twisted.web.static import File as _File
from twisted.web.resource import Resource


class TeaPot(Resource):
    def render(self, request):
        request.setHeader(b"content-type", b"text/plain; charset=utf-8")
        return b"418 I'm a teapot"


class File(_File):
    def directoryListing(self):
        return TeaPot()
