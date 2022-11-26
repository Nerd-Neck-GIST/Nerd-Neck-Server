from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from django.utils.decorators import method_decorator
from django.views.generic import CreateView, DetailView, UpdateView, DeleteView
from django.views.generic.list import MultipleObjectMixin, ListView
from rest_framework import serializers, generics
from rest_framework.response import Response

from accountapp.decorator import account_ownership_required
from accountapp.forms import AccountUpdateForm
from django.urls import reverse, reverse_lazy
from django.http.response import HttpResponseRedirect, HttpResponseForbidden
from django.shortcuts import render

has_ownership = [account_ownership_required, login_required]


class AccountCreateView(CreateView):
    model = User
    form_class = UserCreationForm
    success_url = reverse_lazy('home')
    template_name = 'accountapp/signup.html'


# class AccountDetailView(DetailView, MultipleObjectMixin):
#     model = User
#     context_object_name = 'target_user'
#     template_name = 'accountapp/detail.html'
#
#     paginate_by = 25
#
#     def get_context_data(self, **kwargs):
#         object_list = Article.objects.filter(writer= self.get_object())
#         return super(AccountDetailView, self).get_context_data(object_list=object_list, **kwargs)


@method_decorator(has_ownership, 'get')
@method_decorator(has_ownership, 'post')
class AccountUpdateView(UpdateView):
    model = User
    form_class = AccountUpdateForm
    context_object_name = 'target_user'
    success_url = reverse_lazy('accountapp:login')
    template_name = 'accountapp/update.html'

    # def get(self, *args, **kwargs):
    #     if self.request.user.is_authenticated and self.get_object() == self.request.user:
    #         return super().post(*args, **kwargs)
    #     else:
    #         return HttpResponseForbidden()
    #
    # def post(self, *args, **kwargs):
    #     if self.request.user.is_authenticated and self.get_object() == self.request.user:
    #         return super().post(*args, **kwargs)
    #     else:
    #         return HttpResponseForbidden()


@method_decorator(has_ownership, 'get')
@method_decorator(has_ownership, 'post')
class AccountDeleteView(DeleteView):
    model = User
    context_object_name = 'target_user'
    success_url = reverse_lazy('accountapp:login')
    template_name = 'accountapp/delete.html'

    # def get(self, *args, **kwargs):
    #     if self.request.user.is_authenticated and self.get_object() == self.request.user:
    #         return super().post(*args, **kwargs)
    #     else:
    #         return HttpResponseForbidden()
    #
    # def post(self, *args, **kwargs):
    #     if self.request.user.is_authenticated and self.get_object() == self.request.user:
    #         return super().post(*args, **kwargs)
    #     else:
    #         return HttpResponseForbidden()


# Account 리스트 시리얼라이저.
class AccountListSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('username', 'date_joined', 'is_staff')


# accounts/api으로 get하면 listview로 연결
class AccountListView(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = AccountListSerializer

    def list(self, request):
        queryset = self.get_queryset()
        serializers_class = self.get_serializer_class()
        serializer = serializers_class(queryset, many=True)

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer_class(page, many=True)
            return self.get_paginated_response(serializer.data)

        return Response(serializer.data)



