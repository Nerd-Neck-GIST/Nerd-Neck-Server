from django.shortcuts import render

def peer1(request):
    return render(request, 'chatapp/peer1.html')

def peer2(request):
    return render(request, 'chatapp/peer2.html')

def peer(request):
    return render(request, 'chatapp/peer.html')