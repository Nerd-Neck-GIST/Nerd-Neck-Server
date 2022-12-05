# chatapp/urls.py
from django.urls import path

from .views import main

app_name = "chatapp"

urlpatterns = [
    path('', main, name='main'),
]