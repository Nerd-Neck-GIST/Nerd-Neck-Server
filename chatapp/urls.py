# chatapp/urls.py
from django.urls import path, re_path

from .views import main, enter_room

app_name = "chatapp"

urlpatterns = [
    path('', enter_room, name='enter_room'),
    re_path('(?P<room_name>.*)$', main, name='main')
]