from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List
import json

router = APIRouter()


class PollManager:
    def __init__(self):
        self.connections: Dict[str, List[WebSocket]] = {}
        self.polls: Dict[str, dict] = {}  # Aktiv so'rovnomalar

    async def connect(self, websocket: WebSocket, room_id: str):
        await websocket.accept()
        if room_id not in self.connections:
            self.connections[room_id] = []
        self.connections[room_id].append(websocket)

    def disconnect(self, websocket: WebSocket, room_id: str):
        if room_id in self.connections:
            self.connections[room_id].remove(websocket)

    async def broadcast(self, room_id: str, message: dict):
        """Xonadagi barcha ulanishlarga xabar yuborish"""
        if room_id in self.connections:
            for connection in self.connections[room_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    pass

    def create_poll(self, room_id: str, question: str, options: List[str]) -> dict:
        poll = {
            "question": question,
            "options": options,
            "votes": {opt: 0 for opt in options},
            "total_votes": 0
        }
        self.polls[room_id] = poll
        return poll

    def vote(self, room_id: str, option: str) -> dict:
        if room_id in self.polls and option in self.polls[room_id]["votes"]:
            self.polls[room_id]["votes"][option] += 1
            self.polls[room_id]["total_votes"] += 1
        return self.polls.get(room_id, {})


manager = PollManager()


@router.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):
    """
    WebSocket ulanish
    room_id = lesson_id (masalan: "lesson_42")
    """
    await manager.connect(websocket, room_id)
    try:
        while True:
            data = await websocket.receive_json()

            if data["type"] == "create_poll":
                # Professor so'rovnoma yaratdi
                poll = manager.create_poll(
                    room_id,
                    data["question"],
                    data["options"]
                )
                await manager.broadcast(room_id, {
                    "type": "poll_started",
                    "poll": poll
                })

            elif data["type"] == "vote":
                # Talaba ovoz berdi
                updated_poll = manager.vote(room_id, data["option"])
                await manager.broadcast(room_id, {
                    "type": "poll_updated",
                    "poll": updated_poll
                })

            elif data["type"] == "end_poll":
                # So'rovnoma tugadi
                await manager.broadcast(room_id, {
                    "type": "poll_ended",
                    "final_results": manager.polls.get(room_id)
                })

    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id)
