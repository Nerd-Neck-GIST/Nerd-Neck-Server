# Create your views here.
from django.shortcuts import render


# def measurement_main(request):
#
#     return render(request, 'measurement.html')
#
#
# from django.shortcuts import render
#
# from django.views.decorators import gzip
# from django.http import StreamingHttpResponse
# import cv2
# import threading
#
# # home.html
# def home(request):
#     return render(request,"home.html") #home.html을 호출해서 띄워준다.
#
# #카메라 관련 클래스
# class VideoCamera(object):
#     def __init__(self):
#         self.video = cv2.VideoCapture(0)
#         (self.grabbed, self.frame) = self.video.read()
#         threading.Thread(target=self.update, args=()).start()
#
#     def __del__(self):
#         self.video.release()
#
#     def get_frame(self):
#         image = self.frame
#         _, jpeg = cv2.imencode('.jpg', image)
#         return jpeg.tobytes()
#
#     def update(self):
#         while True:
#             (self.grabbed, self.frame) = self.video.read()
#
#
# def gen(camera):
#     while True:
#         frame = camera.get_frame()
#         # 소켓연결
#
#         # frame 보내기
#
#         # frame단위로 이미지를 계속 반환한다. (yield)
#
#         yield(b'--frame\r\n'
#               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n\r\n')
#
# def iterator(camera):
#     for i in range(15):
#         frame = camera.get_frame()
#         # frame단위로 이미지를 계속 반환한다. (yield)
#
#         yield(b'--frame\r\n'
#               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n\r\n')
#
# # detectme를 띄우는 코드(여기서 웹캠을 킨다.)
# @gzip.gzip_page
# def detectme(request):
#     try:
#         cam = VideoCamera() #웹캠 호출
#         # frame단위로 이미지를 계속 송출한다
#         streaming_content = gen(cam)
#         # 소켓 <-> AI Connect
#         # 소켓 -> AI Content (streaming content)
#         # 서버 <- AI
#         # 알람?!
#         return StreamingHttpResponse(gen(cam), content_type="multipart/x-mixed-replace;boundary=frame")
#     except:  # This is bad! replace it with proper handling
#         print("에러입니다...")
#         pass