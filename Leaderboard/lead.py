import json
import uvicorn
from pydantic import BaseModel
from typing import List
import logging
from datetime import datetime
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

# --- LOGGING KONFIGURATION ---
logging.basicConfig(
    level=logging.INFO, 
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("OverlayServer")

# --- KONFIGURATION ---
PORT = 8084
state = {
    "player_data": [
        {"Player": "zitrone", "DisplayName": "Zitrone_2010", "Points": 0},
        {"Player": "luma", "DisplayName": "LuMa_369", "Points": 0},
        {"Player": "kai", "DisplayName": "Kaiomatiko", "Points": 0},
        {"Player": "arong", "DisplayName": "Arongforce", "Points": 0},
        {"Player": "solaris", "DisplayName": "Solaris", "Points": 0},
        {"Player": "void", "DisplayName": "Void", "Points": 0},
        {"Player": "blacksource", "DisplayName": "Blacksource", "Points": 0}
    ],
    "state_data": {"State": True},
    "last_update": ""
}
clients = []

class ArrayInput(BaseModel):
    items: List[dict]

# --- BROADCAST FUNKTION ---
async def broadcast(data_packet):
    if not clients:
        return
    message = json.dumps(data_packet)
    for client in clients[:]:
        try:
            await client.send_text(message)
        except Exception:
            if client in clients:
                clients.remove(client)

# --- LIFESPAN ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Server wird gestartet...")
    yield
    logger.info("Server wird beendet...")

app = FastAPI(lifespan=lifespan)
app.mount("/static", StaticFiles(directory="static"), name="static")

# --- CORS KONFIGURATION ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ROUTING ---
@app.get("/")
async def get_index():
    return FileResponse('index.html')

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    clients.append(ws)
    
    # Sende den aktuellen Stand sofort beim Verbinden
    # WICHTIG: Wir senden es so, wie das Frontend es erwartet
    await ws.send_text(json.dumps({
        "State": state["state_data"], 
        "PlayerList": state["player_data"]
    }))
    
    try:
        while True:
            # 1. Daten vom Frontend empfangen
            raw_data = await ws.receive_text()
            message = json.loads(raw_data)
            
            # 2. Daten im Server-Specher (state) aktualisieren
            if "State" in message:
                state["state_data"] = message["State"]
                logger.info(f"State aktualisiert: {message['State']}")
            
            if "PlayerList" in message:
                state["player_data"] = message["PlayerList"]
                logger.info(f"PlayerList aktualisiert: {len(message['PlayerList'])} Spieler")

            # 3. Die Nachricht an ALLE verbundenen Clients weiterleiten
            await broadcast(message)
            
    except WebSocketDisconnect:
        if ws in clients:
            clients.remove(ws)
    except Exception as e:
        logger.error(f"Fehler im WebSocket: {e}")
        if ws in clients:
            clients.remove(ws)

@app.post("/api/update")
async def api_update(data: ArrayInput):
    # Wir speichern das Array direkt im State
    state["player_data"] = data.items
    state["last_update"] = datetime.now().strftime("%H:%M:%S")
    
    # Wir broadcasten den gesamten State
    await broadcast({"type": "update", "data": state})
    return {"status": "success"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=PORT, log_level="debug")