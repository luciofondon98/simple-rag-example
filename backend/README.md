# 🐍 Simple RAG - Backend (FastAPI)

REST API for document processing and RAG system management with audio transcription capabilities.

> **Note:** For a quick start of the entire system, it is recommended to use Docker from the root folder. Read the [main README](../README.md).

## ✨ Features

*   **Document Processing**: PDF upload and processing for RAG
*   **Image Analysis**: Image upload and analysis using AI vision models
*   **Chat Interface**: Question-answering system with memory
*   **Audio Transcription**: Whisper API integration for voice-to-text conversion
*   **Internet Search**: Enhanced questions with current information from the web
*   **General Conversations**: Chat without uploaded documents using general AI knowledge
*   **RESTful API**: Clean and well-documented endpoints

## 🛠️ Local Development (Manual)

Follow these steps if you want to run **only the backend** on your machine for development or debugging.

### Prerequisites
*   Python 3.11+
*   Virtualenv (recommended)

### Installation and Execution

1.  **Virtual Environment:**
    ```bash
    python3 -m venv venv
    source venv/bin/activate  # Windows: venv\Scripts\activate
    ```

2.  **Dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

3.  **Configuration:**
    Create a `.env` file in this folder with your key:
    ```
    OPENAI_API_KEY=sk-your-key-here
    ```

4.  **Start Server:**
    ```bash
    uvicorn app.main:app --reload --port 8000
    ```

The server will be available at `http://localhost:8000`.

## 🐳 Docker Development

For development with Docker and live reloading, use the development docker-compose configuration:

1.  **Configure Environment Variables:**
    Make sure you have your API Key configured in the backend.
    *   Go to `backend/`
    *   Create or edit the `.env` file:
        ```
        OPENAI_API_KEY=sk-your-key-here
        ```

2.  **Run with Development Docker Compose:**
    From the project root, run:
    ```bash
    docker-compose -f docker-compose.dev.yml up --build
    ```

In Docker development mode:
*   Changes to Python files in `backend/app/` will automatically reload the backend server
*   The server will be available at `http://localhost:8000`

## 📡 API Endpoints

*   **GET /** - Health check
*   **POST /upload** - Upload and process PDF documents
*   **POST /chat** - Chat with your documents (now supports general conversations without documents)
*   **POST /chat_with_internet** - Chat with internet search capability for current information
*   **POST /analyze_image** - Analyze images using AI vision models
*   **POST /transcribe** - Transcribe audio to text using OpenAI Whisper
