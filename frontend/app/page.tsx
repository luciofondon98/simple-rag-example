"use client";

import { useState, FormEvent, useEffect, useRef } from 'react';
import { Send, Upload, Loader2, Bot, User } from 'lucide-react';
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
    { role: 'assistant', content: '¡Hola! Sube tus PDFs y pregúntame lo que quieras.' }
  ]);
  const [input, setInput] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [useInternetSearch, setUseInternetSearch] = useState(false);

  const API_URL = 'http://localhost:8000';

  // Manejar subida de archivos
  const handleUpload = async (e: FormEvent) => {
    e.preventDefault();
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadStatus('Subiendo y procesando...');

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
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
        setUploadStatus('❌ Error al subir archivos.');
      }
    } catch (error) {
      console.error(error);
      setUploadStatus('❌ Error de conexión.');
    } finally {
      setUploading(false);
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
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userMessage,
          history: history
        }),
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

  return (
    <div className="flex h-screen bg-gray-100 font-sans text-gray-900">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 p-6 flex flex-col shadow-sm">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-bold">N</div>
          <h1 className="text-xl font-bold text-gray-800">RAG Next.js</h1>
        </div>

        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">Documentos</h2>
          <form onSubmit={handleUpload} className="flex flex-col gap-3">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors group">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 text-gray-400 mb-2 group-hover:text-black transition-colors" />
                <p className="text-sm text-gray-500 text-center px-2">
                  {files ? `${files.length} archivo(s)` : "Subir PDFs"}
                </p>
              </div>
              <input 
                type="file" 
                className="hidden" 
                multiple 
                accept=".pdf"
                onChange={(e) => setFiles(e.target.files)} 
              />
            </label>
            
            <button 
              type="submit" 
              disabled={!files || uploading}
              className="w-full py-2 px-4 bg-black text-white rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors font-medium"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Procesar"}
            </button>
          </form>
          {uploadStatus && (
            <p className="mt-3 text-xs text-gray-600 bg-gray-100 p-2 rounded border border-gray-200">
              {uploadStatus}
            </p>
          )}
        </div>

        <div className="mt-auto">
          <p className="text-xs text-gray-400 text-center">
            Powered by Next.js 14 <br/> & FastAPI
          </p>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-50/50">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth" ref={chatContainerRef}>
          {messages.map((msg, idx) => (
            <div 
              key={idx} 
              className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-gray-200' : 'bg-black'}`}>
                {msg.role === 'user' ? <User className="w-5 h-5 text-gray-700" /> : <Bot className="w-5 h-5 text-white" />}
              </div>
              
              <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-white text-gray-800 rounded-tr-none border border-gray-100' 
                  : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
              }`}>
                {msg.role === 'assistant' ? (
                  <div className="prose prose-sm max-w-none text-gray-800 prose-p:leading-relaxed prose-pre:bg-gray-100 prose-pre:p-2 prose-pre:rounded-lg">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="leading-relaxed text-sm">{msg.content}</p>
                )}
              </div>
            </div>
          ))}
          {processing && (
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {useInternetSearch ? "Buscando en la web..." : "Procesando..."}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-200">
          <form onSubmit={(e) => handleSend(e, useInternetSearch)} className="max-w-4xl mx-auto relative flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Pregunta a tus documentos..."
                className="flex-1 p-3 pr-24 bg-gray-100 border-transparent focus:border-black focus:bg-white focus:ring-0 rounded-xl transition-all outline-none text-gray-700 placeholder-gray-400"
              />
              <div className="absolute right-20 flex items-center">
                <AudioRecorder
                  onTranscription={(transcription) => {
                    setInput(transcription);
                    // Optionally submit automatically after transcription
                    // handleSend({ preventDefault: () => {} } as FormEvent);
                  }}
                  disabled={processing}
                />
              </div>
              <button
                type="submit"
                disabled={!input.trim() || processing}
                className="absolute right-2 p-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useInternetSearch}
                  onChange={(e) => setUseInternetSearch(e.target.checked)}
                  className="w-3 h-3 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-gray-600">Buscar en internet</span>
              </label>
              <span className="text-gray-400">|</span>
              <span className="text-gray-500 italic">
                {useInternetSearch
                  ? "Usando internet para información actualizada"
                  : "Usando documentos subidos"}
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
