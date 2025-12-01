# 🏗️ RAG System Architecture (Deep Dive)

This document explains in detail the internal workings, data flow, and design decisions of the **Simple RAG Modern** project. It is designed to understand not only *how* the code is used, but *what* happens "under the hood" in a Generative Artificial Intelligence system.

---

## 1. Overview: The RAG Concept

**RAG (Retrieval-Augmented Generation)** is a technique that optimizes the output of a Language Model (LLM) like GPT-4, allowing it to consult an external knowledge base before responding.

### The Exam Analogy
Imagine an exam:
*   **Standard ChatGPT** is a student taking an exam from memory. If they didn't study the topic, they will hallucinate (make things up).
*   **RAG** is that same student, but with an **open textbook** (your PDFs) on the desk. When you ask them a question, they first look up the answer in the book and then write it down.

---

## 2. Data Flow Diagram

When a user asks a question, the following sequential process occurs:

```mermaid
User -> [Frontend Next.js] -> [Backend FastAPI] -> [OpenAI Embeddings] -> [ChromaDB] -> [LangChain] -> [GPT-4] -> User
```

### Phase A: Ingestion (When you upload a PDF)

1.  **Loading (`Loader`)**: The system reads the binary PDF file and extracts the plain text.
2.  **Splitting (`Splitting`)**: The text is divided into small blocks (*chunks*) of 1000 characters with a 200-character *overlap*.
    *   *Why?* To preserve semantic context. If an important sentence is cut in half, the overlap ensures that the next block has it complete.
3.  **Vectorization (`Embedding`)**: Each text block is sent to OpenAI, which returns a **Vector** (a list of 1536 numbers).
    *   *Key Concept*: This vector represents the **meaning** of the text. Texts with similar meanings will have mathematically close vectors.
4.  **Indexing**: The pairs: `{ Vector, Original Text }` are saved in **ChromaDB**.

### Phase B: Query (When you chat)

1.  **Input**: The user asks: *"Who is the protagonist?"*.
2.  **Question Embedding**: The question is also converted into a numerical vector.
3.  **Semantic Search (Retrieval)**:
    *   ChromaDB compares the question vector with millions of document vectors.
    *   It uses **Cosine Similarity** to find the "nearest neighbors".
    *   It retrieves the 3 most relevant text chunks.
4.  **Prompt Engineering (Augmentation)**:
    *   The Backend constructs an invisible message for the user. It inserts the 3 retrieved chunks into an instruction for the LLM.
    *   *Prompt Structure*: "Use THIS information [Chunk 1, 2, 3] to answer THIS question [User Input]".
5.  **Generation**: The LLM (GPT-4o-mini) reads the chunks and generates a natural language response based **strictly** on the provided evidence.

### Phase C: Audio Transcription (When using voice input)

1.  **Audio Recording**: The frontend captures audio using the browser's MediaRecorder API.
2.  **Audio Encoding**: Audio is encoded in webm format with opus codec for optimal Whisper API compatibility.
3.  **Audio Transmission**: The recorded audio is sent to the backend `/transcribe` endpoint.
4.  **Audio Processing**: The backend receives the audio file and prepares it for OpenAI Whisper API.
5.  **Transcription**: OpenAI Whisper processes the audio and returns the transcribed text.
6.  **Response**: The transcribed text is sent back to the frontend and populated in the chat input field.

---

## 3. Detailed Technical Components

### 🧠 The Brain: LangChain
LangChain acts as the orchestrator. It is the framework that connects the pieces. In this project, it uses `create_retrieval_chain` to automate the flow of:
1.  Going to the database.
2.  Fetching documents.
3.  Pasting them into the prompt.
4.  Calling OpenAI.

### 🗄️ The Memory: ChromaDB
Chroma is a **Vector** database.
*   **Where does it live?**: In this MVP, it lives in the RAM of the Docker container (backend). It is ephemeral.
*   **Function**: It allows searches by "meaning" rather than "keywords".
    *   *Classic search*: If you search for "Car", it searches for the word "Car".
    *   *Vector search*: If you search for "Car", it finds "Automobile", "Vehicle", "Ferrari", because they are mathematically close in the latent space.

### 🎤 Audio Processing: OpenAI Whisper API
*   **Component**: New `/transcribe` endpoint in FastAPI backend
*   **Function**: Converts audio recordings to text using Whisper API
*   **Integration**: Frontend AudioRecorder component sends recorded audio to the backend for transcription

### 🌐 The Body: FastAPI + Docker
*   **FastAPI**: Exposes REST endpoints (`/chat`, `/upload`, `/transcribe`). It is asynchronous and very fast.
*   **Docker**: Packages the entire environment.
    *   The `backend` container has Python installed and all AI libraries including OpenAI integration.
    *   The `frontend` container has Node.js and the optimized Next.js server.
    *   `docker-compose` creates a private virtual network where both containers can communicate with each other, but exposes ports 3000 and 8000 to your host machine.

---

## 4. AI Terminology Glossary

*   **Embeddings**: Numerical representation of text (lists of floats). It is the language machines understand to compare meanings.
*   **Chunks**: Fragments of text. LLMs have a memory limit (context window), so we cannot send them entire books. We send them relevant chunks.
*   **Hallucination**: When an LLM invents information. RAG drastically reduces this by forcing the model to use sources ("Grounding").
*   **Temperature**: An LLM parameter (set to 0 in this project).
    *   `0`: The model is deterministic, boring, and precise. (Ideal for RAG).
    *   `1`: The model is creative and random.
*   **Whisper API**: OpenAI's speech-to-text API, specialized for converting audio to text.

---

## 5. Extension Guide (Future)

To take this project to the next level (Production Level), it should:
1.  **Persistence**: Configure ChromaDB to save data to disk, so that it is not erased when Docker is restarted.
2.  **Chat Memory**: Currently, each question is independent. `ConversationBufferMemory` can be added in LangChain for the bot to remember previous questions.
3.  **Streaming**: Make the text appear letter by letter (like ChatGPT) instead of waiting for the entire response at once.
4.  **Audio Enhancements**: Add server-side audio format conversion for broader compatibility, implement audio preprocessing for better transcription quality.