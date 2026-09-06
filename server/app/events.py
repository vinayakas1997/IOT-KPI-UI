"""In-process fan-out of the latest snapshot to connected SSE clients.

The poller calls `publish(payload)` after every tick. Each `/api/stream`
subscriber gets its own bounded queue; if a slow client can't keep up we drop
the oldest frame (a wallboard only ever cares about the newest state).
"""
from __future__ import annotations

import asyncio
import json
from typing import AsyncIterator

_subscribers: set[asyncio.Queue] = set()
_latest: dict | None = None
_seq: int = 0


def publish(payload: dict) -> None:
    """Called from the poller loop with a freshly built snapshot."""
    global _latest, _seq
    _seq += 1
    payload = {**payload, "seq": _seq}
    _latest = payload
    dead: list[asyncio.Queue] = []
    for q in _subscribers:
        try:
            q.put_nowait(payload)
        except asyncio.QueueFull:
            try:
                q.get_nowait()          # drop oldest, keep newest
                q.put_nowait(payload)
            except Exception:
                dead.append(q)
    for q in dead:
        _subscribers.discard(q)


def latest() -> dict | None:
    return _latest


async def subscribe() -> AsyncIterator[str]:
    """Yields SSE-framed strings: the current snapshot immediately, then every
    new one as it's published, plus a heartbeat comment so proxies and the
    client's staleness check stay happy."""
    q: asyncio.Queue = asyncio.Queue(maxsize=8)
    _subscribers.add(q)
    try:
        if _latest is not None:
            yield f"data: {json.dumps(_latest)}\n\n"
        while True:
            try:
                payload = await asyncio.wait_for(q.get(), timeout=15.0)
                yield f"data: {json.dumps(payload)}\n\n"
            except asyncio.TimeoutError:
                yield ": keep-alive\n\n"
    finally:
        _subscribers.discard(q)
