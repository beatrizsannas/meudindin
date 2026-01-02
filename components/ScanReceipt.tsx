import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleGenAI, Type } from "@google/genai";

const ScanReceipt: React.FC = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Use rear camera
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Não foi possível acessar a câmera. Verifique as permissões.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setIsStreaming(false);
    }
  };

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsProcessing(true);

    // Draw video frame to canvas
    const context = canvasRef.current.getContext('2d');
    if (context) {
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      
      // Get Base64 image
      const imageData = canvasRef.current.toDataURL('image/jpeg', 0.8);
      const base64Data = imageData.split(',')[1];

      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        // Define expected schema
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview', // Using gemini-3-flash-preview for multimodal task with JSON output
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: base64Data
                }
              },
              {
                text: 'Analise este recibo/nota fiscal. Extraia o valor total, a data (formato YYYY-MM-DD), o nome do estabelecimento e sugira uma categoria (ex: fuel, food, market, pharmacy, transport, other).'
              }
            ]
          },
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                totalAmount: { type: Type.NUMBER },
                date: { type: Type.STRING },
                merchantName: { type: Type.STRING },
                category: { type: Type.STRING }
              }
            }
          }
        });

        // The text property contains the JSON string
        const result = JSON.parse(response.text || '{}');

        // Stop camera before navigating
        stopCamera();

        // Navigate to register page with data
        navigate('/register', { 
          state: { 
            scannedData: {
              amount: result.totalAmount,
              date: result.date,
              description: result.merchantName,
              category: result.category
            }
          } 
        });

      } catch (err) {
        console.error("AI Error:", err);
        setError("Não foi possível ler a nota. Tente novamente.");
        setIsProcessing(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header overlay */}
      <div className="absolute top-0 left-0 right-0 p-4 z-10 flex justify-between items-center bg-gradient-to-b from-black/70 to-transparent">
        <button onClick={() => navigate(-1)} className="text-white p-2 rounded-full bg-black/20 backdrop-blur-md">
          <span className="material-symbols-outlined">close</span>
        </button>
        <h2 className="text-white font-bold text-lg">Escanear Despesa</h2>
        <div className="w-10"></div>
      </div>

      {/* Camera View */}
      <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
        {error ? (
          <div className="text-white text-center p-6">
            <span className="material-symbols-outlined text-4xl mb-2 text-red-500">error</span>
            <p>{error}</p>
            <button onClick={() => window.location.reload()} className="mt-4 bg-white text-black px-4 py-2 rounded-full font-bold">Tentar Novamente</button>
          </div>
        ) : (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover"
          />
        )}
        
        {/* Scanner Overlay Guide */}
        {!error && !isProcessing && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-64 h-80 border-2 border-primary/50 rounded-3xl relative">
              <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-xl"></div>
              <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-xl"></div>
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-xl"></div>
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-xl"></div>
              
              {/* Scan Line Animation */}
              <div className="absolute left-2 right-2 h-0.5 bg-primary/80 shadow-[0_0_10px_rgba(13,242,108,0.8)] animate-[scan_2s_ease-in-out_infinite]"></div>
            </div>
            <p className="absolute bottom-24 text-white/80 text-sm font-medium bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">
              Aponte para o comprovante
            </p>
          </div>
        )}

        {/* Loading Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-20">
            <div className="size-16 border-4 border-white/20 border-t-primary rounded-full animate-spin mb-4"></div>
            <p className="text-white font-bold text-lg animate-pulse">Lendo informações...</p>
            <p className="text-white/60 text-sm mt-1">Isso leva apenas um segundo</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-[#111814] pb-8 pt-6 px-6 flex items-center justify-around">
        <button className="p-4 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors">
          <span className="material-symbols-outlined text-2xl">flash_on</span>
        </button>
        
        <button 
          onClick={captureAndAnalyze}
          disabled={isProcessing || !!error}
          className="size-20 rounded-full border-4 border-white p-1 flex items-center justify-center group active:scale-95 transition-transform"
        >
          <div className="w-full h-full bg-white rounded-full group-hover:scale-90 transition-transform duration-200"></div>
        </button>

        <button className="p-4 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors">
          <span className="material-symbols-outlined text-2xl">image</span>
        </button>
      </div>

      <canvas ref={canvasRef} className="hidden" />
      
      <style>{`
        @keyframes scan {
          0% { top: 10%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 90%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default ScanReceipt;