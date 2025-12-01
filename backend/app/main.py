from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from app.rag import rag_service
import traceback

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