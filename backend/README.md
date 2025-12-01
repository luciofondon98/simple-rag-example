# 🐍 Simple RAG - Backend (FastAPI)

REST API for document processing and RAG system management.

> **Note:** For a quick start of the entire system, it is recommended to use Docker from the root folder. Read the [main README](../README.md).

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
