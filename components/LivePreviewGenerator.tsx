
import React, { useState, useEffect, useRef, useContext } from 'react';
import { LessonPlan, Slide } from '../types';
import { generatePresentationFromTopic, generatePresentationFromText, generateImage, regenerateSlide, generatePresentationFromPlan } from '../services/geminiService';
import Spinner from './Spinner';
import { UserContext } from '../contexts/UserContext';

// Make PptxGenJS library available in the component scope
declare var PptxGenJS: any;

interface LivePreviewGeneratorProps {
    topic: string;
    grade: string;
    slideCount?: number;
    lang: 'ar' | 'en';
    initialTheme: 'default' | 'midnight' | 'mint' | 'pastel' | 'modernist' | 'ocean' | 'sunset' | 'navy' | 'lavender' | 'nature' | 'candy' | 'cyber' | 'vintage';
    textToSummarize?: string;
    lessonPlan?: LessonPlan;
    onClose: () => void;
    onEdit?: (slides: Slide[]) => void;
}

// --- Icons ---
const Icons = {
    Add: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" /></svg>,
    Delete: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>,
    Regenerate: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 110 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" /></svg>,
    Download: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>,
    Close: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
    AddImage: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" /></svg>,
    Upload: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>,
    YouTube: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>,
    DragHandle: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 5h10v10H5V5z" /><path d="M7 7h2v2H7V7zm4 0h2v2h-2V7zM7 11h2v2H7v-2zm4 0h2v2h-2v-2z" /></svg>,
    AddBullet: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" /><path d="M3 10a1 1 0 011-1h.01a1 1 0 110 2H4a1 1 0 01-1-1zM3 5a1 1 0 011-1h.01a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h.01a1 1 0 110 2H4a1 1 0 01-1-1z" /></svg>,
    PicturePlaceholder: () => <svg className="w-16 h-16 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
    Edit: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>,
};

// --- Themes ---
type Theme = {
    name: { ar: string, en: string };
    bg: string;
    titleColor: string;
    textColor: string;
    cardBg: string; // Background for the individual card
    pptx: { bg: string; title: string; text: string; accent: string; }
};
const themes: { [key:string]: Theme } = {
    default: { 
        name: { ar: 'افتراضي', en: 'Default' }, bg: 'bg-gray-100', titleColor: 'text-gray-800', textColor: 'text-gray-700', cardBg: 'bg-white',
        pptx: { bg: 'FFFFFF', title: '1F293B', text: '374151', accent: '4F46E5' }
    },
    midnight: { 
        name: { ar: 'ليلي', en: 'Midnight' }, bg: 'bg-gray-900', titleColor: 'text-white', textColor: 'text-gray-300', cardBg: 'bg-gray-800',
        pptx: { bg: '1F2937', title: 'FFFFFF', text: 'D1D5DB', accent: '7DD3FC' }
    },
    mint: { 
        name: { ar: 'نعناعي', en: 'Mint' }, bg: 'bg-green-50', titleColor: 'text-green-900', textColor: 'text-green-800', cardBg: 'bg-white',
        pptx: { bg: 'F0FDF4', title: '14532D', text: '166534', accent: '059669' }
    },
    pastel: {
        name: { ar: 'باستيل', en: 'Pastel' }, bg: 'bg-rose-50', titleColor: 'text-rose-900', textColor: 'text-gray-700', cardBg: 'bg-white',
        pptx: { bg: 'FFF1F2', title: '881337', text: '374151', accent: 'F43F5E' }
    },
    modernist: {
        name: { ar: 'عصري', en: 'Modernist' }, bg: 'bg-slate-100', titleColor: 'text-slate-900', textColor: 'text-slate-600', cardBg: 'bg-white',
        pptx: { bg: 'F1F5F9', title: '0F172A', text: '475569', accent: '0EA5E9' }
    },
    ocean: { 
        name: { ar: 'محيط', en: 'Ocean' }, bg: 'bg-cyan-50', titleColor: 'text-cyan-900', textColor: 'text-cyan-800', cardBg: 'bg-white',
        pptx: { bg: 'ECFEFF', title: '164E63', text: '155E75', accent: '06B6D4' }
    },
    sunset: { 
        name: { ar: 'غروب', en: 'Sunset' }, bg: 'bg-orange-50', titleColor: 'text-orange-900', textColor: 'text-gray-800', cardBg: 'bg-white',
        pptx: { bg: 'FFF7ED', title: '7C2D12', text: '1F2937', accent: 'F97316' }
    },
    navy: { 
        name: { ar: 'بحري داكن', en: 'Navy' }, bg: 'bg-slate-900', titleColor: 'text-amber-400', textColor: 'text-slate-200', cardBg: 'bg-slate-800',
        pptx: { bg: '0F172A', title: 'FBBF24', text: 'E2E8F0', accent: '38BDF8' }
    },
    lavender: { 
        name: { ar: 'خزامى', en: 'Lavender' }, bg: 'bg-purple-50', titleColor: 'text-purple-900', textColor: 'text-purple-800', cardBg: 'bg-white',
        pptx: { bg: 'FAF5FF', title: '581C87', text: '6B21A8', accent: 'A855F7' }
    },
    nature: {
        name: { ar: 'طبيعة', en: 'Nature' },
        bg: 'bg-stone-100', titleColor: 'text-emerald-800', textColor: 'text-stone-700', cardBg: 'bg-white',
        pptx: { bg: 'F5F5F4', title: '065F46', text: '44403C', accent: '10B981' }
    },
    candy: {
        name: { ar: 'حلوى', en: 'Candy' },
        bg: 'bg-pink-50', titleColor: 'text-pink-600', textColor: 'text-purple-700', cardBg: 'bg-white',
        pptx: { bg: 'FDF2F8', title: 'DB2777', text: '7E22CE', accent: 'F59E0B' }
    },
    cyber: {
        name: { ar: 'سايبر', en: 'Cyber' },
        bg: 'bg-zinc-950', titleColor: 'text-green-400', textColor: 'text-zinc-300', cardBg: 'bg-zinc-900',
        pptx: { bg: '09090B', title: '4ADE80', text: 'D4D4D8', accent: '22C55E' }
    },
    vintage: {
        name: { ar: 'عتيق', en: 'Vintage' },
        bg: 'bg-amber-50', titleColor: 'text-stone-800', textColor: 'text-stone-600', cardBg: 'bg-white',
        pptx: { bg: 'FFFBEB', title: '292524', text: '57534E', accent: 'D97706' }
    }
};

const LivePreviewGenerator: React.FC<LivePreviewGeneratorProps> = ({
    topic, grade, slideCount, lang, initialTheme, textToSummarize, lessonPlan, onClose, onEdit,
}) => {
    const { user, incrementUsage, showPricing } = useContext(UserContext);
    const isAr = lang === 'ar';
    const [slides, setSlides] = useState<Slide[]>([]);
    const [statusMessage, setStatusMessage] = useState(isAr ? 'جاري التحضير...' : 'Preparing...');
    const [progress, setProgress] = useState({ current: 0, total: 100 });
    const [isComplete, setIsComplete] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // --- Editing State ---
    const [activeTheme, setActiveTheme] = useState<keyof typeof themes>(initialTheme);
    const [isDownloading, setIsDownloading] = useState(false);
    const [regeneratingSlide, setRegeneratingSlide] = useState<number | null>(null);
    const [imageModalState, setImageModalState] = useState<{ isOpen: boolean; slideIndex: number | null; prompt: string; aspectRatio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';}>({ isOpen: false, slideIndex: null, prompt: '', aspectRatio: '16:9' });
    const [youtubeModalState, setYoutubeModalState] = useState<{isOpen: boolean; slideIndex: number | null; url: string; error: string | null;}>({ isOpen: false, slideIndex: null, url: '', error: null });
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const uploadInputRef = useRef<HTMLInputElement>(null);
    const [uploadTargetIndex, setUploadTargetIndex] = useState<number | null>(null);
    
    const canDownload = user?.subscription ? user.subscription.downloadsUsed < user.subscription.plan.presentationDownloadLimit : false;


    useEffect(() => {
        const generateFullPresentation = async () => {
            try {
                // Stage 1: Generate all text content and image prompts
                setStatusMessage(isAr ? 'جاري إنشاء محتوى الشرائح...' : 'Generating slide content...');
                setProgress({ current: 10, total: 100 });
                
                let slidesWithPrompts: Slide[];
                if (lessonPlan) {
                    slidesWithPrompts = await generatePresentationFromPlan(lessonPlan, lang);
                } else if (textToSummarize) {
                    slidesWithPrompts = await generatePresentationFromText(textToSummarize, topic, grade, lang, slideCount!);
                } else {
                    slidesWithPrompts = await generatePresentationFromTopic(topic, grade, lang, slideCount!);
                }
                
                setSlides(slidesWithPrompts.map(s => ({ ...s, isImageLoading: !!s.imagePrompt })));

                const imagesToGenerate = slidesWithPrompts.filter(s => s.imagePrompt).length;
                const totalSteps = 1 + imagesToGenerate; // 1 for content, rest for images
                let completedSteps = 1;
                setProgress({ current: (completedSteps / totalSteps) * 100, total: 100 });
                setStatusMessage(isAr ? `جاري إنشاء الصور (0 / ${imagesToGenerate})...` : `Generating images (0 / ${imagesToGenerate})...`);

                // Stage 2: Generate all images SEQUENTIALLY to avoid rate limits
                if (imagesToGenerate > 0) {
                    for (let i = 0; i < slidesWithPrompts.length; i++) {
                        const slide = slidesWithPrompts[i];
                        if (slide.imagePrompt) {
                            try {
                                // Add a small delay between requests to be safe and respect rate limits
                                if (i > 0) await new Promise(resolve => setTimeout(resolve, 1000));

                                const imageUrl = await generateImage(slide.imagePrompt, '16:9');
                                setSlides(currentSlides => currentSlides.map((s, idx) => 
                                    idx === i ? { ...s, imageUrl, isImageLoading: false } : s
                                ));
                            } catch (imgErr) {
                                console.error(`Failed to generate image for slide ${i}:`, imgErr);
                                setSlides(currentSlides => currentSlides.map((s, idx) => 
                                    idx === i ? { ...s, isImageLoading: false } : s
                                ));
                            } finally {
                                completedSteps++;
                                setProgress({ current: (completedSteps / totalSteps) * 100, total: 100 });
                                setStatusMessage(isAr ? `جاري إنشاء الصور (${completedSteps - 1} / ${imagesToGenerate})...` : `Generating images (${completedSteps - 1} / ${imagesToGenerate})...`);
                            }
                        }
                    }
                }

                setIsComplete(true);
                setStatusMessage(isAr ? 'اكتمل الإنشاء! العرض جاهز للتعديل.' : 'Generation complete! Ready for editing.');
                setProgress({ current: 100, total: 100 });

            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : (isAr ? 'حدث خطأ غير معروف.' : 'An unknown error occurred.');
                setError(errorMessage);
                setIsComplete(true); // Stop progress
                setStatusMessage(isAr ? 'فشل الإنشاء' : 'Generation Failed');
            }
        };

        generateFullPresentation();
    }, [topic, grade, slideCount, lang, textToSummarize, lessonPlan, isAr]);
    
    // --- Handlers ---
    const handleTitleChange = (index: number, newTitle: string) => setSlides(currentSlides => currentSlides.map((s, idx) => idx === index ? { ...s, title: newTitle } : s));
    const handleContentChange = (slideIndex: number, contentIndex: number, newValue: string) => setSlides(prev => prev.map((s, i) => i === slideIndex ? { ...s, content: s.content.map((c, ci) => ci === contentIndex ? newValue : c) } : s));
    const handleAddBullet = (slideIndex: number) => setSlides(prev => prev.map((s, i) => i === slideIndex ? { ...s, content: [...s.content, ''] } : s));
    const handleAddSlide = (index: number) => setSlides(prev => { const newSlides = [...prev]; newSlides.splice(index, 0, { title: isAr ? 'شريحة جديدة' : 'New Slide', content: [''], speakerNotes: '', imagePrompt: '' }); return newSlides; });
    const handleDeleteSlide = (index: number) => setSlides(prev => prev.filter((_, i) => i !== index));
    const openImageModal = (index: number) => setImageModalState({ isOpen: true, slideIndex: index, prompt: slides[index].imagePrompt || `${slides[index].title}. ${slides[index].content.join('. ')}`, aspectRatio: '16:9' });
    const closeImageModal = () => setImageModalState(prev => ({ ...prev, isOpen: false }));
    const handleGenerateImage = async () => {
        if (imageModalState.slideIndex === null) return;
        const index = imageModalState.slideIndex;
        setSlides(prev => prev.map((s, i) => i === index ? { ...s, isImageLoading: true, imageUrl: undefined, youtubeVideoId: undefined } : s));
        closeImageModal();
        try {
            const imageUrl = await generateImage(imageModalState.prompt, imageModalState.aspectRatio);
            setSlides(prev => prev.map((s, i) => i === index ? { ...s, imageUrl, isImageLoading: false } : s));
        } catch (error) {
            console.error("Image generation failed:", error);
            setSlides(prev => prev.map((s, i) => i === index ? { ...s, isImageLoading: false } : s));
        }
    };
    const handleUploadClick = (index: number) => { setUploadTargetIndex(index); uploadInputRef.current?.click(); };
    
    const processImageFile = (file: File, targetIndex: number) => {
        if (!file.type.startsWith('image/')) {
            alert(isAr ? 'يرجى اختيار ملف صورة صالح (JPG, PNG).' : 'Please select a valid image file (JPG, PNG).');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                const MAX_WIDTH = 1600;
                const MAX_HEIGHT = 1600;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                
                if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height);
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
                    
                    setSlides(prev => prev.map((s, i) => 
                        i === targetIndex ? { ...s, imageUrl: dataUrl, youtubeVideoId: undefined } : s
                    ));
                }
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && uploadTargetIndex !== null) {
            processImageFile(file, uploadTargetIndex);
        }
        e.target.value = ''; // Reset for next upload
    };

    const removeMedia = (index: number) => setSlides(prev => prev.map((slide, i) => { if (i === index) { const { imageUrl, youtubeVideoId, ...rest } = slide; return rest; } return slide; }));
    
    // Robust YouTube ID extraction
    const extractYouTubeId = (url: string): string | null => {
        if (!url) return null;
        const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/;
        const match = url.match(regex);
        return match ? match[1] : null;
    };
    
    const openYouTubeModal = (index: number) => setYoutubeModalState({ isOpen: true, slideIndex: index, url: '', error: null });
    const closeYouTubeModal = () => setYoutubeModalState({ isOpen: false, slideIndex: null, url: '', error: null });
    const handleImportVideo = () => {
        const { slideIndex, url } = youtubeModalState;
        if (slideIndex === null) return;
        const videoId = extractYouTubeId(url);
        if (videoId) {
            setSlides(prev => prev.map((s, i) => i === slideIndex ? { ...s, youtubeVideoId: videoId, imageUrl: undefined, isImageLoading: false } : s));
            closeYouTubeModal();
        } else {
            setYoutubeModalState(prev => ({ ...prev, error: isAr ? 'رابط يوتيوب غير صالح.' : 'Invalid YouTube URL.' }));
        }
    };
    const handleRegenerateSlide = async (index: number) => {
        setRegeneratingSlide(index);
        try {
            const newSlideContent = await regenerateSlide(slides[index], { topic, grade, language: lang });
            setSlides(prev => prev.map((s, i) => (i === index ? { ...s, ...newSlideContent, imageUrl: s.imageUrl, isImageLoading: s.isImageLoading } : s)));
        } catch (error) { console.error("Failed to regenerate slide:", error); } 
        finally { setRegeneratingSlide(null); }
    };
    const handleDownload = async () => {
        if (!canDownload) {
            showPricing();
            return;
        }
        setIsDownloading(true);
        const pptx = new PptxGenJS();
        const theme = themes[activeTheme];
        for (const slide of slides) {
            const pptxSlide = pptx.addSlide();
            pptxSlide.background = { color: theme.pptx.bg };
            pptxSlide.addText(slide.title, { x: 0.5, y: 0.5, w: '90%', h: 1, align: isAr ? 'right' : 'left', fontSize: 32, bold: true, color: theme.pptx.title, rtlMode: isAr });
            const hasMedia = slide.imageUrl || slide.youtubeVideoId;
            pptxSlide.addText(slide.content.join('\n'), { x: 0.5, y: hasMedia ? 1.8 : 1.5, w: hasMedia ? '45%' : '90%', h: 3, align: isAr ? 'right' : 'left', fontSize: 18, color: theme.pptx.text, rtlMode: isAr, bullet: { type: 'bullet', color: theme.pptx.accent } });
            if (slide.imageUrl) {
                pptxSlide.addImage({ data: slide.imageUrl, x: '50%', y: 1.8, w: '45%', h: 3, sizing: { type: 'contain', w: 4.5, h: 3 } });
            } else if (slide.youtubeVideoId) {
                pptxSlide.addImage({ path: `https://img.youtube.com/vi/${slide.youtubeVideoId}/0.jpg`, x: '50%', y: 1.8, w: '45%', h: 3, sizing: { type: 'contain', w: 4.5, h: 3 }, hyperlink: { url: `https://www.youtube.com/watch?v=${slide.youtubeVideoId}`, tooltip: isAr ? 'انقر للمشاهدة' : 'Click to watch' } });
            }
            if (slide.speakerNotes) { pptxSlide.addNotes(slide.speakerNotes); }
            
            // Add watermark
            pptxSlide.addText("Powered by Smart Lesson", {
                x: 0, y: '92%', w: '100%', h: 0.5,
                align: 'center', fontSize: 10, color: '888888'
            });
        }
        await pptx.writeFile({ fileName: `${topic}.pptx` });
        incrementUsage('downloads');
        setIsDownloading(false);
    };
    const handleDragStart = (index: number) => { if (isComplete) setDraggedIndex(index); };
    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;
        const newSlides = [...slides];
        const [draggedItem] = newSlides.splice(draggedIndex, 1);
        newSlides.splice(index, 0, draggedItem);
        setDraggedIndex(index);
        setSlides(newSlides);
    };
    
    const handleDrop = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        // Only process files if we are not dragging a slide (draggedIndex is null)
        if (draggedIndex === null && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
             e.stopPropagation();
             processImageFile(e.dataTransfer.files[0], index);
        } else {
            handleDragEnd();
        }
    };

    const handleDragEnd = () => setDraggedIndex(null);

    const currentTheme = themes[activeTheme];

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-80 z-50 flex flex-col items-center p-4 sm:p-8 overflow-y-auto" onClick={onClose} role="dialog" aria-modal="true">
            <input type="file" ref={uploadInputRef} onChange={handleFileSelected} className="hidden" accept="image/*" />
            <div className="w-full max-w-7xl flex-grow flex flex-col" onClick={(e) => e.stopPropagation()} dir={isAr ? 'rtl' : 'ltr'}>
                <header className={`sticky top-0 z-20 p-3 rounded-t-lg shadow-md flex items-center justify-between ${currentTheme.cardBg} border-b border-gray-200/50`}>
                    <div className="flex-1">
                        <div className="flex items-center gap-3">
                            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${isComplete && !error ? 'bg-green-100 text-green-800' : (error ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800')}`}>
                                {!isComplete && <Spinner className="text-current h-4 w-4" />}
                                <span>{statusMessage}</span>
                            </div>
                            {!isComplete && (
                                <div className="w-48 bg-gray-200 rounded-full h-2">
                                    <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progress.current}%` }}></div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {isComplete && (
                            <>
                                <div className="flex items-center gap-2">
                                    <span className={`text-sm font-medium ${currentTheme.textColor}`}>{isAr ? 'التصميم:' : 'Theme:'}</span>
                                    {Object.entries(themes).map(([key, theme]) => (
                                        <button key={key} onClick={() => setActiveTheme(key as any)} className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${activeTheme === key ? 'border-blue-500 ring-2 ring-blue-500/50' : `border-gray-400/50`} ${theme.bg}`} title={theme.name[lang]} />
                                    ))}
                                </div>
                                {onEdit && (
                                    <button onClick={() => onEdit(slides)} className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2">
                                        <Icons.Edit />
                                        <span>{isAr ? 'فتح المحرر / عرض' : 'Open Editor / Present'}</span>
                                    </button>
                                )}
                            </>
                        )}
                        <button onClick={handleDownload} disabled={isDownloading || !isComplete || !canDownload} className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"><Icons.Download /><span>{!canDownload ? (isAr ? 'ترقية' : 'Upgrade') : (isAr ? 'تنزيل' : 'Download')}</span></button>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-800 bg-gray-200/50 rounded-full p-2" aria-label={isAr ? 'إغلاق' : 'Close'}><Icons.Close /></button>
                    </div>
                </header>
                
                <main className={`flex-grow p-6 overflow-y-auto rounded-b-lg ${currentTheme.bg}`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {slides.map((slide, index) => (
                            <div 
                                key={index} 
                                draggable={isComplete} 
                                onDragStart={() => handleDragStart(index)} 
                                onDragOver={(e) => handleDragOver(e, index)} 
                                onDrop={(e) => handleDrop(e, index)}
                                onDragEnd={handleDragEnd} 
                                className={`rounded-lg shadow-lg overflow-hidden relative group transition-all duration-300 ${currentTheme.cardBg} ${isComplete ? 'cursor-grab' : ''} ${draggedIndex === index ? 'opacity-30 scale-95' : ''}`}
                            >
                                {isComplete && <div className="absolute top-2 right-2 z-20 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => handleDeleteSlide(index)} className="bg-red-500 text-white rounded-full p-1.5 shadow-md" title={isAr ? 'حذف' : 'Delete'}><Icons.Delete/></button><button onClick={() => handleAddSlide(index + 1)} className="bg-blue-500 text-white rounded-full p-1.5 shadow-md" title={isAr ? 'إضافة' : 'Add'}><Icons.Add/></button><button className="bg-gray-500 text-white rounded-full p-1.5 cursor-grab shadow-md" title={isAr ? 'سحب' : 'Drag'}><Icons.DragHandle/></button></div>}
                                {isComplete && <div className="absolute top-2 left-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => handleRegenerateSlide(index)} className="bg-purple-500 text-white rounded-full p-1.5 shadow-md" title={isAr ? 'إعادة إنشاء' : 'Regenerate'}><Icons.Regenerate/></button></div>}
                                <div className="p-4">
                                    <input type="text" value={slide.title} onChange={(e) => handleTitleChange(index, e.target.value)} className={`text-lg font-bold w-full bg-transparent border-none focus:ring-2 focus:ring-indigo-300 rounded-md p-1 ${currentTheme.titleColor}`} disabled={!isComplete} />
                                    <div className={`mt-2 space-y-1 text-sm ${currentTheme.textColor} relative`}>
                                        {slide.content.map((item, i) => (<div key={i} className="flex items-start gap-2"><span className="pt-1">•</span><textarea value={item} onChange={(e) => handleContentChange(index, i, e.target.value)} rows={1} className="flex-1 bg-transparent border-none focus:ring-2 focus:ring-indigo-300 rounded-md p-1 resize-none w-full" style={{overflow: 'hidden'}} onInput={(e) => { const target = e.target as HTMLTextAreaElement; target.style.height = 'auto'; target.style.height = `${target.scrollHeight}px`; }} disabled={!isComplete} /></div>))}
                                        {isComplete && <button onClick={() => handleAddBullet(index)} className={`absolute -bottom-2 ${isAr ? 'right-4' : 'left-4'} opacity-0 group-hover:opacity-100 transition-opacity bg-gray-200 text-gray-600 rounded-full p-1`} title={isAr ? 'إضافة نقطة' : 'Add bullet'}><Icons.AddBullet/></button>}
                                    </div>
                                </div>
                                
                                <div className="aspect-w-16 aspect-h-9 bg-gray-200 flex items-center justify-center relative overflow-hidden">
                                    {slide.imageUrl ? (
                                        <>
                                            <img src={slide.imageUrl} alt={slide.title} className="w-full h-full object-cover transition-transform group-hover:scale-105"/>
                                            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openImageModal(index)} className="bg-black bg-opacity-50 text-white rounded-full p-1.5" title={isAr ? 'استبدال' : 'Replace'}><Icons.Regenerate/></button>
                                                {/* Allow swapping to YouTube directly */}
                                                <button onClick={() => openYouTubeModal(index)} className="bg-black bg-opacity-50 text-white rounded-full p-1.5" title={isAr ? 'استبدال بفيديو' : 'Replace with Video'}><Icons.YouTube/></button>
                                                <button onClick={() => removeMedia(index)} className="bg-black bg-opacity-50 text-white rounded-full p-1.5" title={isAr ? 'إزالة' : 'Remove'}><Icons.Delete/></button>
                                            </div>
                                        </>
                                    ) : slide.youtubeVideoId ? (
                                        <>
                                            <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${slide.youtubeVideoId}`} title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                                            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openImageModal(index)} className="bg-black bg-opacity-50 text-white rounded-full p-1.5" title={isAr ? 'استبدال بصورة' : 'Replace with Image'}><Icons.AddImage/></button>
                                                <button onClick={() => removeMedia(index)} className="bg-black bg-opacity-50 text-white rounded-full p-1.5" title={isAr ? 'إزالة الفيديو' : 'Remove Video'}><Icons.Delete/></button>
                                            </div>
                                        </>
                                    ) : slide.isImageLoading ? (
                                        <div className="animate-pulse bg-gray-300 w-full h-full flex flex-col items-center justify-center"><Spinner className="text-gray-500" /></div>
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center space-y-2 bg-gray-50">
                                            <Icons.PicturePlaceholder />
                                            {isComplete && (
                                                <div className="flex gap-2">
                                                    <button onClick={() => openImageModal(index)} className="text-xs bg-indigo-100 text-indigo-700 font-semibold py-1 px-2 rounded-md hover:bg-indigo-200 transition">{isAr ? 'صورة AI' : 'AI Image'}</button>
                                                    <button onClick={() => handleUploadClick(index)} className="text-xs bg-gray-200 text-gray-700 font-semibold py-1 px-2 rounded-md hover:bg-gray-300 transition">{isAr ? 'رفع' : 'Upload'}</button>
                                                    <button onClick={() => openYouTubeModal(index)} className="text-xs bg-red-100 text-red-700 font-semibold py-1 px-2 rounded-md hover:bg-red-200 transition">YouTube</button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {regeneratingSlide === index && <div className="absolute inset-0 bg-black/70 flex items-center justify-center"><Spinner className="text-white h-8 w-8" /></div>}
                            </div>
                        ))}
                         {isComplete && <button onClick={() => handleAddSlide(slides.length)} className={`rounded-lg shadow-lg flex items-center justify-center border-2 border-dashed hover:border-blue-500 transition ${currentTheme.cardBg} min-h-[250px] hover:bg-gray-50`}><div className="text-center text-gray-500"><svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg><p className="mt-2 font-semibold">{isAr ? 'إضافة شريحة جديدة' : 'Add New Slide'}</p></div></button>}
                    </div>
                </main>
            </div>
            {imageModalState.isOpen && <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-[70] flex items-center justify-center" onClick={closeImageModal}><div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg m-4" onClick={(e) => e.stopPropagation()} dir={isAr ? 'rtl' : 'ltr'}><h3 className="text-xl font-bold mb-4">{isAr ? 'توليد صورة' : 'Generate Image'}</h3><div className="space-y-4"><div><label htmlFor="prompt" className="block text-sm font-medium text-gray-700">{isAr ? 'الوصف' : 'Prompt'}</label><textarea id="prompt" rows={4} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" value={imageModalState.prompt} onChange={(e) => setImageModalState(prev => ({ ...prev, prompt: e.target.value }))} /></div><div><label htmlFor="aspectRatio" className="block text-sm font-medium text-gray-700">{isAr ? 'الأبعاد' : 'Aspect Ratio'}</label><select id="aspectRatio" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" value={imageModalState.aspectRatio} onChange={(e) => setImageModalState(prev => ({ ...prev, aspectRatio: e.target.value as '16:9' }))}><option value="16:9">Landscape (16:9)</option><option value="9:16">Portrait (9:16)</option><option value="1:1">Square (1:1)</option><option value="4:3">Standard (4:3)</option><option value="3:4">Tall (3:4)</option></select></div></div><div className={`mt-6 flex ${isAr ? 'justify-start space-x-reverse' : 'justify-end'} space-x-3`}><button onClick={closeImageModal} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300">{isAr ? 'إلغاء' : 'Cancel'}</button><button onClick={handleGenerateImage} className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700">{isAr ? 'توليد' : 'Generate'}</button></div></div></div>}
            {youtubeModalState.isOpen && <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-[70] flex items-center justify-center" onClick={closeYouTubeModal}><div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg m-4" onClick={(e) => e.stopPropagation()} dir={isAr ? 'rtl' : 'ltr'}><h3 className="text-xl font-bold mb-4">{isAr ? 'فيديو يوتيوب' : 'YouTube Video'}</h3><div className="space-y-2"><div><label htmlFor="youtube_url" className="block text-sm font-medium text-gray-700">{isAr ? 'رابط الفيديو' : 'Video URL'}</label><input type="url" id="youtube_url" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" value={youtubeModalState.url} onChange={(e) => setYoutubeModalState(prev => ({ ...prev, url: e.target.value, error: null }))} placeholder="https://www.youtube.com/watch?v=..." /></div>{youtubeModalState.error && <p className="text-red-600 text-sm">{youtubeModalState.error}</p>}</div><div className={`mt-6 flex ${isAr ? 'justify-start space-x-reverse' : 'justify-end'} space-x-3`}><button onClick={closeYouTubeModal} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300">{isAr ? 'إلغاء' : 'Cancel'}</button><button onClick={handleImportVideo} className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700">{isAr ? 'استيراد' : 'Import'}</button></div></div></div>}
        </div>
    );
};

export default LivePreviewGenerator;
