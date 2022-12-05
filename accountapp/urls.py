from django.contrib.auth.views import LoginView, LogoutView

from accountapp.views import AccountCreateView, AccountUpdateView, AccountDeleteView, \
    AccountListView, AccountDetailView
from django.urls import path
from django.urls.conf import include

app_name = "accountapp"

urlpatterns = [
    path('login/', LoginView.as_view(template_name='accountapp/login.html'), name='login'),
    path('logout/', LogoutView.as_view(template_name='accountapp/logout.html'), name='logout'),

    path('signup/', AccountCreateView.as_view(), name='signup'),
    path('detail/<int:pk>', AccountDetailView.as_view(), name='detail'),
    path('update/<int:pk>', AccountUpdateView.as_view(), name='update'),
    path('delete/<int:pk>', AccountDeleteView.as_view(), name='delete'),

    path('api/', AccountListView.as_view(), name='api'),
]