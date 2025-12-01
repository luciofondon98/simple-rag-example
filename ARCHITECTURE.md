# 🏗️ Arquitectura del Sistema RAG (Deep Dive)

Este documento explica en detalle el funcionamiento interno, el flujo de datos y las decisiones de diseño del proyecto **Simple RAG Modern**. Está diseñado para entender no solo *cómo* se usa el código, sino *qué* ocurre "bajo el capó" en un sistema de Inteligencia Artificial Generativa.

---

## 1. Visión General: El Concepto RAG

**RAG (Retrieval-Augmented Generation)** es una técnica que optimiza la salida de un Modelo de Lenguaje (LLM) como GPT-4, permitiéndole consultar una base de conocimientos externa antes de responder.

### La Analogía del Examen
Imagina un examen:
*   **ChatGPT estándar** es un estudiante haciendo un examen de memoria. Si no estudió el tema, alucinará (inventará).
*   **RAG** es ese mismo estudiante, pero con un **libro de texto abierto** (tus PDFs) en el escritorio. Cuando le haces una pregunta, primero busca la respuesta en el libro y luego la redacta.

---

## 2. Diagrama de Flujo de Datos

Cuando un usuario hace una pregunta, ocurre el siguiente proceso secuencial:

```mermaid
Usuario -> [Frontend Next.js] -> [Backend FastAPI] -> [OpenAI Embeddings] -> [ChromaDB] -> [LangChain] -> [GPT-4] -> Usuario
```

### Fase A: Ingesta (Cuando subes un PDF)

1.  **Carga (`Loader`)**: El sistema lee el archivo binario PDF y extrae el texto plano.
2.  **Fragmentación (`Splitting`)**: El texto se divide en bloques pequeños (*chunks*) de 1000 caracteres con un solapamiento (*overlap*) de 200 caracteres.
    *   *¿Por qué?* Para preservar el contexto semántico. Si una frase importante se corta a la mitad, el solapamiento asegura que el siguiente bloque la tenga completa.
3.  **Vectorización (`Embedding`)**: Cada bloque de texto se envía a OpenAI, que devuelve un **Vector** (una lista de 1536 números).
    *   *Concepto Clave*: Este vector representa el **significado** del texto. Textos con significados similares tendrán vectores matemáticamente cercanos.
4.  **Indexado**: Se guardan en **ChromaDB** los pares: `{ Vector, Texto Original }`.

### Fase B: Consulta (Cuando chateas)

1.  **Input**: El usuario pregunta: *"¿Quién es el protagonista?"*.
2.  **Embedding de la Pregunta**: La pregunta se convierte también en un vector numérico.
3.  **Búsqueda Semántica (Retrieval)**:
    *   ChromaDB compara el vector de la pregunta con los millones de vectores de los documentos.
    *   Utiliza **Similitud Coseno** para encontrar los "vecinos más cercanos".
    *   Recupera los 3 fragmentos de texto más relevantes.
4.  **Prompt Engineering (Augmentation)**:
    *   El Backend construye un mensaje invisible para el usuario. Inserta los 3 fragmentos recuperados dentro de una instrucción para el LLM.
    *   *Estructura del Prompt*: "Usa ESTA información [Fragmento 1, 2, 3] para responder a ESTA pregunta [Input Usuario]".
5.  **Generación**: El LLM (GPT-4o-mini) lee los fragmentos y genera una respuesta en lenguaje natural basada **estrictamente** en la evidencia proporcionada.

---

## 3. Componentes Técnicos Detallados

### 🧠 El Cerebro: LangChain
LangChain actúa como el orquestador. Es el framework que conecta las piezas. En este proyecto, utiliza `create_retrieval_chain` para automatizar el flujo de:
1.  Ir a la base de datos.
2.  Traer documentos.
3.  Pegarlos en el prompt.
4.  Llamar a OpenAI.

### 🗄️ La Memoria: ChromaDB
Chroma es una base de datos **Vectorial**.
*   **¿Dónde vive?**: En este MVP, vive en la memoria RAM del contenedor Docker (backend). Es efímera.
*   **Función**: Permite búsquedas por "significado" y no por "palabras clave".
    *   *Búsqueda clásica*: Si buscas "Coche", busca la palabra "Coche".
    *   *Búsqueda vectorial*: Si buscas "Coche", encuentra "Automóvil", "Vehículo", "Ferrari", porque matemáticamente están cerca en el espacio latente.

### 🌐 El Cuerpo: FastAPI + Docker
*   **FastAPI**: Expone los endpoints REST (`/chat`, `/upload`). Es asíncrono y muy rápido.
*   **Docker**: Empaqueta todo el entorno.
    *   El contenedor `backend` tiene Python instalado y todas las librerías de IA.
    *   El contenedor `frontend` tiene Node.js y el servidor de Next.js optimizado.
    *   `docker-compose` crea una red virtual privada donde ambos contenedores pueden hablarse entre sí, pero expone los puertos 3000 y 8000 a tu máquina host.

---

## 4. Glosario de Términos IA

*   **Embeddings**: Representación numérica de texto (listas de flotantes). Es el idioma que entienden las máquinas para comparar significados.
*   **Chunks**: Fragmentos de texto. Los LLMs tienen un límite de memoria (ventana de contexto), por lo que no podemos enviarles libros enteros. Les enviamos chunks relevantes.
*   **Alucinación**: Cuando un LLM inventa información. RAG reduce esto drásticamente al obligar al modelo a usar fuentes ("Grounding").
*   **Temperature**: Un parámetro del LLM (configurado a 0 en este proyecto).
    *   `0`: El modelo es determinista, aburrido y preciso. (Ideal para RAG).
    *   `1`: El modelo es creativo y aleatorio.

---

## 5. Guía de Extensión (Futuro)

Para llevar este proyecto al siguiente nivel (Nivel Producción), se debería:
1.  **Persistencia**: Configurar ChromaDB para guardar datos en disco, de modo que no se borren al reiniciar Docker.
2.  **Memoria de Chat**: Actualmente cada pregunta es independiente. Se puede añadir `ConversationBufferMemory` en LangChain para que el bot recuerde preguntas anteriores.
3.  **Streaming**: Hacer que el texto aparezca letra por letra (como ChatGPT) en lugar de esperar toda la respuesta de golpe.
