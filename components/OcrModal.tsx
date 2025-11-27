
import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import Spinner from './Spinner';
import { extractTextFromImage } from '../services/geminiService';

interface OcrModalProps {
    file: File;
    lang: 'ar' | 'en';
    onClose: () => void;
    onExtract: (text: string) => void;
}

const OcrModal: React.FC<OcrModalProps> = ({ file, lang, onClose, onExtract }) => {
    const isAr = lang === 'ar';
    const [status, setStatus] = useState(isAr ? 'جارٍ بدء المعالجة...' : 'Initializing...');
    const [progress, setProgress] = useState(0);
    const [extractedText, setExtractedText] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const isProcessing = extractedText === null && !error;

    useEffect(() => {
        // Initialize PDF worker
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://aistudiocdn.com/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs`;

        const processFile = async () => {
            try {
                if (file.type.startsWith('image/')) {
                    await processImage(file);
                } else if (file.type === 'application/pdf') {
                    await processPdf(file);
                } else {
                    throw new Error(isAr ? 'نوع ملف غير مدعوم.' : 'Unsupported file type.');
                }
            } catch (err) {
                console.error('OCR Error:', err);
                setError(err instanceof Error ? err.message : (isAr ? 'فشل استخلاص النص.' : 'Text extraction failed.'));
            }
        };
        
        processFile();

        // Clean up preview URL
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [file, isAr]);

    // Convert a File to Base64 string (without prefix)
    const fileToBase64 = (blob: Blob): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result as string;
                const base64 = result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = error => reject(error);
            reader.readAsDataURL(blob);
        });
    };

    const processImage = async (imageFile: File) => {
        setPreviewUrl(URL.createObjectURL(imageFile));
        setStatus(isAr ? 'جاري المعالجة بالذكاء الاصطناعي...' : 'Processing with AI...');
        setProgress(10);

        try {
            const base64 = await fileToBase64(imageFile);
            setProgress(30);
            setStatus(isAr ? 'جاري استخلاص النص العربي والإنجليزي...' : 'Extracting Arabic and English text...');
            
            const text = await extractTextFromImage(base64, imageFile.type);
            
            setExtractedText(text);
            setStatus(isAr ? 'اكتمل الاستخلاص! يرجى المراجعة.' : 'Extraction complete! Please review.');
            setProgress(100);
        } catch (err) {
             throw err;
        }
    };

    const processPdf = async (pdfFile: File) => {
        const pdfData = await pdfFile.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument(pdfData);
        const pdf = await loadingTask.promise;
        const numPages = pdf.numPages;

        // Create a preview of the first page
        const firstPage = await pdf.getPage(1);
        const viewport = firstPage.getViewport({ scale: 1.5 });
        const previewCanvas = document.createElement('canvas');
        const previewCtx = previewCanvas.getContext('2d');
        previewCanvas.height = viewport.height;
        previewCanvas.width = viewport.width;
        if (previewCtx) {
            await firstPage.render({ canvas: previewCanvas, canvasContext: previewCtx, viewport }).promise;
            setPreviewUrl(previewCanvas.toDataURL());
        }

        let fullText = '';
        
        for (let i = 1; i <= numPages; i++) {
            setStatus(isAr ? `جاري معالجة الصفحة ${i} من ${numPages} باستخدام AI...` : `AI Processing page ${i} of ${numPages}...`);
            const page = await pdf.getPage(i);
            const pageViewport = page.getViewport({ scale: 2.0 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = pageViewport.height;
            canvas.width = pageViewport.width;

            if (context) {
                await page.render({ canvas: canvas, canvasContext: context, viewport: pageViewport }).promise;
                
                // Convert canvas to base64 image
                const base64Image = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
                
                // Send to Gemini
                const pageText = await extractTextFromImage(base64Image, 'image/jpeg');
                fullText += pageText + '\n\n';
            }
            setProgress(Math.round((i / numPages) * 100));
        }

        setExtractedText(fullText.trim());
        setStatus(isAr ? 'اكتمل الاستخلاص! يرجى المراجعة.' : 'Extraction complete! Please review.');
    };

    const handleConfirm = () => {
        if (extractedText) {
            onExtract(extractedText);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 z-50 flex items-center justify-center p-4" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="ocr-modal-title">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <header className="p-4 border-b flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <h2 id="ocr-modal-title" className="text-xl font-bold text-gray-800">
                            {isAr ? 'استخلاص النص (AI)' : 'AI Text Extraction'}
                        </h2>
                         <span className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-100 text-indigo-700">Gemini Powered</span>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800" aria-label={isAr ? 'إغلاق' : 'Close'}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </header>

                <main className="flex-1 p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto">
                    {/* Preview Pane */}
                    <div className="bg-gray-100 rounded-md p-4 flex flex-col items-center justify-center border">
                        <h3 className="text-lg font-semibold text-gray-700 mb-2 self-start">{isAr ? 'معاينة الملف' : 'File Preview'}</h3>
                        <div className="w-full h-full flex items-center justify-center overflow-auto">
                             {previewUrl ? (
                                <img src={previewUrl} alt="File preview" className="max-w-full max-h-full object-contain shadow-md" />
                            ) : (
                                <div className="text-gray-500">{isAr ? 'جاري تحميل المعاينة...' : 'Loading preview...'}</div>
                            )}
                        </div>
                    </div>

                    {/* Status & Result Pane */}
                    <div className="flex flex-col">
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">{isAr ? 'النتائج' : 'Results'}</h3>
                        {isProcessing && (
                            <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 rounded-md p-4 border" aria-live="polite">
                                <Spinner className="text-indigo-600 h-10 w-10" />
                                <p className="text-gray-800 mt-4 font-medium text-center animate-pulse">{status}</p>
                                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
                                    <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}></div>
                                </div>
                                <p className="text-xs text-gray-500 mt-2 text-center">
                                    {isAr ? 'يدعم العربية والإنجليزية والكتابة اليدوية' : 'Supports Arabic, English & Handwriting'}
                                </p>
                            </div>
                        )}
                        {error && (
                             <div className="flex-1 flex flex-col items-center justify-center bg-red-50 text-red-700 rounded-md p-4 border border-red-200">
                                <p className="font-bold">{isAr ? 'حدث خطأ' : 'An Error Occurred'}</p>
                                <p className="text-sm mt-2 text-center">{error}</p>
                            </div>
                        )}
                        {extractedText !== null && (
                            <div className="flex-1 flex flex-col">
                                 <p className="text-sm text-green-700 bg-green-50 p-2 rounded-md mb-2">{status}</p>
                                <textarea
                                    value={extractedText}
                                    onChange={(e) => setExtractedText(e.target.value)}
                                    className="flex-1 w-full p-3 border border-gray-300 rounded-md bg-white resize-none focus:ring-2 focus:ring-indigo-500"
                                    aria-label={isAr ? 'النص المستخلص' : 'Extracted text'}
                                />
                            </div>
                        )}
                    </div>
                </main>
                
                <footer className="p-4 border-t flex justify-end items-center space-x-3 space-x-reverse">
                    <button onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-5 rounded-lg hover:bg-gray-300 transition">
                        {isProcessing ? (isAr ? 'إلغاء' : 'Cancel') : (isAr ? 'إغلاق' : 'Close')}
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={extractedText === null}
                        className="bg-indigo-600 text-white font-bold py-2 px-5 rounded-lg hover:bg-indigo-700 transition disabled:bg-indigo-300 disabled:cursor-not-allowed"
                    >
                        {isAr ? 'إضافة النص إلى الخطة' : 'Add Text to Plan'}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default OcrModal;
