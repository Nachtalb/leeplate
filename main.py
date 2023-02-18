import io

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from googletrans import LANGUAGES, Translator
from gtts import gTTS


app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")
translator = Translator()


@app.get("/", response_class=HTMLResponse)
async def translate(request: Request):
    return templates.TemplateResponse(
        "translate.j2",
        {
            "request": request,
            "languages": {code: name.title() for code, name in LANGUAGES.items()},
            "default_lang": "en",
        },
    )


@app.post("/translate")
async def translate_api(request: Request):
    data = await request.json()
    text = data["text"]
    source_language = data["source_language"]
    target_language = data["target_language"]

    translation = translator.translate(text, src=source_language, dest=target_language)
    return JSONResponse(content={"text": translation.text, "origin": translation.origin, "src": translation.src, "dest": translation.dest})


@app.get("/speak")
async def speak(text: str, lang: str):
    tts = gTTS(text, lang=lang)
    mp3_file = io.BytesIO()
    tts.write_to_fp(mp3_file)
    mp3_file.seek(0)
    return StreamingResponse(mp3_file, media_type="audio/mp3")
