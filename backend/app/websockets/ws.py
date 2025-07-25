from fastapi import WebSocket, WebSocketDisconnect
import asyncio
import json
import logging
import random
from datetime import datetime

from app.websockets.connection import ConnectionManager
from app.agent.tts_service import speak, stop_audio
from app.api.shared import interview_agent

logger = logging.getLogger(__name__)
manager = ConnectionManager()

async def handle_speech_message(message_data: dict, client_id: str):
    stop_audio()
    transcript = message_data.get("data", "")
    is_final = message_data.get("isFinal", False)
    code_context = message_data.get("codeContext", "")
    if is_final and transcript.strip():
        logger.info(f"Final speech from {client_id}: {transcript}")
        user_message = {
            "type": "user_message",
            "message": transcript,
            "timestamp": datetime.now().isoformat(),
            "source": "speech"
        }
        await manager.send_personal_message(user_message, client_id)
        await asyncio.sleep(1)
        ai_response = interview_agent.send_message_agent(user_message["message"], user_code=code_context)
        ai_message = {
            "type": "ai_message",
            "message": ai_response,
            "timestamp": datetime.now().isoformat(),
            "messageType": "response"
        }
        await manager.send_personal_message(ai_message, client_id)
        speak(ai_response)
    elif not is_final:
        interim_message = {
            "type": "interim_speech",
            "message": transcript,
            "timestamp": datetime.now().isoformat()
        }
        await manager.send_personal_message(interim_message, client_id)

async def handle_chat_message(message_data: dict, client_id: str):
    message = message_data.get("message", "")
    code_context = message_data.get("codeContext", "")
    if message.strip():
        user_message = {
            "type": "user_message",
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "source": "text"
        }
        await manager.send_personal_message(user_message, client_id)
        await asyncio.sleep(1)
        # You can replace this with a real AI response if needed
        ai_response = "[AI response placeholder]"
        ai_message = {
            "type": "ai_message",
            "message": ai_response,
            "timestamp": datetime.now().isoformat(),
            "messageType": "response"
        }
        await manager.send_personal_message(ai_message, client_id)

async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(websocket, client_id)
    last_code_context = ""
    try:
        while True:
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
                message_data = json.loads(data)
                last_code_context = message_data.get("codeContext", last_code_context)
                logger.info(f"Received from {client_id}: {message_data}")
                if message_data.get("type") == "speech":
                    await handle_speech_message(message_data, client_id)
                elif message_data.get("type") == "chat":
                    await handle_chat_message(message_data, client_id)
                elif message_data.get("type") == "ping":
                    await manager.send_personal_message({"type": "pong"}, client_id)
            except asyncio.TimeoutError:
                logger.info(f"Client {client_id} has been idle. Generating a hint.")
                nudge_prompt = "The user has been silent for a while. Offer a gentle hint or ask a question to help them get unstuck. Don't give away the full answer."
                ai_hint = interview_agent.send_message_agent(nudge_prompt, last_code_context)
                hint_message = {
                    "type": "ai_message",
                    "message": ai_hint,
                    "timestamp": datetime.now().isoformat(),
                    "messageType": "hint"
                }
                await manager.send_personal_message(hint_message, client_id)
                speak(ai_hint)
                continue
    except WebSocketDisconnect:
        manager.disconnect(client_id)
    except Exception as e:
        logger.error(f"WebSocket error for {client_id}: {e}")
        manager.disconnect(client_id)
