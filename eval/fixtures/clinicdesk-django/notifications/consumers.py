from channels.generic.websocket import AsyncJsonWebsocketConsumer


class NotificationConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.user_id = self.scope["url_route"]["kwargs"]["user_id"]
        self.group = f"notify_{self.user_id}"
        await self.channel_layer.group_add(self.group, self.channel_name)
        await self.accept()

    async def notify(self, event):
        await self.send_json(event["payload"])

    async def disconnect(self, code):
        await self.channel_layer.group_discard(self.group, self.channel_name)
