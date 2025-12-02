"use client";

import { useState, FormEvent, useEffect, useRef } from 'react';
import { Send, Upload, Loader2, Bot, User, Plus, Trash2, Image as ImageIcon, FileText, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import AudioRecorder from '../components/AudioRecorder';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatResponse {
  answer: string;
}

interface UploadResponse {
  message: string;
}

export default function Home() {
  // Estados
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: '¡Hola! Sube tus PDFs o imágenes y pregúntame lo que quieras.' }
  ]);
  const [input, setInput] = useState('');
  const [pdfFiles, setPdfFiles] = useState<FileList | null>(null);
  const [imageFiles, setImageFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [useInternetSearch, setUseInternetSearch] = useState(false);
  const [forceInternetSearch, setForceInternetSearch] = useState(false); // Always search internet when enabled
  const [isDragActive, setIsDragActive] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const API_URL = 'http://localhost:8000';

  // Manejar subida de archivos PDF
  const handlePdfUpload = async (e: FormEvent) => {
    e.preventDefault();
    if (!pdfFiles || pdfFiles.length === 0) return;

    setUploading(true);
    setUploadStatus('Subiendo y procesando PDFs...');

    const formData = new FormData();
    for (let i = 0; i < pdfFiles.length; i++) {
      formData.append('files', pdfFiles[i]);
    }

    try {
      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data: UploadResponse = await response.json();
        setUploadStatus('✅ ' + data.message);
      } else {
        setUploadStatus('❌ Error al subir archivos PDF.');
      }
    } catch (error) {
      console.error(error);
      setUploadStatus('❌ Error de conexión.');
    } finally {
      setUploading(false);
    }
  };

  // Drag and drop handlers for images
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      // Check if dragged items are files
      const items = Array.from(e.dataTransfer.items);
      const hasImage = items.some(item => item.kind === 'file' && item.type.startsWith('image/'));
      if (hasImage) {
        setIsDragActive(true);
      }
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // Filter only image files
      const imageFilesArray = Array.from(e.dataTransfer.files).filter(file =>
        file.type.startsWith('image/')
      );

      if (imageFilesArray.length > 0) {
        // Create a fake FileList from the dropped files
        const dataTransfer = new DataTransfer();
        imageFilesArray.forEach(file => dataTransfer.items.add(file));
        const imageFileList = dataTransfer.files;

        // Analyze the dropped images
        setImageFiles(imageFileList);
        handleImageAnalysisForFiles(imageFileList);
      }
    }
  };

  // Handle image analysis for files passed directly (for drag and drop)
  const handleImageAnalysisForFiles = async (files: FileList) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadStatus('Analizando imágenes...');

    // Process each image one by one
    for (let i = 0; i < files.length; i++) {
      const imageFile = files[i];

      const formData = new FormData();
      formData.append('file', imageFile);

      try {
        const response = await fetch(`${API_URL}/analyze_image`, {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();

          // Add the image to the chat with its analysis
          const imageUrl = URL.createObjectURL(imageFile);

          // First add the image
          setMessages(prev => [...prev, {
            role: 'user',
            content: `![Imagen subida](${imageUrl})`
          }]);

          // Then add the analysis
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: data.analysis
          }]);

          setUploadStatus(`✅ Imagen ${i + 1}/${files.length} analizada correctamente.`);
        } else {
          setUploadStatus(`❌ Error al analizar la imagen ${i + 1}.`);
          break;
        }
      } catch (error) {
        console.error(error);
        setUploadStatus('❌ Error de conexión al analizar imágenes.');
        break;
      } finally {
        if (i === files.length - 1) {
          setUploading(false);
        }
      }
    }
  };

  // Manejar análisis de imágenes
  const handleImageAnalysis = async (e: FormEvent) => {
    e.preventDefault();
    if (!imageFiles || imageFiles.length === 0) return;

    setUploading(true);
    setUploadStatus('Analizando imágenes...');

    // Process each image one by one
    for (let i = 0; i < imageFiles.length; i++) {
      const imageFile = imageFiles[i];

      const formData = new FormData();
      formData.append('file', imageFile);

      try {
        const response = await fetch(`${API_URL}/analyze_image`, {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();

          // Add the image to the chat with its analysis
          const imageUrl = URL.createObjectURL(imageFile);

          // First add the image
          setMessages(prev => [...prev, {
            role: 'user',
            content: `![Imagen subida](${imageUrl})`
          }]);

          // Then add the analysis
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: data.analysis
          }]);

          setUploadStatus(`✅ Imagen ${i + 1}/${imageFiles.length} analizada correctamente.`);
        } else {
          setUploadStatus(`❌ Error al analizar la imagen ${i + 1}.`);
          break;
        }
      } catch (error) {
        console.error(error);
        setUploadStatus('❌ Error de conexión al analizar imágenes.');
        break;
      } finally {
        if (i === imageFiles.length - 1) {
          setUploading(false);
        }
      }
    }
  };

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  // Use effect to scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, processing]);

  // Enviar mensaje al chat
  const handleSend = async (e: FormEvent, useInternetSearch = false) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setProcessing(true);

    // Preparar historial (últimos 6 mensajes para contexto)
    const history = messages.slice(-6).map(m => [m.role, m.content]);

    try {
      // Decide which endpoint to use based on the useInternetSearch flag
      const endpoint = useInternetSearch ? '/chat_with_internet' : '/chat';
      const requestBody: any = {
        question: userMessage,
        history: history
      };

      // Include forceInternetSearch only when using internet search
      if (useInternetSearch) {
        requestBody.force_internet_search = forceInternetSearch;
      }

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data: ChatResponse = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error al conectar con el servidor.' }]);
    } finally {
      setProcessing(false);
    }
  };

  // Start a new chat
  const startNewChat = () => {
    setMessages([
      { role: 'assistant', content: '¡Hola! Sube tus PDFs o imágenes y pregúntame lo que quieras.' }
    ]);
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 overflow-hidden">
      {/* Sidebar */}
      <div
        className={`bg-gray-900 text-gray-100 flex flex-col transition-all duration-500 ease-in-out ${
          sidebarOpen ? 'w-64 opacity-100' : 'w-0 opacity-0 overflow-hidden'
        }`}
      >
          <div className="p-4 border-b border-gray-700">
            <button
              onClick={startNewChat}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Nueva conversación</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-2 px-2">Documentos</div>

            <div className="mb-6 p-2">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" /> PDFs
              </h3>
              <form onSubmit={handlePdfUpload} className="flex flex-col gap-3">
                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors group">
                  <div className="flex flex-col items-center justify-center pt-3 pb-2">
                    <Upload className="w-6 h-6 text-gray-400 mb-1 group-hover:text-white transition-colors" />
                    <p className="text-xs text-gray-400 text-center">
                      {pdfFiles ? `${pdfFiles.length} archivo(s)` : "Subir PDFs"}
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    accept=".pdf"
                    onChange={(e) => setPdfFiles(e.target.files)}
                  />
                </label>

                <button
                  type="submit"
                  disabled={!pdfFiles || uploading}
                  className="w-full py-2 px-3 bg-gray-800 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm transition-colors font-medium"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Procesar"}
                </button>
              </form>
            </div>

            <div className="p-2">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" /> Imágenes
              </h3>
              <form onSubmit={handleImageAnalysis} className="flex flex-col gap-3">
                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors group">
                  <div className="flex flex-col items-center justify-center pt-3 pb-2">
                    <Upload className="w-6 h-6 text-gray-400 mb-1 group-hover:text-white transition-colors" />
                    <p className="text-xs text-gray-400 text-center">
                      {imageFiles ? `${imageFiles.length} imagen(es)` : "Subir imágenes"}
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    accept="image/*"
                    onChange={(e) => setImageFiles(e.target.files)}
                  />
                </label>

                <button
                  type="submit"
                  disabled={!imageFiles || uploading}
                  className="w-full py-2 px-3 bg-gray-800 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm transition-colors font-medium"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Analizar"}
                </button>
              </form>
            </div>
          </div>

          <div className="p-3 border-t border-gray-700 text-xs text-gray-400">
            <div className="flex items-center justify-between">
              <span>Chat RAG</span>
              <button
                onClick={toggleSidebar}
                className="p-1 rounded hover:bg-gray-800 transition-all duration-500"
                aria-label={sidebarOpen ? "Cerrar sidebar" : "Abrir sidebar"}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`transform transition-transform duration-500 ${sidebarOpen ? 'rotate-90' : ''}`}
                >
                  <path d="M3 6h18M3 12h18M3 18h18" />
                </svg>
              </button>
            </div>
          </div>
        </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-800 relative transition-all duration-500">
        {/* Toggle sidebar button for mobile */}
        {!sidebarOpen && (
          <div className="p-3 border-b border-gray-700 flex items-center">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-md hover:bg-gray-700 transition-all duration-500 text-gray-200"
              aria-label="Abrir sidebar"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transform transition-transform duration-500"
              >
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
            </button>
          </div>
        )}

        {/* Messages */}
        <div
          className={`flex-1 overflow-y-auto ${isDragActive ? 'bg-blue-900 bg-opacity-20' : ''}`}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          ref={chatContainerRef}
        >
          {messages.length > 1 ? ( // Only show messages if there's more than the initial message
            <div className={`${sidebarOpen ? 'max-w-3xl' : 'max-w-4xl'} mx-auto p-4 space-y-6 pt-12 pb-32`}>
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-blue-500' : 'bg-green-500'}`}>
                    {msg.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
                  </div>

                  <div className={`max-w-[calc(100%-50px)] prose prose-sm prose-p:leading-relaxed prose-pre:bg-gray-700 prose-pre:p-2 prose-pre:rounded-lg prose-pre:text-sm ${msg.role === 'user' ? 'text-gray-100' : 'text-gray-100'}`}>
                    <ReactMarkdown
                      components={{
                        img: ({ src, alt }) => (
                          <div className="my-2">
                            <img
                              src={src}
                              alt={alt}
                              className="max-w-full h-auto rounded-lg border border-gray-600"
                              style={{ objectFit: 'contain' }}
                            />
                            {alt && <p className="text-xs text-gray-400 mt-1">{alt}</p>}
                          </div>
                        ),
                        code: ({ node, ...props }) => (
                          <code className="bg-gray-700 rounded px-1.5 py-0.5 text-sm font-mono text-gray-100" {...props} />
                        ),
                        pre: ({ node, ...props }) => (
                          <pre className="bg-gray-800 text-gray-100 rounded p-3 mt-2 mb-2 overflow-x-auto" {...props} />
                        )
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                </div>
              ))}
              {processing && (
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shrink-0">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                    </div>
                    <span className="ml-2">
                      {useInternetSearch ? "Buscando en la web..." : "Procesando..."}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Welcome screen when no messages yet (except the initial one)
            <div className="flex flex-col items-center justify-center text-center px-4 h-[calc(100vh-140px)]">
              <div className={`${sidebarOpen ? 'max-w-lg' : 'max-w-xl'} mx-auto`}>
                <div className="flex justify-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <Bot className="w-7 h-7 text-white" />
                  </div>
                </div>

                <h1 className="text-3xl font-semibold text-gray-200 mb-4">¿En qué puedo ayudarte hoy?</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto">
                  <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600">
                    <h3 className="font-medium text-gray-200 mb-2">Documentos</h3>
                    <p className="text-sm text-gray-400">Sube tus archivos PDF para que pueda responder preguntas sobre su contenido</p>
                  </div>

                  <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600">
                    <h3 className="font-medium text-gray-200 mb-2">Imágenes</h3>
                    <p className="text-sm text-gray-400">Analiza imágenes con descripciones detalladas</p>
                  </div>

                  <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600">
                    <h3 className="font-medium text-gray-200 mb-2">Audio</h3>
                    <p className="text-sm text-gray-400">Graba mensajes de voz que puedo transcribir</p>
                  </div>

                  <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600">
                    <h3 className="font-medium text-gray-200 mb-2">Búsqueda</h3>
                    <p className="text-sm text-gray-400">Busca en internet cuando necesites información actualizada</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isDragActive && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="bg-blue-500 bg-opacity-20 border-2 border-dashed border-blue-400 rounded-xl w-[calc(100%-40px)] h-[calc(100%-40px)] flex items-center justify-center">
                <div className="text-blue-300 text-xl font-semibold">Suelta la imagen aquí para analizarla</div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-700 bg-gray-800 absolute bottom-0 left-0 right-0">
          <div className={`${sidebarOpen ? 'max-w-3xl' : 'max-w-4xl'} mx-auto px-4 pb-6 pt-4`}> {/* Added pt-4 for top padding to center it better */}
            <form onSubmit={(e) => handleSend(e, useInternetSearch)} className="relative flex flex-col gap-3">
              <div className="flex items-center gap-2 bg-gray-700 border border-gray-600 rounded-xl shadow-sm focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Mensaje..."
                  className="flex-1 py-3 px-4 rounded-xl text-gray-100 placeholder-gray-400 outline-none bg-transparent"
                />
                <div className="flex items-center pr-2 space-x-2">
                  <button
                    type="button"
                    onClick={() => setUseInternetSearch(!useInternetSearch)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                      useInternetSearch
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                    }`}
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Buscar</span>
                  </button>
                  <AudioRecorder
                    onTranscription={(transcription) => {
                      setInput(transcription);
                      // Optionally submit automatically after transcription
                      // handleSend({ preventDefault: () => {} } as FormEvent);
                    }}
                    disabled={processing}
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || processing}
                    className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
