from django.shortcuts import render

# def index(request):
#     return render(request, 'chatapp/index.html')

def peer1(request):
    return render(request, 'chatapp/peer1.html')

def peer2(request):
    return render(request, 'chatapp/peer2.html')

def peer(request):
    return render(request, 'chatapp/peer.html')

# def room(request, room_name):
#     return render(request, 'chatapp/room.html', {
#         'room_name': room_name
#     })