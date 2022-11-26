from channels.auth import AuthMiddlewareStack #추가
from channels.routing import ProtocolTypeRouter, URLRouter #URLRouter 추가
import chatapp.routing # chat import

application = ProtocolTypeRouter({
  "websocket": AuthMiddlewareStack( # 추가
        URLRouter(
            chatapp.routing.websocket_urlpatterns
        )
    ),
})