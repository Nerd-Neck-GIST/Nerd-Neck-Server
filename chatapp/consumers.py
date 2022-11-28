import json

# from asgiref.sync import async_to_sync
from channels.generic.websocket import AsyncWebsocketConsumer
import asyncio

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_group_name = 'Test-Room'

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        print('Disconnected!')

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        peer_username = text_data_json['peer']
        action = text_data_json['action']
        message = text_data_json['message']

        if(action == 'new-offer') or (action =='new-answer'):
            # in case its a new offer or answer
            # send it to the new peer or initial offerer respectively

            receiver_channel_name = text_data_json['message']['receiver_channel_name']

            print('Sending to ', receiver_channel_name)

            text_data_json['message']['receiver_channel_name'] = self.channel_name

            # "room" 그룹에 메시지 전송
            await self.channel_layer.send(
                receiver_channel_name,
                {
                    'type': 'send.sdp',
                    'receive_dict': text_data_json,
                }
            )
            return
        
        # set new receiver as the current sender
        # so that some messages can be sent
        # to this channel specifically
        text_data_json['message']['receiver_channel_name'] = self.channel_name

        # send to all peers
        await self.channel_layer.send(
            receiver_channel_name,
            {
                'type': 'send.sdp',
                'receive_dict': text_data_json,
            }
        )


        # "room" 그룹에서 메시지 전송
    async def send_sdp(self, event):
        receive_dict = event['receive_dict']

        this_peer = receive_dict['peer']
        action = receive_dict['action']
        message = receive_dict['message']

        # 웹 소켓으로 메시지 전송
        await self.send(text_data=json.dumps({
            'peer': this_peer,
            'action': action,
            'message': message,
        }))

# class ChatConsumer(WebsocketConsumer):
#     # websocket 연결 시 실행
#     def connect(self):
    #     self.room_name = self.scope['url_route']['kwargs']['room_name']
    #     self.room_group_name = 'chat_%s' % self.room_name
    #     async_to_sync(self.channel_layer.group_add)(
    #         self.room_group_name,
    #         self.channel_name
    #     )
    #     # WebSocket 연결
    #     self.accept()
    #
    # # websocket 연결 종료 시 실행
    # def disconnect(self, close_code):
    #     async_to_sync(self.channel_layer.group_discard)(
    #         self.room_group_name,
    #         self.channel_name
    #     )
    # # 클라이언트로부터 메세지를 받을 시 실행
    # def receive(self, text_data):
    #     text_data_json = json.loads(text_data)
    #     message = text_data_json['message']
    #     # 클라이언트로부터 받은 메세지를 다시 클라이언트로 보내준다.
    #     self.send(text_data=json.dumps({
    #         'message': message
    #     }))