
import React, { useState, useRef } from 'react';
import { analyzeImage } from '../services/geminiService';
import Spinner from './Spinner';

interface ImageAnalyzerProps {
    lang: 'ar' | 'en';
}

const ImageAnalyzer: React.FC<ImageAnalyzerProps> = ({ lang }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const isAr = lang === 'ar';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    
    setLoading(true);
    setError(null);
    try {
      const defaultPrompt = isAr ? "صف هذه الصورة بالتفصيل." : "Describe this image in detail.";
      const userPrompt = prompt.trim() || defaultPrompt;
      const langInstruction = isAr ? "\n\nProvide the response in Arabic." : "\n\nProvide the response in English.";
      
      const response = await analyzeImage(selectedFile, userPrompt + langInstruction);
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : (isAr ? "فشل تحليل الصورة" : "Failed to analyze image"));
    } finally {
      setLoading(false);
    }
  };

  const triggerFileInput = () => {
      fileInputRef.current?.click();
  };

  const clearSelection = () => {
      setSelectedFile(null);
      setPreviewUrl(null);
      setResult(null);
      setPrompt('');
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <section className="my-8 p-6 bg-white rounded-2xl shadow-lg border border-gray-200 transition-all hover:shadow-xl" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="flex flex-col md:flex-row items-start gap-8">
          
          {/* Left Side: Upload & Preview */}
          <div className="w-full md:w-1/3 space-y-4">
               <div className="text-center md:text-left mb-4">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 justify-center md:justify-start">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {isAr ? 'محلل الصور بالذكاء الاصطناعي' : 'AI Image Analyzer'}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">{isAr ? 'ارفع صورة لتحليل النص، الكائنات، أو ترجمة المحتوى.' : 'Upload an image to analyze text, objects, or translate content.'}</p>
               </div>

               <div 
                className={`relative border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center min-h-[250px] transition-colors ${previewUrl ? 'border-indigo-300 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'}`}
               >
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        accept="image/*" 
                        className="hidden" 
                    />
                    
                    {previewUrl ? (
                        <div className="relative w-full h-full flex items-center justify-center">
                            <img src={previewUrl} alt="Preview" className="max-h-64 rounded-lg shadow-sm object-contain" />
                            <button onClick={clearSelection} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    ) : (
                        <div className="text-center p-4 cursor-pointer" onClick={triggerFileInput}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-sm font-medium text-gray-600">{isAr ? 'انقر لرفع صورة' : 'Click to upload image'}</p>
                            <p className="text-xs text-gray-400 mt-1">{isAr ? 'يدعم JPG, PNG' : 'JPG, PNG supported'}</p>
                        </div>
                    )}
               </div>
          </div>

          {/* Right Side: Controls & Result */}
          <div className="w-full md:w-2/3 flex flex-col h-full min-h-[300px]">
               <div className="space-y-4">
                    <div>
                        <label htmlFor="img-prompt" className="block text-sm font-semibold text-gray-700 mb-1">{isAr ? 'تعليمات التحليل' : 'Analysis Prompt'}</label>
                        <div className="relative">
                             <textarea
                                id="img-prompt"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder={isAr ? "مثال: صف الصورة، استخرج النص، أو حدد العناصر..." : "E.g., Describe the image in detail, extract text, or identify objects..."}
                                rows={3}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none transition"
                             />
                        </div>
                    </div>
                    
                    <div className={`flex ${isAr ? 'justify-end' : 'justify-end'}`}>
                        <button
                            onClick={handleAnalyze}
                            disabled={!selectedFile || loading}
                            className="flex items-center gap-2 bg-indigo-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-indigo-700 transition shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                            {loading ? <Spinner className="w-5 h-5" /> : (
                                <>
                                    <span>{isAr ? 'تحليل بالذكاء الاصطناعي' : 'Analyze with AI'}</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isAr ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </div>
               </div>

               <div className="mt-6 flex-grow">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">{isAr ? 'النتيجة' : 'Result'}</label>
                    <div className={`w-full h-full min-h-[200px] p-4 rounded-lg border ${result ? 'bg-gray-50 border-gray-200' : 'bg-gray-100 border-transparent flex items-center justify-center'}`}>
                        {error ? (
                            <div className="text-red-500 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                {error}
                            </div>
                        ) : result ? (
                            <p className="whitespace-pre-wrap text-gray-800 leading-relaxed">{result}</p>
                        ) : (
                            <p className="text-gray-400 text-sm italic text-center">{isAr ? 'نتائج التحليل ستظهر هنا...' : 'Analysis results will appear here...'}</p>
                        )}
                    </div>
               </div>
          </div>
      </div>
    </section>
  );
};

export default ImageAnalyzer;
