"""FastAPI entrypoint: starts the poller, serves the snapshot the React app reads."""
from __future__ import annotations

import asyncio
import json
from contextlib import asynccontextmanager

from fastapi import Body, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from .config import MACHINE_DB_MODE, POLL_INTERVAL_SECONDS
from .db import connect, get_meta, init_db
from . import config_data, config_store, events, poller, snapshot


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    conn = connect()
    try:
        config_store.bootstrap(conn)
    finally:
        conn.close()
    stop = asyncio.Event()
    task = asyncio.create_task(poller.run_forever(stop))
    try:
        yield
    finally:
        stop.set()
        await task


app = FastAPI(title="IOT KPI Dashboard API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # dev; tighten for production
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict:
    conn = connect()
    try:
        return {
            "ok": True,
            "machineDbMode": MACHINE_DB_MODE,
            "pollIntervalSeconds": POLL_INTERVAL_SECONDS,
            "lastPollTs": get_meta(conn, "last_poll_ts"),
            "resetEpoch": get_meta(conn, "reset_epoch"),
            "resetTs": get_meta(conn, "reset_ts"),
        }
    finally:
        conn.close()


@app.get("/api/snapshot")
def get_snapshot() -> dict:
    conn = connect()
    try:
        payload = snapshot.build_current(conn)
        if payload is None:
            return {"ready": False, "message": "poller has not produced a reading yet"}
        payload["ready"] = True
        return payload
    finally:
        conn.close()


@app.get("/api/stream")
async def stream() -> StreamingResponse:
    """Server-Sent Events: pushes the full snapshot on every poller tick.
    The client does GET /api/snapshot once for first paint, then just listens."""
    return StreamingResponse(
        events.subscribe(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # disable proxy buffering (nginx)
        },
    )


@app.post("/api/reset")
def post_reset() -> dict:
    conn = connect()
    try:
        new_epoch = poller.manual_reset(conn)
        return {"ok": True, "resetEpoch": new_epoch}
    finally:
        conn.close()


@app.get("/api/config")
def get_config() -> dict:
    return {
        "config": config_data.current_settings(),
        "defaults": config_data.DEFAULT_SETTINGS,
        "machines": config_data.MACHINES,
    }


@app.put("/api/config")
def put_config(body: dict = Body(...)) -> dict:
    errors = config_data.validate_settings(body)
    if errors:
        raise HTTPException(status_code=422, detail=errors)
    conn = connect()
    try:
        saved = config_store.save(conn, body)
        return {"ok": True, "config": saved}
    finally:
        conn.close()


@app.post("/api/config/reset")
def reset_config() -> dict:
    conn = connect()
    try:
        saved = config_store.save(conn, dict(config_data.DEFAULT_SETTINGS))
        return {"ok": True, "config": saved}
    finally:
        conn.close()


@app.get("/api/inputs")
def get_inputs() -> dict:
    """Raw dump of the INPUT tables for the current epoch -- use this to check that
    your SELECT queries are landing rows correctly."""
    conn = connect()
    try:
        epoch = int(get_meta(conn, "reset_epoch", "1") or "1")
        line = conn.execute(
            "SELECT * FROM in_line WHERE reset_epoch = ?", (epoch,)
        ).fetchone()
        return {
            "resetEpoch": epoch,
            "in_line": dict(line) if line else None,
            "in_machine": [
                dict(r) for r in conn.execute(
                    "SELECT * FROM in_machine WHERE reset_epoch = ? ORDER BY machine_no", (epoch,)
                ).fetchall()
            ],
            "in_interval": [
                dict(r) for r in conn.execute(
                    "SELECT * FROM in_interval WHERE reset_epoch = ? ORDER BY interval_no", (epoch,)
                ).fetchall()
            ],
            "in_alarm": [
                dict(r) for r in conn.execute(
                    "SELECT * FROM in_alarm WHERE reset_epoch = ? ORDER BY ts_hhmm", (epoch,)
                ).fetchall()
            ],
        }
    finally:
        conn.close()


@app.get("/api/history")
def get_history(limit: int = 30) -> dict:
    conn = connect()
    try:
        rows = conn.execute(
            "SELECT reset_epoch, archived_ts, payload FROM snapshot_history "
            "ORDER BY id DESC LIMIT ?",
            (limit,),
        ).fetchall()
        return {
            "items": [
                {"resetEpoch": r["reset_epoch"], "archivedAt": r["archived_ts"],
                 "payload": json.loads(r["payload"])}
                for r in rows
            ]
        }
    finally:
        conn.close()
