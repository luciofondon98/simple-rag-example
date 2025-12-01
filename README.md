# 🤖 Simple Modern RAG (Full Stack + Docker)

This is a complete and modern **RAG (Retrieval-Augmented Generation)** system, designed to chat with your PDF documents.

It is built with a decoupled and professional architecture:
*   **Backend**: Python (FastAPI) + LangChain + ChromaDB (Vector Store).
*   **Frontend**: Next.js 14 (TypeScript + Tailwind CSS).
*   **Infrastructure**: Docker & Docker Compose.

## ✨ Features

*   **Document Processing**: Upload and process PDF documents for RAG
*   **Chat Interface**: Natural language interaction with your documents
*   **Audio Transcription**: **NEW!** Record voice messages and have them transcribed using OpenAI Whisper API
*   **Internet Search**: **NEW!** Search for current information on the internet when documents aren't sufficient
*   **Real-time Interaction**: Responsive chat interface with typing indicators and smooth scrolling
*   **Dockerized**: Easy deployment with Docker Compose

## 🚀 Quick Start (Docker Mode)

This is the easiest way to run the project. You don't need to install Python or Node.js on your machine, just Docker.

### Prerequisites
*   [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.
*   An OpenAI API Key.

### Steps

1.  **Configure Environment Variables:**
    Make sure you have your API Key configured in the backend.
    *   Go to `backend/`
    *   Create or edit the `.env` file:
        ```bash
        OPENAI_API_KEY=sk-your-key-here
        ```

2.  **Run with Docker Compose:**
    From the root of this project (where this README is located), run:

    ```bash
    docker-compose up --build
    ```

3.  **Ready!**
    *   🌐 **Frontend (Chat)**: Open [http://localhost:3000](http://localhost:3000)
    *   🔌 **Backend (API)**: Running at [http://localhost:8000](http://localhost:8000) (Automatic docs at [http://localhost:8000/docs](http://localhost:8000/docs))

To stop the system, press `Ctrl+C` in the terminal or run `docker-compose down`.

---

## 📂 Project Structure

```
simple-rag-modern/
├── docker-compose.yml          # Service orchestration
├── backend/                    # FastAPI API
│   ├── app/                    # RAG logic, endpoints and audio transcription
│   ├── Dockerfile              # Python image configuration
│   └── requirements.txt
└── frontend/                   # Next.js App
    ├── app/                    # React pages and components
    ├── components/             # Reusable components (AudioRecorder)
    ├── Dockerfile              # Optimized Node.js image configuration
    └── package.json
```

## 🌐 New Features Explained

### Internet Search Capability
*   **Hybrid Search**: The system intelligently combines document-based RAG with internet search
*   **Smart Decision**: Automatically decides when to use internet search based on document availability and relevance
*   **Clear Indicators**: Shows when searching the internet with "Buscando en la web..." indicator
*   **Endpoint**: New `/chat_with_internet` endpoint available for internet-enhanced responses

### Frontend UI Improvements
*   **Smooth Scrolling**: Automatically scrolls to the bottom when new messages appear
*   **Internet Search Toggle**: Checkbox to enable/disable internet search capability
*   **Enhanced Loading States**: Different loading messages for different operations
*   **Status Indicators**: Clear indication of whether internet search is active

## 🔧 Local Development (Without Docker)

If you want to develop or modify the code, you can run each service separately on your local machine. Check the specific READMEs within each folder for detailed instructions:

*   [Backend Instructions](./backend/README.md)
*   [Frontend Instructions](./frontend/README.md)