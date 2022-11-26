from django.urls import path

app_name = 'measurementapp'

urlpatterns = [
    path('student/<int:pk>', QRTest, name='qrcode'),
]