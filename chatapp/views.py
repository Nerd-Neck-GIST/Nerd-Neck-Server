from django.shortcuts import render

def enter_room(request):
    return render(request, 'chatapp/enter_room.html')

def main(request, room_name):
    return render(request, 'chatapp/main.html', context={"room_name": room_name.split("/")[0]})
