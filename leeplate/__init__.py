__version__ = "0.1.0"
import argparse
import io
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from googletrans import LANGUAGES, Translator
from gtts import gTTS
from gtts.lang import tts_langs
from uvicorn import run as urun

HERE = Path(__file__).parent

app = FastAPI()
app.mount("/static", StaticFiles(directory=HERE / "static"), name="static")
templates = Jinja2Templates(directory=HERE / "templates")
translator = Translator()


@app.get("/", response_class=HTMLResponse)
async def translate(request: Request):
    return templates.TemplateResponse(
        "translate.j2",
        {
            "current_year": datetime.now().year,
            "request": request,
            "languages": {code: name.title() for code, name in LANGUAGES.items()},
            "default_lang": "en",
            "version": __version__,
        },
    )


@app.post("/translate")
async def translate_api(request: Request):
    data = await request.json()
    text = data["text"]
    source_language = data["source_language"]
    target_language = data["target_language"]

    translation = translator.translate(text, src=source_language, dest=target_language)
    return JSONResponse(
        content={
            "text": translation.text,
            "origin": translation.origin,
            "src": translation.src,
            "dest": translation.dest,
        }
    )


@app.get("/spoken-languages")
async def spoken_languages():
    return {"languages": tts_langs()}


@app.get("/speak")
async def speak(text: str, lang: str):
    tts = gTTS(text, lang=lang)

    mp3_file = io.BytesIO()
    tts.write_to_fp(mp3_file)
    mp3_file.seek(0)
    return StreamingResponse(mp3_file, media_type="audio/mp3")


def run():
    parser = argparse.ArgumentParser(
        description="Leeplate: A privacy-oriented alternative frontend for translation providers."
    )
    parser.add_argument("--host", type=str, default="127.0.0.1", help="Host to run the server on (default: 127.0.0.1)")
    parser.add_argument("--port", type=int, default=8000, help="Port to run the server on (default: 8000)")
    parser.add_argument("--reload", action="store_true", help="Enable auto-reloading of the server")

    args = parser.parse_args()

    urun(app, host=args.host, port=args.port, reload=args.reload)
