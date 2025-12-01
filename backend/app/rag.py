import os
import shutil
import tempfile
from typing import List
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_chroma import Chroma
# Importaciones corregidas para LangChain v1
from langchain_classic.chains import create_history_aware_retriever
from langchain_classic.chains import create_retrieval_chain
from langchain_classic.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage
from dotenv import load_dotenv

load_dotenv()

class RAGService:
    def __init__(self):
        self.vector_store = None
        # Usamos text-embedding-3-small que es más moderno y eficiente
        self.embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
        self.llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

    def process_pdfs(self, files: List[bytes]):
        """
        Recibe una lista de archivos en bytes, los guarda temporalmente,
        los carga, divide y crea el vector store.
        """
        all_chunks = []
        
        # Creamos un directorio temporal para procesar los archivos
        with tempfile.TemporaryDirectory() as temp_dir:
            for i, file_content in enumerate(files):
                file_path = os.path.join(temp_dir, f"doc_{i}.pdf")
                with open(file_path, "wb") as f:
                    f.write(file_content)
                
                # Cargar
                loader = PyPDFLoader(file_path)
                docs = loader.load()
                
                # Dividir
                text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
                chunks = text_splitter.split_documents(docs)
                all_chunks.extend(chunks)

        # Crear Vector Store en memoria
        if all_chunks:
            self.vector_store = Chroma.from_documents(
                documents=all_chunks, 
                embedding=self.embeddings
            )
            return len(all_chunks)
        return 0

    def get_answer(self, question: str, chat_history: List[tuple] = []):
        """
        Recibe una pregunta y el historial, devuelve la respuesta usando RAG con memoria.
        """
        if not self.vector_store:
            return "Por favor, sube documentos primero para inicializar el conocimiento."

        # 1. Retriever básico
        retriever = self.vector_store.as_retriever(search_kwargs={"k": 3})

        # 2. Prompt de Reformulación (Contextualize Question)
        # Si hay historial, reformula la pregunta para que sea independiente
        contextualize_q_system_prompt = (
            "Dalo un historial de chat y la última pregunta del usuario "
            "que podría hacer referencia al contexto del historial, "
            "formula una pregunta independiente que pueda entenderse "
            "sin el historial. NO respondas a la pregunta, "
            "solo reformúlala si es necesario o devuélvela tal cual."
        )
        
        contextualize_q_prompt = ChatPromptTemplate.from_messages([
            ("system", contextualize_q_system_prompt),
            MessagesPlaceholder("chat_history"),
            ("human", "{input}"),
        ])

        # 3. History Aware Retriever
        history_aware_retriever = create_history_aware_retriever(
            self.llm, retriever, contextualize_q_prompt
        )

        # 4. Prompt de Respuesta Final (QA)
        qa_system_prompt = (
            "Eres un asistente experto. "
            "Usa los siguientes fragmentos de contexto recuperado para responder la pregunta. "
            "Si no sabes la respuesta, di que no lo sabes. "
            "Usa formato Markdown para estructurar tu respuesta (listas, negritas, etc).\n\n"
            "{context}"
        )
        
        qa_prompt = ChatPromptTemplate.from_messages([
            ("system", qa_system_prompt),
            MessagesPlaceholder("chat_history"),
            ("human", "{input}"),
        ])

        # 5. Cadena Final
        question_answer_chain = create_stuff_documents_chain(self.llm, qa_prompt)
        rag_chain = create_retrieval_chain(history_aware_retriever, question_answer_chain)

        # Convertir historial de tuplas a objetos Message de LangChain
        lc_history = []
        for role, content in chat_history:
            if role == "user":
                lc_history.append(HumanMessage(content=content))
            elif role == "assistant":
                lc_history.append(AIMessage(content=content))

        # Ejecutar
        response = rag_chain.invoke({
            "input": question,
            "chat_history": lc_history
        })
        
        return response["answer"]

# Instancia global
rag_service = RAGService()