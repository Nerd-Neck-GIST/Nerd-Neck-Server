# chatapp/urls.py
from django.urls import path

from .views import peer1, peer2, peer

urlpatterns = [
    # path('', views.index, name='index'),
    # path('<str:room_name>/', views.room, name='room'),
    path('', peer, name='peer'),
    path('peer1/', peer1, name='peer1'),
    path('peer2/', peer2, name='peer2'),
]