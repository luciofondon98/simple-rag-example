from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from app.rag import rag_service
import traceback
import tempfile
import os
from pathlib import Path

app = FastAPI(title="Simple RAG API")

# Configuración CORS (Permitir que el frontend React hable con este backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, cambiar esto por la URL de tu frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    question: str
    history: List[List[str]] = [] # Lista de pares [role, content]

class ChatResponse(BaseModel):
    answer: str

@app.get("/")
def read_root():
    return {"status": "API is running"}

@app.post("/upload")
async def upload_documents(files: List[UploadFile] = File(...)):
    """
    Endpoint para subir PDFs y procesarlos.
    """
    try:
        file_contents = []
        for file in files:
            content = await file.read()
            file_contents.append(content)
        
        num_chunks = rag_service.process_pdfs(file_contents)
        return {"message": f"Procesados exitosamente {len(files)} archivos en {num_chunks} fragmentos."}
    except Exception as e:
        traceback.print_exc()  # Imprimir el error completo en la consola
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    """
    Endpoint para realizar preguntas al sistema RAG con memoria.
    """
    try:
        # Convertimos la lista de listas a lista de tuplas para LangChain
        formatted_history = [(msg[0], msg[1]) for msg in request.history]
        answer = rag_service.get_answer(request.question, formatted_history)
        return ChatResponse(answer=answer)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """
    Endpoint para transcribir audio usando OpenAI Whisper API.
    """
    try:
        # Check if file is an audio file
        if not file.content_type or not file.content_type.startswith("audio/"):
            raise HTTPException(status_code=400, detail="File must be an audio file")

        # Read file content
        audio_content = await file.read()

        # Determine file extension based on content type if filename doesn't have one
        content_type = file.content_type
        if '.' not in file.filename:
            # Map common audio content types to extensions
            if 'webm' in content_type:
                ext = 'webm'
            elif 'mp3' in content_type or 'mpeg' in content_type:
                ext = 'mp3'
            elif 'wav' in content_type or 'wave' in content_type:
                ext = 'wav'
            elif 'm4a' in content_type:
                ext = 'm4a'
            else:
                ext = 'webm'  # default
        else:
            ext = file.filename.split('.')[-1]

        # Save to temporary file with appropriate extension
        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{ext}") as temp_file:
            temp_file.write(audio_content)
            temp_file_path = temp_file.name

        try:
            # Check if OpenAI API key is available in environment
            import os
            openai_api_key = os.getenv("OPENAI_API_KEY")

            if not openai_api_key:
                raise HTTPException(status_code=500, detail="OpenAI API key not configured in environment")

            # Import openai inside the function to avoid dependency issues if not available
            from openai import OpenAI
            client = OpenAI(api_key=openai_api_key)

            # Transcribe the audio file
            with open(temp_file_path, "rb") as audio_file:
                transcript = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file
                )

            return {"text": transcript.text}

        finally:
            # Clean up temporary file
            os.unlink(temp_file_path)

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error transcribing audio: {str(e)}")