# 🤖 Simple Modern RAG (Full Stack + Docker)

This is a complete and modern **RAG (Retrieval-Augmented Generation)** system, designed to chat with your PDF documents.

It is built with a decoupled and professional architecture:
*   **Backend**: Python (FastAPI) + LangChain + ChromaDB (Vector Store).
*   **Frontend**: Next.js 14 (TypeScript + Tailwind CSS).
*   **Infrastructure**: Docker & Docker Compose.

## ✨ Features

*   **Document Processing**: Upload and process PDF documents for RAG
*   **Image Analysis**: Upload and analyze images using AI vision models with detailed descriptions
*   **Drag & Drop Support**: Drag images directly onto the chat area for instant analysis
*   **Chat Interface**: Natural language interaction with your documents and images
*   **Audio Transcription**: **NEW!** Record voice messages and have them transcribed using OpenAI Whisper API
*   **Internet Search**: **NEW!** Search for current information on the internet when documents aren't sufficient
*   **General Conversations**: Chat with the AI even without uploading documents
*   **Real-time Interaction**: Responsive chat interface with typing indicators and smooth scrolling
*   **Dockerized**: Easy deployment with Docker Compose

## 🚀 Quick Start (Docker Mode)

This is the easiest way to run the project. You don't need to install Python or Node.js on your machine, just Docker.

### Prerequisites
*   [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.
*   An OpenAI API Key.

### Production Mode

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

### Development Mode (With Live Reloading)

For development with live reloading without rebuilding containers:

1.  **Configure Environment Variables:**
    Make sure you have your API Key configured in the backend.
    *   Go to `backend/`
    *   Create or edit the `.env` file:
        ```bash
        OPENAI_API_KEY=sk-your-key-here
        ```

2.  **Run with Development Docker Compose:**
    From the root of this project (where this README is located), run:

    ```bash
    docker-compose -f docker-compose.dev.yml up --build
    ```

3.  **Ready!**
    *   🌐 **Frontend (Chat)**: Open [http://localhost:3000](http://localhost:3000)
    *   🔌 **Backend (API)**: Running at [http://localhost:8000](http://localhost:8000) (Automatic docs at [http://localhost:8000/docs](http://localhost:8000/docs))

In development mode:
*   Changes to Python files in `backend/app/` will automatically reload the backend server
*   Changes to frontend files will automatically reload the Next.js development server
*   No need to rebuild images for code changes - changes are reflected immediately
*   Only rebuild when changing dependencies (requirements.txt, package.json): `docker-compose -f docker-compose.dev.yml up --build`

To stop the system, press `Ctrl+C` in the terminal or run `docker-compose -f docker-compose.dev.yml down`.

## Development Workflow

Quick command to start development environment:
```bash
docker-compose -f docker-compose.dev.yml up
```

Rebuild containers when changing dependencies:
```bash
docker-compose -f docker-compose.dev.yml up --build
```

The development setup features:
*   Live reloading for both frontend and backend
*   Volume mounting to reflect code changes immediately
*   Auto-restart on code changes

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

### Image Analysis & Drag & Drop
*   **Image Upload**: Upload images in common formats (JPG, PNG, GIF, WebP) for AI analysis
*   **Detailed Descriptions**: Get comprehensive analysis of image content, objects, text, and visual elements
*   **Drag & Drop**: Simply drag images directly onto the chat area for instant analysis
*   **Visual Integration**: Images are displayed in the chat with their analysis responses
*   **Vision Model**: Powered by OpenAI's GPT-4 Vision model for accurate image understanding

### Internet Search Capability
*   **Hybrid Search**: The system intelligently combines document-based RAG with internet search
*   **Smart Decision**: Automatically decides when to use internet search based on document availability and relevance
*   **Clear Indicators**: Shows when searching the internet with "Buscando en la web..." indicator
*   **Endpoint**: New `/chat_with_internet` endpoint available for internet-enhanced responses

### General Conversations
*   **No Document Required**: Chat with the AI without uploading any documents or images
*   **General Knowledge**: Get answers to general questions using the AI's pre-trained knowledge
*   **Seamless Transition**: Switch between general chat and document-specific questions
*   **Consistent Interface**: Same clean and intuitive chat interface for all interaction types

### Frontend UI Improvements
*   **Smooth Scrolling**: Automatically scrolls to the bottom when new messages appear
*   **Internet Search Toggle**: Checkbox to enable/disable internet search capability
*   **Enhanced Loading States**: Different loading messages for different operations
*   **Status Indicators**: Clear indication of whether internet search is active
*   **Image Support**: Proper rendering of images in the chat interface

## 🔧 Local Development (Without Docker)

If you want to develop or modify the code, you can run each service separately on your local machine. Check the specific READMEs within each folder for detailed instructions:

*   [Backend Instructions](./backend/README.md)
*   [Frontend Instructions](./frontend/README.md)