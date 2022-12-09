import json

from channels.generic.websocket import AsyncWebsocketConsumer
import asyncio

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_group_name = self.scope['url_route']['kwargs']['room_name']

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
        # convert from json to python using loads
        text_data_json = json.loads(text_data)
        # get peer_username, action, message from converted json file
        peer_username = text_data_json['peer']
        print(peer_username)
        #peer_username = self.scope["user"]
        action = text_data_json['action']
        message = text_data_json['message']

        if(action == 'new-offer') or (action =='new-answer'):
            # in case its a new offer or answer
            # send it to the new peer or initial offerer respectively

            receiver_channel_name = text_data_json['message']['receiver_channel_name']

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

        # send to all peers (Broadcasting)
        # channel layers defined in setting.py
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'send.sdp',
                'receive_dict': text_data_json,
            }
        )


    # "room" 그룹에서 메시지 전송
    async def send_sdp(self, event):
        receive_dict = event['receive_dict']
        
        this_peer = self.scope["user"]
        action = receive_dict['action']
        message = receive_dict['message']

        # 웹 소켓으로 메시지 전송
        # convert from python to json using dump
        await self.send(text_data=json.dumps({
            'peer': this_peer,
            'action': action,
            'message': message,
        }))