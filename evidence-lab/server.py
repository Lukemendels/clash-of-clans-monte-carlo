#!/usr/bin/env python3
"""Basecracker Evidence Lab local media server.

No third-party Python packages are required. ffmpeg and ffprobe must be available
on PATH. The server binds to localhost only and keeps uploaded media under the
ignored evidence-lab/workspace directory.
"""

from __future__ import annotations

import hashlib
import json
import mimetypes
import os
import re
import shutil
import subprocess
import sys
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse

ROOT = Path(__file__).resolve().parent
STATIC = ROOT / "static"
WORKSPACE = ROOT / "workspace" / "current"
STATE_FILE = WORKSPACE / "state.json"
FRAME_CACHE = WORKSPACE / "frames"
HOST = "127.0.0.1"
DEFAULT_PORT = 8765
MAX_UPLOAD_BYTES = 8 * 1024 * 1024 * 1024
CHUNK = 1024 * 1024


def command_version(binary: str) -> str:
    path = shutil.which(binary)
    if not path:
        raise RuntimeError(f"{binary} is required but was not found on PATH.")
    result = subprocess.run([path, "-version"], capture_output=True, text=True, check=True)
    return result.stdout.splitlines()[0].strip()


def parse_ratio(value: str | None) -> float | None:
    if not value or value in {"0/0", "N/A"}:
        return None
    if "/" in value:
        a, b = value.split("/", 1)
        try:
            denominator = float(b)
            return float(a) / denominator if denominator else None
        except ValueError:
            return None
    try:
        return float(value)
    except ValueError:
        return None


def numeric_or_none(value):
    try:
        if value in (None, "", "N/A"):
            return None
        return float(value)
    except (TypeError, ValueError):
        return None


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(CHUNK), b""):
            digest.update(chunk)
    return digest.hexdigest()


def probe_video(path: Path, known_sha256: str | None = None) -> dict:
    ffprobe = shutil.which("ffprobe")
    if not ffprobe:
        raise RuntimeError("ffprobe is required but was not found on PATH.")

    entries = (
        "stream=index,codec_name,width,height,avg_frame_rate,r_frame_rate,time_base,duration,nb_frames:"
        "frame=best_effort_timestamp_time,pts_time,pkt_duration_time,duration_time,pict_type,key_frame"
    )
    cmd = [
        ffprobe,
        "-v", "error",
        "-select_streams", "v:0",
        "-show_entries", entries,
        "-show_frames",
        "-of", "json",
        str(path),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or "ffprobe failed.")

    payload = json.loads(result.stdout)
    streams = payload.get("streams") or []
    raw_frames = payload.get("frames") or []
    if not streams:
        raise RuntimeError("No video stream found.")
    if not raw_frames:
        raise RuntimeError("ffprobe returned no decoded video frames.")

    stream = streams[0]
    frames = []
    missing_pts = 0
    for index, raw in enumerate(raw_frames):
        pts = numeric_or_none(raw.get("best_effort_timestamp_time"))
        if pts is None:
            pts = numeric_or_none(raw.get("pts_time"))
        duration = numeric_or_none(raw.get("pkt_duration_time"))
        if duration is None:
            duration = numeric_or_none(raw.get("duration_time"))
        if pts is None:
            missing_pts += 1
        frames.append({
            "index": index,
            "ptsSeconds": pts,
            "durationSeconds": duration,
            "pictType": raw.get("pict_type"),
            "keyFrame": bool(raw.get("key_frame")),
        })

    ffprobe_version = command_version("ffprobe")
    ffmpeg_version = command_version("ffmpeg")
    stat = path.stat()
    return {
        "schema": "basecracker-evidence-lab-media/v1",
        "filename": path.name,
        "bytes": stat.st_size,
        "sha256": known_sha256 or sha256_file(path),
        "videoStreamIndex": int(stream.get("index", 0)),
        "codec": stream.get("codec_name"),
        "width": int(stream.get("width") or 0),
        "height": int(stream.get("height") or 0),
        "avgFrameRate": stream.get("avg_frame_rate"),
        "avgFrameRateValue": parse_ratio(stream.get("avg_frame_rate")),
        "realFrameRate": stream.get("r_frame_rate"),
        "realFrameRateValue": parse_ratio(stream.get("r_frame_rate")),
        "timeBase": stream.get("time_base"),
        "durationSeconds": numeric_or_none(stream.get("duration")),
        "declaredFrameCount": int(stream["nb_frames"]) if str(stream.get("nb_frames", "")).isdigit() else None,
        "decodedFrameCount": len(frames),
        "framesWithMissingPts": missing_pts,
        "exactPtsCoverage": missing_pts == 0,
        "ffprobeVersion": ffprobe_version,
        "ffmpegVersion": ffmpeg_version,
        "frames": frames,
    }


def current_media_path(state: dict | None = None) -> Path | None:
    state = state or load_state()
    filename = state.get("filename") if state else None
    if not filename:
        return None
    path = WORKSPACE / filename
    return path if path.exists() else None


def load_state() -> dict | None:
    if not STATE_FILE.exists():
        return None
    try:
        return json.loads(STATE_FILE.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return None


def save_state(state: dict) -> None:
    WORKSPACE.mkdir(parents=True, exist_ok=True)
    STATE_FILE.write_text(json.dumps(state, separators=(",", ":")), encoding="utf-8")


def reset_workspace() -> None:
    if WORKSPACE.exists():
        shutil.rmtree(WORKSPACE)
    FRAME_CACHE.mkdir(parents=True, exist_ok=True)


def safe_upload_name(raw_name: str) -> str:
    decoded = unquote(raw_name or "video.mp4")
    leaf = Path(decoded).name
    cleaned = re.sub(r"[^A-Za-z0-9._ -]+", "_", leaf).strip(" .") or "video.mp4"
    return cleaned[:180]


def extract_frame_png(media_path: Path, index: int) -> Path:
    state = load_state()
    if not state:
        raise RuntimeError("No video loaded.")
    count = int(state.get("decodedFrameCount") or 0)
    if index < 0 or index >= count:
        raise ValueError(f"Frame index {index} is outside 0..{max(0, count - 1)}.")

    FRAME_CACHE.mkdir(parents=True, exist_ok=True)
    target = FRAME_CACHE / f"frame-{index:09d}.png"
    if target.exists():
        return target

    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        raise RuntimeError("ffmpeg is required but was not found on PATH.")
    filter_expr = f"select=eq(n\\,{index})"
    cmd = [
        ffmpeg,
        "-v", "error",
        "-i", str(media_path),
        "-vf", filter_expr,
        "-frames:v", "1",
        "-vsync", "0",
        "-y", str(target),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0 or not target.exists():
        raise RuntimeError(result.stderr.strip() or f"Could not decode frame {index}.")
    return target


class Handler(BaseHTTPRequestHandler):
    server_version = "BasecrackerEvidenceLab/0.1"

    def log_message(self, fmt, *args):
        sys.stdout.write(f"[Evidence Lab] {self.address_string()} {fmt % args}\n")

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/health":
            return self.send_json({"ok": True, "ffmpeg": command_version("ffmpeg"), "ffprobe": command_version("ffprobe")})
        if parsed.path == "/api/state":
            return self.send_json(load_state() or {"loaded": False})
        if parsed.path == "/api/frame":
            return self.serve_frame(parsed)
        if parsed.path == "/api/video":
            return self.serve_video()
        return self.serve_static(parsed.path)

    def do_HEAD(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/video":
            return self.serve_video(head_only=True)
        return self.serve_static(parsed.path, head_only=True)

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path != "/api/video":
            return self.send_error_json(HTTPStatus.NOT_FOUND, "Unknown endpoint.")
        try:
            return self.receive_video()
        except Exception as exc:  # noqa: BLE001 - surface local tool failure to UI
            return self.send_error_json(HTTPStatus.BAD_REQUEST, str(exc))

    def receive_video(self):
        length_text = self.headers.get("Content-Length")
        if not length_text or not length_text.isdigit():
            raise ValueError("Content-Length is required.")
        length = int(length_text)
        if length <= 0:
            raise ValueError("Video upload is empty.")
        if length > MAX_UPLOAD_BYTES:
            raise ValueError("Video exceeds the 8 GiB Evidence Lab limit.")

        filename = safe_upload_name(self.headers.get("X-Filename", "video.mp4"))
        reset_workspace()
        target = WORKSPACE / filename
        digest = hashlib.sha256()
        remaining = length
        with target.open("wb") as handle:
            while remaining > 0:
                chunk = self.rfile.read(min(CHUNK, remaining))
                if not chunk:
                    raise IOError("Upload ended before Content-Length bytes were received.")
                handle.write(chunk)
                digest.update(chunk)
                remaining -= len(chunk)

        state = probe_video(target, digest.hexdigest())
        save_state(state)
        self.send_json(state)

    def serve_frame(self, parsed):
        try:
            query = parse_qs(parsed.query)
            index = int((query.get("index") or ["-1"])[0])
            state = load_state()
            media = current_media_path(state)
            if not state or not media:
                return self.send_error_json(HTTPStatus.NOT_FOUND, "No video loaded.")
            image = extract_frame_png(media, index)
            data = image.read_bytes()
            self.send_response(HTTPStatus.OK)
            self.send_header("Content-Type", "image/png")
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Cache-Control", "private, max-age=31536000, immutable")
            self.end_headers()
            self.wfile.write(data)
        except (ValueError, RuntimeError) as exc:
            self.send_error_json(HTTPStatus.BAD_REQUEST, str(exc))

    def serve_video(self, head_only: bool = False):
        state = load_state()
        media = current_media_path(state)
        if not media:
            return self.send_error_json(HTTPStatus.NOT_FOUND, "No video loaded.")

        size = media.stat().st_size
        start, end = 0, size - 1
        status = HTTPStatus.OK
        range_header = self.headers.get("Range")
        if range_header:
            match = re.fullmatch(r"bytes=(\d*)-(\d*)", range_header.strip())
            if not match:
                return self.send_error_json(HTTPStatus.REQUESTED_RANGE_NOT_SATISFIABLE, "Unsupported Range header.")
            left, right = match.groups()
            if left:
                start = int(left)
                end = int(right) if right else size - 1
            elif right:
                suffix = int(right)
                start = max(0, size - suffix)
                end = size - 1
            if start < 0 or end < start or start >= size:
                return self.send_error_json(HTTPStatus.REQUESTED_RANGE_NOT_SATISFIABLE, "Range outside media.")
            end = min(end, size - 1)
            status = HTTPStatus.PARTIAL_CONTENT

        length = end - start + 1
        mime = mimetypes.guess_type(media.name)[0] or "application/octet-stream"
        self.send_response(status)
        self.send_header("Content-Type", mime)
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Content-Length", str(length))
        if status == HTTPStatus.PARTIAL_CONTENT:
            self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        self.end_headers()
        if head_only:
            return
        with media.open("rb") as handle:
            handle.seek(start)
            remaining = length
            while remaining > 0:
                chunk = handle.read(min(CHUNK, remaining))
                if not chunk:
                    break
                self.wfile.write(chunk)
                remaining -= len(chunk)

    def serve_static(self, url_path: str, head_only: bool = False):
        name = "index.html" if url_path in {"", "/"} else url_path.lstrip("/")
        target = (STATIC / name).resolve()
        try:
            target.relative_to(STATIC.resolve())
        except ValueError:
            return self.send_error_json(HTTPStatus.FORBIDDEN, "Invalid path.")
        if not target.is_file():
            return self.send_error_json(HTTPStatus.NOT_FOUND, "File not found.")
        data = target.read_bytes()
        mime = mimetypes.guess_type(target.name)[0] or "application/octet-stream"
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", mime)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        if not head_only:
            self.wfile.write(data)

    def send_json(self, payload: dict, status: HTTPStatus = HTTPStatus.OK):
        data = json.dumps(payload, separators=(",", ":")).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)

    def send_error_json(self, status: HTTPStatus, message: str):
        self.send_json({"ok": False, "error": message}, status)


def main() -> int:
    port = int(os.environ.get("BASECRACKER_EVIDENCE_PORT", DEFAULT_PORT))
    try:
        ffmpeg_version = command_version("ffmpeg")
        ffprobe_version = command_version("ffprobe")
    except RuntimeError as exc:
        print(f"Evidence Lab cannot start: {exc}", file=sys.stderr)
        return 2

    WORKSPACE.mkdir(parents=True, exist_ok=True)
    FRAME_CACHE.mkdir(parents=True, exist_ok=True)
    print(ffmpeg_version)
    print(ffprobe_version)
    print(f"Basecracker Evidence Lab: http://{HOST}:{port}")
    print("Local-only server. Ctrl+C to stop.")
    server = ThreadingHTTPServer((HOST, port), Handler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping Evidence Lab.")
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
