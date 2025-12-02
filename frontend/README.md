# ⚛️ Simple RAG - Frontend (Next.js)

Modern chat interface built with Next.js 14, TypeScript, and Tailwind CSS with audio recording capabilities.

> **Note:** For a quick start of the entire system, it is recommended to use Docker from the root folder. Read the [main README](../README.md).

## ✨ Features

*   **Document Chat**: Natural language interaction with your PDF documents
*   **Image Analysis**: Upload and analyze images with detailed AI descriptions
*   **Drag & Drop Support**: Drag images directly onto the chat area for instant analysis
*   **Audio Recording**: **NEW!** Record voice messages using the built-in microphone button
*   **Audio Transcription**: **NEW!** Automatic transcription of voice messages using OpenAI Whisper
*   **Internet Search**: **NEW!** Toggle to search for current information on the internet for enhanced responses
*   **General Conversations**: Chat with the AI without uploading any documents or images
*   **Responsive Design**: Mobile-friendly interface with Tailwind CSS
*   **Real-time Interaction**: Smooth chat experience with loading indicators
*   **Auto-scrolling**: Automatically scrolls to the bottom when new messages appear
*   **Enhanced UI**: Clear status indicators showing search mode and processing states
*   **Visual Integration**: Proper rendering of images in the chat interface with appropriate styling

## 🛠️ Local Development (Manual)

Follow these steps if you want to run **only the frontend** on your machine to modify styles or components.

### Prerequisites
*   Node.js 18+
*   npm

### Installation and Execution

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Start in development mode:**
    ```bash
    npm run dev
    ```

The application will be available at `http://localhost:3000`.

**Important:** For the frontend to work locally, you must have the backend running (either locally on port 8000 or via Docker).

## 🐳 Docker Development

For development with Docker and live reloading, use the development docker-compose configuration:

1.  **Configure Environment Variables:**
    Make sure you have your API Key configured for the backend.
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
*   Changes to frontend files will automatically reload the Next.js development server
*   The application will be available at `http://localhost:3000`

## 🏗️ Architecture

The frontend includes:

*   **Main Chat Interface**: [app/page.tsx](./app/page.tsx)
*   **Audio Recorder Component**: [components/AudioRecorder.tsx](./components/AudioRecorder.tsx) - Handles recording and transcription
