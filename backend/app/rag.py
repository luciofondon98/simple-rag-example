import os
import shutil
import tempfile
import base64
from typing import List
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_chroma import Chroma
from langchain.tools import tool
# Importaciones corregidas para LangChain v1
from langchain_classic.chains import create_history_aware_retriever
from langchain_classic.chains import create_retrieval_chain
from langchain_classic.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage
from dotenv import load_dotenv
from langchain_community.tools import DuckDuckGoSearchResults
from langchain_core.tools import Tool

load_dotenv()

class RAGService:
    def __init__(self):
        self.vector_store = None
        # Usamos text-embedding-3-small que es más moderno y eficiente
        self.embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
        self.llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
        # Initialize the search tool
        self.search_tool = DuckDuckGoSearchResults(max_results=3)
        # Also create a simple search tool that can be used with the agent
        self.search_function = Tool(
            name="internet_search",
            description="Search for information on the internet when the provided context is insufficient. Use this for current events, general knowledge, or when documents don't contain the needed information.",
            func=self.search_tool.run
        )

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

    def get_answer_with_internet(self, question: str, chat_history: List[tuple] = [], force_internet_search: bool = False):
        """
        Recibe una pregunta y el historial, devuelve la respuesta usando RAG con memoria
        y búsqueda en internet si es necesario o forzada.
        """
        # Convertir historial de tuplas a objetos Message de LangChain
        lc_history = []
        for role, content in chat_history:
            if role == "user":
                lc_history.append(HumanMessage(content=content))
            elif role == "assistant":
                lc_history.append(AIMessage(content=content))

        # First, try to answer from the vector store if documents are available
        if self.vector_store and not force_internet_search:
            # Get relevant documents from the vector store
            retriever = self.vector_store.as_retriever(search_kwargs={"k": 3})
            relevant_docs = retriever.get_relevant_documents(question)

            # Check if we have sufficient context from documents
            context_str = "\n".join([doc.page_content for doc in relevant_docs])

            # Check if we need internet search by evaluating the context
            check_prompt = ChatPromptTemplate.from_messages([
                ("system", "Decide si la pregunta '{question}' puede responderse con la información proporcionada: '{context}'. "
                           "Responde con 'SI' si la información es suficiente, o 'NO' si se necesita más información de internet."),
                MessagesPlaceholder("chat_history"),
                ("human", "¿Necesito buscar en internet para responder esta pregunta?")
            ])

            check_chain = check_prompt | self.llm
            check_response = check_chain.invoke({
                "question": question,
                "context": context_str,
                "chat_history": lc_history
            })

            # If the user wants to force internet search or the context seems insufficient, we'll do a web search
            if force_internet_search or "no" in check_response.content.lower() or len(context_str.strip()) < 50:
                # Let the user know we're searching the internet
                search_message = "Buscando en la web para complementar la información...\n\n"

                # Perform internet search
                search_results = self.search_tool.run(question)

                # Combine document context with search results
                enhanced_system_prompt = (
                    "Eres un asistente experto. "
                    "Usa la información de los documentos: '{context}' y los resultados de búsqueda en internet: '{search_results}' "
                    "para responder la pregunta del usuario de manera completa y precisa. "
                    "Cita las fuentes cuando sea posible. "
                    "Usa formato Markdown para estructurar tu respuesta (listas, negritas, etc)."
                )

                enhanced_prompt = ChatPromptTemplate.from_messages([
                    ("system", enhanced_system_prompt),
                    MessagesPlaceholder("chat_history"),
                    ("human", "{input}"),
                ])

                enhanced_chain = enhanced_prompt | self.llm

                response = enhanced_chain.invoke({
                    "context": context_str,
                    "search_results": search_results,
                    "input": question,
                    "chat_history": lc_history
                })

                return search_message + response.content
            else:
                # Use just the document-based RAG system
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

                history_aware_retriever = create_history_aware_retriever(
                    self.llm, retriever, contextualize_q_prompt
                )

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

                question_answer_chain = create_stuff_documents_chain(self.llm, qa_prompt)
                rag_chain = create_retrieval_chain(history_aware_retriever, question_answer_chain)

                response = rag_chain.invoke({
                    "input": question,
                    "chat_history": lc_history
                })

                return response["answer"]
        else:
            # If no vector store is available or internet search is forced, use internet search
            # Let the user know we're searching the internet
            search_message = "Buscando en la web para responder tu pregunta...\n\n"

            search_results = self.search_tool.run(question)
            # Create a simple prompt that asks the LLM to answer based on search results
            system_prompt = (
                "Eres un asistente experto que responde preguntas basado en resultados de búsqueda en internet. "
                "Usa los siguientes resultados de búsqueda para responder la pregunta del usuario "
                "de manera clara, concisa y precisa. Cita las fuentes cuando sea posible. "
                "Si no puedes responder con la información disponible, di que no lo sabes. "
                "Usa formato Markdown para estructurar tu respuesta (listas, negritas, etc).\n\n"
                "Resultados de la búsqueda: {search_results}"
            )
            prompt = ChatPromptTemplate.from_messages([
                ("system", system_prompt),
                MessagesPlaceholder("chat_history"),
                ("human", "{input}"),
            ])

            chain = prompt | self.llm

            response = chain.invoke({
                "search_results": search_results,
                "input": question,
                "chat_history": lc_history
            })

            return search_message + response.content

    def get_answer(self, question: str, chat_history: List[tuple] = []):
        """
        Recibe una pregunta y el historial, devuelve la respuesta usando RAG con memoria.
        Si no hay documentos, responde con el LLM general.
        """
        if self.vector_store:
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
                "Si no sabes la respuesta o la información es limitada, puedes usar búsqueda en internet "
                "para complementar la información. Para esto, debes usar el tool de búsqueda en internet. "
                "Si no sabes la respuesta ni con la búsqueda en internet, di que no lo sabes. "
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
        else:
            # Handle general queries when no documents are available
            # Convertir historial de tuplas a objetos Message de LangChain
            lc_history = []
            for role, content in chat_history:
                if role == "user":
                    lc_history.append(HumanMessage(content=content))
                elif role == "assistant":
                    lc_history.append(AIMessage(content=content))

            # Create a simpler prompt for general conversation
            system_prompt = ChatPromptTemplate.from_messages([
                ("system", "Eres un asistente experto y útil. Responde preguntas de forma clara y precisa. Usa formato Markdown para estructurar tu respuesta (listas, negritas, etc)."),
                MessagesPlaceholder("chat_history"),
                ("human", "{input}"),
            ])

            # Create the chain
            chain = system_prompt | self.llm

            # Execute
            response = chain.invoke({
                "input": question,
                "chat_history": lc_history
            })

            return response.content

    def analyze_image(self, image_content: bytes, image_filename: str) -> str:
        """
        Analiza una imagen usando un modelo de visión de OpenAI.
        """
        from langchain_core.messages import HumanMessage
        import base64

        # Encode the image to base64
        encoded_image = base64.b64encode(image_content).decode('utf-8')

        # Determine the image format from the filename
        if image_filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp')):
            # Extract the format from the file extension
            format_ext = image_filename.split('.')[-1].lower()
            if format_ext == 'jpg':
                format_ext = 'jpeg'  # OpenAI uses 'jpeg' for jpg files
        else:
            # Default to jpeg if format is unknown
            format_ext = 'jpeg'

        # Create a HumanMessage with content that includes both text and image
        message = HumanMessage(
            content=[
                {
                    "type": "text",
                    "text": "Describe esta imagen detalladamente. Si hay texto en la imagen, extráelo y preséntalo claramente. Si hay objetos, personas, gráficos o cualquier elemento visual importante, descríbelos."
                },
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/{format_ext};base64,{encoded_image}"
                    }
                }
            ]
        )

        # Call the LLM with the message
        response = self.llm.invoke([message])

        return response.content


# Instancia global
rag_service = RAGService()