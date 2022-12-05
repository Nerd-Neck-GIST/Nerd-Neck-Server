from django.shortcuts import render

def main(request):
    return render(request, 'chatapp/main.html', context={"user": request.user})
