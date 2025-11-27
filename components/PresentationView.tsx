import React, { useState, useEffect, useRef, useContext } from 'react';
import { Slide } from '../types';
import { generateImage, regenerateSlide, generateInsertedSlide } from '../services/geminiService';
import Spinner from './Spinner';
import { UserContext } from '../contexts/UserContext';


// Make PptxGenJS library available in the component scope
declare var PptxGenJS: any;

interface PresentationViewProps {
  slides: Slide[];
  onClose: () => void;
  lang: 'ar' | 'en';
  context: {
      topic: string;
      grade: string;
  };
}

// --- Themes ---
type Theme = {
    name: { ar: string, en: string };
    // For web view (Tailwind classes)
    bg: string;
    titleColor: string;
    textColor: string;
    notesBg: string;
    notesColor: string;
    // For PPTX export (Hex codes without '#')
    pptx: {
        bg: string;
        title: string;
        text: string;
        accent: string;
    }
};

const themes: { [key:string]: Theme } = {
    default: {
        name: { ar: 'افتراضي', en: 'Default' },
        bg: 'bg-white', titleColor: 'text-gray-800', textColor: 'text-gray-700', notesBg: 'bg-yellow-100', notesColor: 'text-yellow-900',
        pptx: { bg: 'FFFFFF', title: '1F293B', text: '374151', accent: '4F46E5' }
    },
    midnight: {
        name: { ar: 'ليلي', en: 'Midnight' },
        bg: 'bg-gray-800', titleColor: 'text-white', textColor: 'text-gray-300', notesBg: 'bg-gray-700', notesColor: 'text-gray-200',
        pptx: { bg: '1F2937', title: 'FFFFFF', text: 'D1D5DB', accent: '7DD3FC' }
    },
    mint: {
        name: { ar: 'نعناعي', en: 'Mint' },
        bg: 'bg-green-50', titleColor: 'text-green-900', textColor: 'text-green-800', notesBg: 'bg-green-100', notesColor: 'text-green-900',
        pptx: { bg: 'F0FDF4', title: '14532D', text: '166534', accent: '059669' }
    },
    pastel: {
        name: { ar: 'باستيل', en: 'Pastel' },
        bg: 'bg-rose-50', titleColor: 'text-rose-900', textColor: 'text-gray-700', notesBg: 'bg-orange-50', notesColor: 'text-orange-900',
        pptx: { bg: 'FFF1F2', title: '881337', text: '374151', accent: 'F43F5E' }
    },
    modernist: {
        name: { ar: 'عصري', en: 'Modernist' },
        bg: 'bg-slate-100', titleColor: 'text-slate-900', textColor: 'text-slate-600', notesBg: 'bg-white', notesColor: 'text-slate-500',
        pptx: { bg: 'F1F5F9', title: '0F172A', text: '475569', accent: '0EA5E9' }
    },
    ocean: {
        name: { ar: 'محيط', en: 'Ocean' },
        bg: 'bg-cyan-50', titleColor: 'text-cyan-900', textColor: 'text-cyan-800', notesBg: 'bg-cyan-100', notesColor: 'text-cyan-900',
        pptx: { bg: 'ECFEFF', title: '164E63', text: '155E75', accent: '06B6D4' }
    },
    sunset: {
        name: { ar: 'غروب', en: 'Sunset' },
        bg: 'bg-orange-50', titleColor: 'text-orange-900', textColor: 'text-gray-800', notesBg: 'bg-amber-50', notesColor: 'text-amber-900',
        pptx: { bg: 'FFF7ED', title: '7C2D12', text: '1F2937', accent: 'F97316' }
    },
    navy: {
        name: { ar: 'بحري داكن', en: 'Navy' },
        bg: 'bg-slate-900', titleColor: 'text-amber-400', textColor: 'text-slate-200', notesBg: 'bg-slate-800', notesColor: 'text-slate-300',
        pptx: { bg: '0F172A', title: 'FBBF24', text: 'E2E8F0', accent: '38BDF8' }
    },
    lavender: {
        name: { ar: 'خزامى', en: 'Lavender' },
        bg: 'bg-purple-50', titleColor: 'text-purple-900', textColor: 'text-purple-800', notesBg: 'bg-purple-100', notesColor: 'text-purple-900',
        pptx: { bg: 'FAF5FF', title: '581C87', text: '6B21A8', accent: 'A855F7' }
    },
    nature: {
        name: { ar: 'طبيعة', en: 'Nature' },
        bg: 'bg-stone-100', titleColor: 'text-emerald-800', textColor: 'text-stone-700', notesBg: 'bg-emerald-50', notesColor: 'text-emerald-900',
        pptx: { bg: 'F5F5F4', title: '065F46', text: '44403C', accent: '10B981' }
    },
    candy: {
        name: { ar: 'حلوى', en: 'Candy' },
        bg: 'bg-pink-50', titleColor: 'text-pink-600', textColor: 'text-purple-700', notesBg: 'bg-yellow-50', notesColor: 'text-yellow-900',
        pptx: { bg: 'FDF2F8', title: 'DB2777', text: '7E22CE', accent: 'F59E0B' }
    },
    cyber: {
        name: { ar: 'سايبر', en: 'Cyber' },
        bg: 'bg-zinc-950', titleColor: 'text-green-400', textColor: 'text-zinc-300', notesBg: 'bg-zinc-900', notesColor: 'text-zinc-400',
        pptx: { bg: '09090B', title: '4ADE80', text: 'D4D4D8', accent: '22C55E' }
    },
    vintage: {
        name: { ar: 'عتيق', en: 'Vintage' },
        bg: 'bg-amber-50', titleColor: 'text-stone-800', textColor: 'text-stone-600', notesBg: 'bg-amber-100', notesColor: 'text-stone-800',
        pptx: { bg: 'FFFBEB', title: '292524', text: '57534E', accent: 'D97706' }
    }
};

// --- Icons ---
const ToolbarIcons = {
    Text: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>,
    List: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" /></svg>,
    Image: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" /></svg>,
    Magic: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 9a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zm7-4a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1V8a1 1 0 011-1z" clipRule="evenodd" /></svg>,
    Trash: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>,
    Upload: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>,
    Video: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" /></svg>,
    Refresh: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 110 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" /></svg>,
    Board: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 4a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V4z" /><path fillRule="evenodd" d="M2 16v-2a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2z" clipRule="evenodd" /></svg>,
    Pen: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>,
    Eraser: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>,
    Clock: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>,
    Users: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" /></svg>,
    Play: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>,
    Pause: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>,
};


const PresentationView: React.FC<PresentationViewProps> = ({ 
    slides, 
    onClose, 
    lang, 
    context, 
}) => {
  const { user, incrementUsage, showPricing } = useContext(UserContext);
  const isAr = lang === 'ar';
  
  const [currentSlides, setCurrentSlides] = useState<Slide[]>(slides);
  const [activeTheme, setActiveTheme] = useState<keyof typeof themes>('default');
  const [activeAnimation, setActiveAnimation] = useState<'slide' | 'fade' | 'zoom'>('slide');
  const [visibleSlides, setVisibleSlides] = useState<Set<number>>(new Set());
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const titleRefs = useRef<(HTMLInputElement | null)[]>([]); // Refs for title inputs to focus
  
  const [isDownloading, setIsDownloading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [uploadTargetIndex, setUploadTargetIndex] = useState<number | null>(null);
  
  const [selectedSlideIndex, setSelectedSlideIndex] = useState<number | null>(0); // Default select first slide

  // Image Modal State
  const [imageGenStatus, setImageGenStatus] = useState<{[key: number]: {loading: boolean, error: string | null}}>({});
  const [regeneratingSlide, setRegeneratingSlide] = useState<number | null>(null);
  const [insertingSlideIndex, setInsertingSlideIndex] = useState<number | null>(null);

  // Drag & Drop State
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [draggableIndex, setDraggableIndex] = useState<number | null>(null);
  
  // --- View Modes ---
  const [viewMode, setViewMode] = useState<'editor' | 'classroom'>('editor');

  // --- Classroom Mode Tools ---
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState('#ef4444'); // Red default
  const [brushSize, setBrushSize] = useState(4);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [slideAnnotations, setSlideAnnotations] = useState<{[key: number]: string}>({}); // Store base64 data URL per slide

  const [showTimer, setShowTimer] = useState(false);
  const [initialTimerValue, setInitialTimerValue] = useState(300); // Used for smart timer setting
  const [showPicker, setShowPicker] = useState(false);
  const [timeIsUp, setTimeIsUp] = useState(false); // Trigger for "Time's up" notification

  // --- Live Lesson State ---
  const [isLessonRunning, setIsLessonRunning] = useState(false);
  const [lessonTimeRemaining, setLessonTimeRemaining] = useState(0); // Current slide countdown
  const [totalTimeElapsed, setTotalTimeElapsed] = useState(0);

  const canDownload = user?.subscription ? user.subscription.downloadsUsed < user.subscription.plan.presentationDownloadLimit : false;

  // YouTube Modal State
  const [youtubeModalState, setYoutubeModalState] = useState<{
    isOpen: boolean;
    slideIndex: number | null;
    url: string;
    error: string | null;
  }>({
    isOpen: false,
    slideIndex: null,
    url: '',
    error: null,
  });
  
  // --- Audio Helpers ---
  const playNotificationSound = () => {
      // Create a simple "ding" sound using Web Audio API to avoid external file dependencies
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      oscillator.frequency.exponentialRampToValueAtTime(1046.5, audioCtx.currentTime + 0.1); // C6
      
      gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.5);
  };

  const speakNotification = (text: string) => {
      if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = isAr ? 'ar-SA' : 'en-US';
          utterance.rate = 1;
          window.speechSynthesis.speak(utterance);
      }
  };


  // --- Animation Observer ---
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-index'));
            setVisibleSlides((prev) => new Set(prev).add(index));
          }
        });
      },
      {
        root: null, 
        rootMargin: '0px',
        threshold: 0.1, 
      }
    );

    const currentRefs = slideRefs.current;
    currentRefs.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => {
      currentRefs.forEach((ref) => {
        if (ref) observer.unobserve(ref);
      });
    };
  }, [currentSlides]);
  
  // --- Lesson Timer Logic ---
  useEffect(() => {
      let interval: number;
      if (isLessonRunning && viewMode === 'classroom') {
          interval = window.setInterval(() => {
            setTotalTimeElapsed(prev => prev + 1);
            
            if (lessonTimeRemaining > 0) {
                setLessonTimeRemaining(prev => {
                    const next = prev - 1;
                    if (next === 0) {
                        // Time's up for this slide
                        playNotificationSound();
                        const activeSlide = currentSlides[selectedSlideIndex || 0];
                        const msg = isAr 
                            ? `انتهى وقت ${activeSlide.title}` 
                            : `Time is up for ${activeSlide.title}`;
                        speakNotification(msg);
                        setTimeIsUp(true);
                        setIsLessonRunning(false); // Pause lesson when time is up
                        return 0;
                    }
                    return next;
                });
            }
          }, 1000);
      }
      return () => clearInterval(interval);
  }, [isLessonRunning, viewMode, lessonTimeRemaining, selectedSlideIndex, currentSlides, isAr]);

  // Reset slide timer when changing slides if lesson is running
  useEffect(() => {
      if (selectedSlideIndex !== null) {
          const slide = currentSlides[selectedSlideIndex];
          if (slide.duration) {
              setLessonTimeRemaining(slide.duration * 60);
          } else {
              setLessonTimeRemaining(0); // No timer for untimed slides
          }
      }
  }, [selectedSlideIndex, currentSlides]);


  // --- Content Handlers ---
  const handleTitleChange = (index: number, newTitle: string) => {
    setCurrentSlides(prev => prev.map((s, i) => i === index ? { ...s, title: newTitle } : s));
  };

  const handleContentChange = (slideIndex: number, contentIndex: number, newValue: string) => {
    setCurrentSlides(prev => prev.map((s, i) => i === slideIndex ? { ...s, content: s.content.map((c, ci) => ci === contentIndex ? newValue : c) } : s));
  };

  const handleNotesChange = (slideIndex: number, newValue: string) => {
     setCurrentSlides(prev => prev.map((s, i) => i === slideIndex ? { ...s, speakerNotes: newValue } : s));
  };
  
  const handleAddBulletPoint = (slideIndex: number) => {
    setCurrentSlides(prev => prev.map((s, i) => i === slideIndex ? { ...s, content: [...s.content, ''] } : s));
  };

  const handleDeleteBulletPoint = (slideIndex: number, contentIndex: number) => {
    setCurrentSlides(prev => prev.map((s, i) => i === slideIndex ? { ...s, content: s.content.filter((_, ci) => ci !== contentIndex) } : s));
  };

  // --- Slide Management Handlers ---
  const handleAddSlide = (index: number) => {
    const newSlide: Slide = { title: isAr ? 'شريحة جديدة' : 'New Slide', content: ['نقطة جديدة'], speakerNotes: '', imagePrompt: '' };
    const newSlides = [...currentSlides];
    newSlides.splice(index, 0, newSlide);
    setCurrentSlides(newSlides);
    setSelectedSlideIndex(index); 
  };
  
  const handleDeleteSlide = (index: number) => {
    if (window.confirm(isAr ? 'هل أنت متأكد من رغبتك في حذف هذه الشريحة؟' : 'Are you sure you want to delete this slide?')) {
      setCurrentSlides(prev => {
          const newSlides = prev.filter((_, i) => i !== index);
          return newSlides;
      });
      if (selectedSlideIndex === index) setSelectedSlideIndex(null);
    }
  };

  const handleInsertAiSlide = async (index: number) => {
      setInsertingSlideIndex(index);
      try {
        const prevSlide = currentSlides[index - 1] || null;
        const nextSlide = currentSlides[index] || null;
        const newSlide = await generateInsertedSlide(prevSlide, nextSlide, { ...context, language: lang });

        const newSlides = [...currentSlides];
        newSlides.splice(index, 0, newSlide);
        setCurrentSlides(newSlides);
        setSelectedSlideIndex(index);

      } catch (error) {
        console.error("Failed to insert AI slide:", error);
      } finally {
        setInsertingSlideIndex(null);
      }
  };
  
  // --- Drag and Drop Handlers ---
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
    setSelectedSlideIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const newSlides = [...currentSlides];
    const [draggedItem] = newSlides.splice(draggedIndex, 1);
    newSlides.splice(index, 0, draggedItem);
    
    setDraggedIndex(index);
    setCurrentSlides(newSlides);
    setSelectedSlideIndex(index);
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

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDraggableIndex(null);
  };

  // --- Image Handlers ---
  const handleImagePromptChange = (index: number, newPrompt: string) => {
    setCurrentSlides(prev => prev.map((s, i) => i === index ? { ...s, imagePrompt: newPrompt } : s));
  };

  const handleRegenerateImageFromPrompt = async (index: number) => {
    const slide = currentSlides[index];
    if (!slide.imagePrompt) return;

    setImageGenStatus(prev => ({ ...prev, [index]: { loading: true, error: null } }));

    try {
      const imageUrl = await generateImage(slide.imagePrompt, '16:9');
      setCurrentSlides(prevSlides =>
        prevSlides.map((s, i) =>
          i === index ? { ...s, imageUrl, youtubeVideoId: undefined } : s
        )
      );
      setImageGenStatus(prev => ({ ...prev, [index]: { loading: false, error: null } }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : (isAr ? 'فشل توليد الصورة.' : 'Failed to generate image.');
      setImageGenStatus(prev => ({ ...prev, [index]: { loading: false, error: errorMessage } }));
    }
  };
  
  const handleUploadClick = (index: number) => {
    setUploadTargetIndex(index);
    uploadInputRef.current?.click();
  };
  
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
                // Compress to reasonable quality JPEG
                const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
                
                setCurrentSlides(prev => prev.map((s, i) => 
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

  // --- YouTube Handlers ---

  const extractYouTubeId = (url: string): string | null => {
      if (!url) return null;
      const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/;
      const match = url.match(regex);
      return match ? match[1] : null;
  };

  const openYouTubeModal = (index: number) => {
    setYoutubeModalState({
      isOpen: true,
      slideIndex: index,
      url: '',
      error: null,
    });
  };
  
  const closeYouTubeModal = () => {
    setYoutubeModalState({ isOpen: false, slideIndex: null, url: '', error: null });
  };

  const handleImportVideo = () => {
      const { slideIndex, url } = youtubeModalState;
      if (slideIndex === null) return;

      const videoId = extractYouTubeId(url);

      if (videoId) {
          setCurrentSlides(prevSlides => 
              prevSlides.map((slide, i) => 
                  i === slideIndex ? { ...slide, youtubeVideoId: videoId, imageUrl: undefined } : slide
              )
          );
          closeYouTubeModal();
      } else {
          setYoutubeModalState(prev => ({ ...prev, error: isAr ? 'رابط يوتيوب غير صالح.' : 'Invalid YouTube URL.' }));
      }
  };

  // --- Generic Media Removal ---
  
  const removeMedia = (index: number) => {
      setCurrentSlides(prevSlides => 
        prevSlides.map((slide, i) => {
            if (i === index) {
                const { imageUrl, youtubeVideoId, ...rest } = slide;
                return rest;
            }
            return slide;
        })
      );
      setImageGenStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus[index];
          return newStatus;
      });
  };

  // --- Slide Regeneration ---
  const handleRegenerateSlide = async (index: number) => {
    setRegeneratingSlide(index);
    try {
        const currentSlide = currentSlides[index];
        const newSlideContent = await regenerateSlide(currentSlide, { ...context, language: lang });
        setCurrentSlides(prev => prev.map((s, i) => (i === index ? { ...s, ...newSlideContent, imageUrl: s.imageUrl, youtubeVideoId: s.youtubeVideoId } : s)));
    } catch (error) {
        console.error("Failed to regenerate slide:", error);
    } finally {
        setRegeneratingSlide(null);
    }
  };

  // --- Save & Download ---
  const handleSave = () => {
    setSaveStatus('saving');
    try {
      localStorage.setItem('saved_presentation', JSON.stringify(currentSlides));
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000); // Revert after 2 seconds
    } catch (error) {
      console.error("Failed to save presentation to local storage", error);
      setSaveStatus('idle'); // Revert on error
    }
  };

  const handleDownload = async () => {
    if (!canDownload) {
        showPricing();
        return;
    }
    setIsDownloading(true);
    const pptx = new PptxGenJS();
    const theme = themes[activeTheme];

    for (const slide of currentSlides) {
        const pptxSlide = pptx.addSlide();
        pptxSlide.background = { color: theme.pptx.bg };

        pptxSlide.addText(slide.title, {
            x: 0.5, y: 0.5, w: '90%', h: 1,
            align: isAr ? 'right' : 'left',
            fontSize: 32,
            bold: true,
            color: theme.pptx.title,
            rtlMode: isAr,
        });

        const contentY = slide.imageUrl || slide.youtubeVideoId ? 1.8 : 1.5;
        const contentW = slide.imageUrl || slide.youtubeVideoId ? '45%' : '90%';

        pptxSlide.addText(slide.content.join('\n'), {
            x: 0.5, y: contentY, w: contentW, h: 3,
            align: isAr ? 'right' : 'left',
            fontSize: 18,
            color: theme.pptx.text,
            rtlMode: isAr,
            bullet: { type: 'bullet', color: theme.pptx.accent },
        });

        if (slide.imageUrl) {
            pptxSlide.addImage({
                data: slide.imageUrl,
                x: '50%', y: 1.8, w: '45%', h: 3,
                sizing: { type: 'contain', w: 4.5, h: 3 }
            });
        } else if (slide.youtubeVideoId) {
            const thumbnailUrl = `https://img.youtube.com/vi/${slide.youtubeVideoId}/0.jpg`;
             pptxSlide.addImage({
                path: thumbnailUrl,
                x: '50%', y: 1.8, w: '45%', h: 3,
                sizing: { type: 'contain', w: 4.5, h: 3 },
                hyperlink: { url: `https://www.youtube.com/watch?v=${slide.youtubeVideoId}`, tooltip: isAr ? 'انقر لمشاهدة الفيديو' : 'Click to watch video' }
            });
        }

        if (slide.speakerNotes) {
            pptxSlide.addNotes(slide.speakerNotes);
        }
        
        // Add watermark
        pptxSlide.addText("Powered by Smart Lesson", {
            x: 0, y: '92%', w: '100%', h: 0.5,
            align: 'center', fontSize: 10, color: '888888'
        });
    }

    await pptx.writeFile({ fileName: `${context.topic || 'presentation'}.pptx` });
    incrementUsage('downloads');
    setIsDownloading(false);
  };

  // --- Classroom Mode Logic ---

  const activeSlideIndex = selectedSlideIndex ?? 0;
  const activeSlide = currentSlides[activeSlideIndex];

  // Canvas drawing logic
  useEffect(() => {
      if (!isDrawing || viewMode !== 'classroom') return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Restore existing annotations for this slide if any (handled in render or separate effect)
      // But here we mostly handle new drawing interactions
      
      let drawing = false;

      const startDrawing = (e: MouseEvent | TouchEvent) => {
          drawing = true;
          ctx.beginPath();
          const { x, y } = getCoordinates(e, canvas);
          ctx.moveTo(x, y);
      };

      const draw = (e: MouseEvent | TouchEvent) => {
          if (!drawing) return;
          e.preventDefault();
          const { x, y } = getCoordinates(e, canvas);
          ctx.lineTo(x, y);
          ctx.strokeStyle = brushColor;
          ctx.lineWidth = brushSize;
          ctx.lineCap = 'round';
          ctx.stroke();
      };

      const stopDrawing = () => {
          if (!drawing) return;
          drawing = false;
          ctx.closePath();
          // Save the canvas state
          const dataUrl = canvas.toDataURL();
          setSlideAnnotations(prev => ({ ...prev, [activeSlideIndex]: dataUrl }));
      };

      canvas.addEventListener('mousedown', startDrawing);
      canvas.addEventListener('mousemove', draw);
      canvas.addEventListener('mouseup', stopDrawing);
      canvas.addEventListener('mouseout', stopDrawing);
      
      canvas.addEventListener('touchstart', startDrawing, { passive: false });
      canvas.addEventListener('touchmove', draw, { passive: false });
      canvas.addEventListener('touchend', stopDrawing);

      return () => {
          canvas.removeEventListener('mousedown', startDrawing);
          canvas.removeEventListener('mousemove', draw);
          canvas.removeEventListener('mouseup', stopDrawing);
          canvas.removeEventListener('mouseout', stopDrawing);
          canvas.removeEventListener('touchstart', startDrawing);
          canvas.removeEventListener('touchmove', draw);
          canvas.removeEventListener('touchend', stopDrawing);
      };
  }, [isDrawing, brushColor, brushSize, activeSlideIndex, viewMode]);

  // Restore annotations when slide changes
  useEffect(() => {
      if (viewMode !== 'classroom') return;
      const canvas = canvasRef.current;
      if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              const saved = slideAnnotations[activeSlideIndex];
              if (saved) {
                  const img = new Image();
                  img.onload = () => {
                      ctx.drawImage(img, 0, 0);
                  };
                  img.src = saved;
              }
          }
      }
  }, [activeSlideIndex, viewMode, slideAnnotations]);

  // Helper for coordinates
  const getCoordinates = (e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) => {
      const rect = canvas.getBoundingClientRect();
      let clientX, clientY;
      if ('touches' in e) {
          clientX = e.touches[0].clientX;
          clientY = e.touches[0].clientY;
      } else {
          clientX = (e as MouseEvent).clientX;
          clientY = (e as MouseEvent).clientY;
      }
      // Scale coordinates in case canvas is resized via CSS
      return {
          x: (clientX - rect.left) * (canvas.width / rect.width),
          y: (clientY - rect.top) * (canvas.height / rect.height)
      };
  };

  const clearCanvas = () => {
      const canvas = canvasRef.current;
      if (canvas) {
          const ctx = canvas.getContext('2d');
          ctx?.clearRect(0, 0, canvas.width, canvas.height);
          setSlideAnnotations(prev => {
              const newState = { ...prev };
              delete newState[activeSlideIndex];
              return newState;
          });
      }
  };
  
  const formatTime = (s: number) => {
      const m = Math.floor(s / 60);
      const sec = s % 60;
      return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  // --- Widgets Components ---
  
  interface TimerWidgetProps {
      initialTime?: number;
      autoStart?: boolean;
      onComplete?: () => void;
  }

  const TimerWidget: React.FC<TimerWidgetProps> = ({ initialTime = 300, autoStart = false, onComplete }) => {
      const [time, setTime] = useState(initialTime);
      const [isActive, setIsActive] = useState(autoStart);
      const [mode, setMode] = useState<'countdown' | 'stopwatch'>('countdown');
      
      useEffect(() => {
          // If initialTime changes (e.g. from smart timer), update time and restart if autoStart
          setTime(initialTime);
          setIsActive(autoStart);
          setMode('countdown');
      }, [initialTime, autoStart]);

      useEffect(() => {
          let interval: number;
          if (isActive) {
              interval = window.setInterval(() => {
                  setTime(prev => {
                      if (mode === 'countdown') {
                          const next = prev - 1;
                          if (next <= 0) {
                              setIsActive(false);
                              if(onComplete) onComplete();
                              return 0;
                          }
                          return next;
                      } else {
                          return prev + 1;
                      }
                  });
              }, 1000);
          }
          return () => clearInterval(interval);
      }, [isActive, mode, onComplete]);

      return (
          <div className="fixed top-20 left-4 bg-white rounded-xl shadow-2xl p-4 z-[60] w-64 border border-gray-200">
              <div className="flex justify-between items-center mb-3">
                  <h4 className="font-bold text-gray-700 flex items-center gap-2">
                      <ToolbarIcons.Clock /> {isAr ? 'المؤقت' : 'Timer'}
                  </h4>
                  <button onClick={() => setShowTimer(false)} className="text-gray-400 hover:text-gray-600"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg></button>
              </div>
              <div className={`text-4xl font-mono font-bold text-center my-4 bg-gray-50 py-2 rounded ${time === 0 && mode === 'countdown' ? 'text-red-600 animate-pulse' : 'text-indigo-600'}`}>
                  {formatTime(time)}
              </div>
              <div className="flex justify-between gap-2">
                  <button onClick={() => setIsActive(!isActive)} className={`flex-1 py-1 px-2 rounded text-sm font-bold text-white ${isActive ? 'bg-yellow-500' : 'bg-green-500'}`}>
                      {isActive ? (isAr ? 'إيقاف' : 'Pause') : (isAr ? 'بدء' : 'Start')}
                  </button>
                  <button onClick={() => { setIsActive(false); setTime(mode === 'countdown' ? initialTime : 0); }} className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm font-bold">
                      {isAr ? 'إعادة' : 'Reset'}
                  </button>
              </div>
              <div className="mt-3 flex justify-center gap-2 text-xs">
                  <button onClick={() => {setMode('countdown'); setTime(initialTime); setIsActive(false)}} className={`px-2 py-1 rounded ${mode === 'countdown' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500'}`}>{isAr ? 'عد تنازلي' : 'Countdown'}</button>
                  <button onClick={() => {setMode('stopwatch'); setTime(0); setIsActive(false)}} className={`px-2 py-1 rounded ${mode === 'stopwatch' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500'}`}>{isAr ? 'ساعة إيقاف' : 'Stopwatch'}</button>
              </div>
          </div>
      );
  };

  const PickerWidget = () => {
      const [names, setNames] = useState('');
      const [picked, setPicked] = useState<string | null>(null);
      const [animating, setAnimating] = useState(false);

      const pickRandom = () => {
          const list = names.split('\n').filter(n => n.trim());
          if (list.length === 0) return;
          setAnimating(true);
          let count = 0;
          const interval = setInterval(() => {
              setPicked(list[Math.floor(Math.random() * list.length)]);
              count++;
              if (count > 10) {
                  clearInterval(interval);
                  setAnimating(false);
              }
          }, 100);
      };

      return (
          <div className="fixed top-20 right-4 bg-white rounded-xl shadow-2xl p-4 z-[60] w-72 border border-gray-200">
               <div className="flex justify-between items-center mb-3">
                  <h4 className="font-bold text-gray-700 flex items-center gap-2">
                      <ToolbarIcons.Users /> {isAr ? 'اختيار عشوائي' : 'Random Picker'}
                  </h4>
                  <button onClick={() => setShowPicker(false)} className="text-gray-400 hover:text-gray-600"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg></button>
              </div>
              {picked && (
                  <div className={`text-center p-4 mb-4 rounded-lg font-bold text-xl transition-all ${animating ? 'bg-gray-100 text-gray-400 scale-95' : 'bg-indigo-600 text-white scale-100 shadow-lg'}`}>
                      {picked}
                  </div>
              )}
              <textarea 
                  value={names} 
                  onChange={(e) => setNames(e.target.value)} 
                  placeholder={isAr ? "الصق الأسماء هنا (اسم في كل سطر)" : "Paste names here (one per line)"}
                  className="w-full p-2 border border-gray-300 rounded text-sm h-32 mb-3 resize-none"
              />
              <button onClick={pickRandom} disabled={animating || !names.trim()} className="w-full py-2 bg-indigo-600 text-white font-bold rounded hover:bg-indigo-700 disabled:bg-gray-300 transition">
                  {isAr ? 'اختيار اسم' : 'Pick Random Name'}
              </button>
          </div>
      );
  };
  
  const currentTheme = themes[activeTheme];
      
  return (
    <>
      <div
        className="fixed inset-0 bg-gray-900 bg-opacity-90 z-50 flex flex-col overflow-hidden"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="presentation-title"
      >
        <input type="file" ref={uploadInputRef} onChange={handleFileSelected} className="hidden" accept="image/*" />
        
        {/* Header Bar */}
        <div className={`bg-gray-800 text-white p-3 flex items-center justify-between shadow-lg shrink-0 z-50 ${viewMode === 'classroom' ? 'bg-gray-900 border-b border-gray-800' : ''}`} onClick={(e) => e.stopPropagation()} dir={isAr ? 'rtl' : 'ltr'}>
             <div className="flex items-center gap-4">
                 <h2 id="presentation-title" className="text-lg font-bold flex items-center gap-2">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
                     {isAr ? 'محرر العروض التقديمية' : 'Presentation Editor'}
                 </h2>
                 {/* View Mode Toggle */}
                 <div className="bg-gray-700 rounded-lg p-0.5 flex items-center">
                     <button onClick={() => setViewMode('editor')} className={`px-3 py-1 rounded-md text-xs font-bold transition ${viewMode === 'editor' ? 'bg-gray-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}>
                         {isAr ? 'محرر' : 'Editor'}
                     </button>
                     <button onClick={() => setViewMode('classroom')} className={`px-3 py-1 rounded-md text-xs font-bold transition flex items-center gap-1 ${viewMode === 'classroom' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}>
                         <ToolbarIcons.Board /> {isAr ? 'عرض الفصل' : 'Classroom'}
                     </button>
                 </div>
             </div>
             
             <div className="flex items-center gap-2">
                 <button onClick={handleSave} disabled={saveStatus !== 'idle'} className="bg-gray-700 hover:bg-gray-600 text-white font-medium py-1.5 px-3 rounded-lg transition flex items-center gap-2 text-sm">
                    {saveStatus === 'saving' ? <Spinner className="h-4 w-4"/> : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2V4zm3 1h4a1 1 0 000-2H8a1 1 0 000 2zm-1 5a1 1 0 100 2h6a1 1 0 100-2H7z" /></svg>
                    )}
                    <span className="hidden sm:inline">{saveStatus === 'idle' ? (isAr ? 'حفظ' : 'Save') : (saveStatus === 'saved' ? (isAr ? 'تم الحفظ' : 'Saved') : '')}</span>
                </button>
                 <button onClick={handleDownload} disabled={isDownloading || !canDownload} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 px-4 rounded-lg transition flex items-center gap-2 text-sm">
                    {isDownloading ? <Spinner className="h-4 w-4"/> : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    )}
                    <span>{!canDownload ? (isAr ? 'ترقية' : 'Upgrade') : (isAr ? 'تصدير PPTX' : 'Export PPTX')}</span>
                </button>
                <div className="w-px h-6 bg-gray-600 mx-1"></div>
                <button onClick={onClose} className="text-gray-400 hover:text-white transition" aria-label={isAr ? 'إغلاق' : 'Close'}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
             </div>
        </div>

        {/* Main Area */}
        <div className="flex flex-grow overflow-hidden" onClick={(e) => e.stopPropagation()} dir={isAr ? 'rtl' : 'ltr'}>
            
            {/* View Mode Logic */}
            {viewMode === 'editor' ? (
                <>
                {/* Left Side: Slides Canvas (Editor Mode) */}
                <div className="flex-grow overflow-y-auto bg-gray-100 p-4 md:p-8 relative">
                     <div className="max-w-4xl mx-auto space-y-6 pb-20">
                        {currentSlides.map((slide, index) => {
                            const status = imageGenStatus[index];
                            const hasImage = !!slide.imageUrl;
                            const hasVideo = !!slide.youtubeVideoId;
                            const hasMedia = hasImage || hasVideo;
                            const isSelected = selectedSlideIndex === index;

                            return (
                                <React.Fragment key={index}>
                                    {/* Insert Trigger */}
                                    <div className="relative group h-4 flex items-center justify-center">
                                         <button onClick={() => handleInsertAiSlide(index)} disabled={insertingSlideIndex !== null} className="opacity-0 group-hover:opacity-100 transition-all bg-indigo-100 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-full p-1 shadow-sm transform scale-75 hover:scale-100">
                                            {insertingSlideIndex === index ? <Spinner className="w-4 h-4"/> : <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" /></svg>}
                                        </button>
                                    </div>

                                    {/* Slide Card */}
                                    <div 
                                        ref={(el) => { slideRefs.current[index] = el; }}
                                        data-index={index}
                                        onClick={() => setSelectedSlideIndex(index)}
                                        draggable={draggableIndex === index}
                                        onDragStart={() => handleDragStart(index)}
                                        onDragOver={(e) => handleDragOver(e, index)}
                                        onDrop={(e) => handleDrop(e, index)}
                                        onDragEnd={handleDragEnd}
                                        className={`
                                            animation-container ${activeAnimation} ${visibleSlides.has(index) ? 'in-view' : ''}
                                            relative rounded-lg overflow-hidden transition-all duration-200 ease-out
                                            ${currentTheme.bg} shadow-md
                                            ${isSelected ? 'ring-4 ring-indigo-500 ring-opacity-50 shadow-2xl z-10 scale-[1.01]' : 'hover:shadow-lg hover:scale-[1.005] opacity-90 hover:opacity-100'}
                                            ${draggedIndex === index ? 'opacity-50' : ''}
                                        `}
                                    >
                                         {/* Floating Context Toolbar (Only on Selected) */}
                                         {isSelected && (
                                            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-gray-900/90 text-white rounded-full px-3 py-1.5 shadow-lg backdrop-blur-sm flex items-center gap-3 z-30 opacity-0 hover:opacity-100 transition-opacity delay-100 duration-300">
                                                <button onClick={(e) => { e.stopPropagation(); handleAddBulletPoint(index); }} className="hover:text-indigo-300 transition" title={isAr ? 'إضافة نقطة' : 'Add Bullet'}><ToolbarIcons.List /></button>
                                                <div className="w-px h-4 bg-gray-600"></div>
                                                 {/* Quick Media Access */}
                                                <button onClick={(e) => { e.stopPropagation(); openYouTubeModal(index); }} className="hover:text-red-400 transition" title={isAr ? 'فيديو يوتيوب' : 'YouTube Video'}><ToolbarIcons.Video /></button>
                                                <button onClick={(e) => { e.stopPropagation(); handleUploadClick(index); }} className="hover:text-blue-400 transition" title={isAr ? 'رفع صورة' : 'Upload Image'}><ToolbarIcons.Upload /></button>
                                                <div className="w-px h-4 bg-gray-600"></div>
                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteSlide(index); }} className="hover:text-red-400 transition" title={isAr ? 'حذف الشريحة' : 'Delete Slide'}><ToolbarIcons.Trash /></button>
                                            </div>
                                         )}

                                        {/* Drag Handle & Add Button (Always Visible on Hover) */}
                                        <div className={`absolute top-2 ${isAr ? 'left-2' : 'right-2'} z-20 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity`}>
                                            <button 
                                                className="bg-gray-200/80 hover:bg-gray-300 text-gray-700 rounded p-1 cursor-grab active:cursor-grabbing"
                                                onMouseEnter={() => setDraggableIndex(index)}
                                                onMouseLeave={() => setDraggableIndex(null)}
                                                onMouseDown={() => setDraggableIndex(index)}
                                                onMouseUp={() => setDraggableIndex(null)}
                                            >
                                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 5h10v10H5V5z" /><path d="M7 7h2v2H7V7zm4 0h2v2h-2V7zM7 11h2v2H7v-2zm4 0h2v2h-2v-2z" /></svg>
                                            </button>
                                        </div>

                                        {/* Slide Visual Content */}
                                        <div className="aspect-w-16 aspect-h-9 relative">
                                            <div className={`absolute inset-0 flex p-6 sm:p-10 md:p-12 ${isAr ? 'flex-row-reverse' : 'flex-row'}`}>
                                                {/* Text Content */}
                                                <div className={`flex flex-col justify-center ${hasMedia || status?.loading ? 'w-1/2' : 'w-full'} transition-all`}>
                                                    <input 
                                                        ref={el => { titleRefs.current[index] = el; }}
                                                        type="text" 
                                                        value={slide.title} 
                                                        onChange={(e) => handleTitleChange(index, e.target.value)} 
                                                        className={`text-2xl sm:text-3xl font-bold bg-transparent border-none focus:ring-0 rounded p-1 w-full text-center ${currentTheme.titleColor} placeholder-gray-400/50`}
                                                        placeholder={isAr ? 'عنوان الشريحة' : 'Slide Title'}
                                                    />
                                                    <div className={`mt-4 space-y-2 text-lg sm:text-xl text-left mx-auto w-full ${currentTheme.textColor}`}>
                                                        {slide.content.map((item, i) => (
                                                            <div key={i} className="flex items-start gap-2 group/item">
                                                                <span className="mt-1.5 opacity-60">•</span>
                                                                <textarea 
                                                                    value={item} 
                                                                    onChange={(e) => handleContentChange(index, i, e.target.value)} 
                                                                    rows={1} 
                                                                    className="flex-1 bg-transparent border-none focus:ring-0 p-0 resize-none overflow-hidden" 
                                                                    onInput={(e) => { const target = e.target as HTMLTextAreaElement; target.style.height = 'auto'; target.style.height = `${target.scrollHeight}px`; }} 
                                                                />
                                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteBulletPoint(index, i); }} className="text-red-400 opacity-0 group-hover/item:opacity-100 transition-opacity"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg></button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                
                                                {/* Visual Content Area */}
                                                <div className={`flex-grow flex items-center justify-center ${isAr ? 'mr-6' : 'ml-6'} relative rounded-lg ${hasMedia ? 'group/media' : 'border-2 border-dashed border-gray-300/50 bg-gray-50/50'}`}>
                                                    {hasImage ? (
                                                        <>
                                                            <img src={slide.imageUrl} alt={slide.title} className="max-w-full max-h-full object-contain shadow-sm rounded" />
                                                            {/* Change Image Overlay Button */}
                                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/media:opacity-100 transition-opacity flex items-center justify-center rounded">
                                                                <button 
                                                                    onClick={(e) => { e.stopPropagation(); handleUploadClick(index); }} 
                                                                    className="bg-white text-gray-800 px-4 py-2 rounded-full font-bold shadow-lg hover:bg-gray-100 transition flex items-center gap-2"
                                                                >
                                                                    <ToolbarIcons.Upload />
                                                                    {isAr ? 'تغيير الصورة' : 'Change Image'}
                                                                </button>
                                                            </div>
                                                        </>
                                                    ) : hasVideo ? (
                                                        <iframe className="w-full h-full rounded" src={`https://www.youtube.com/embed/${slide.youtubeVideoId}`} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                                                    ) : status?.loading ? (
                                                        <Spinner className="text-indigo-400 h-8 w-8" />
                                                    ) : (
                                                        <div className="flex flex-col items-center gap-3">
                                                            <div className="text-gray-300">
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <button 
                                                                    onClick={(e) => { e.stopPropagation(); handleUploadClick(index); }} 
                                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-md shadow-sm text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition"
                                                                >
                                                                    <ToolbarIcons.Upload />
                                                                    {isAr ? 'رفع صورة' : 'Upload Image'}
                                                                </button>
                                                                 <button 
                                                                    onClick={(e) => { e.stopPropagation(); openYouTubeModal(index); }} 
                                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-md shadow-sm text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-red-600 transition"
                                                                >
                                                                    <ToolbarIcons.Video />
                                                                    {isAr ? 'فيديو' : 'Video'}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {/* Slide Number */}
                                            <div className={`absolute bottom-2 ${isAr ? 'left-4' : 'right-4'} text-lg font-bold opacity-30 ${currentTheme.textColor} pointer-events-none`}>
                                                {index + 1}
                                            </div>
                                            
                                            {regeneratingSlide === index && ( <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-20"> <Spinner className="text-indigo-600 h-10 w-10" /> </div> )}
                                        </div>
                                    </div>
                                </React.Fragment>
                            );
                        })}
                        
                        {/* Add Slide Button at End */}
                        <button onClick={() => handleAddSlide(currentSlides.length)} className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition flex flex-col items-center justify-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                            <span className="font-medium">{isAr ? 'إضافة شريحة جديدة' : 'Add New Slide'}</span>
                        </button>
                     </div>
                </div>

                {/* Right Side: Inspector Panel */}
                <div className="w-80 bg-white border-l border-gray-200 shadow-xl z-20 flex flex-col shrink-0 transition-all duration-300">
                    {selectedSlideIndex !== null && currentSlides[selectedSlideIndex] ? (
                        /* SLIDE EDITING MODE */
                        <>
                            <div className="p-4 border-b border-gray-100 bg-gray-50">
                                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">{isAr ? `خصائص الشريحة ${selectedSlideIndex + 1}` : `Slide ${selectedSlideIndex + 1} Properties`}</h3>
                            </div>
                            <div className="flex-grow overflow-y-auto p-4 space-y-6">
                                {/* Section: Speaker Notes */}
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                                        {isAr ? 'ملاحظات المتحدث' : 'Speaker Notes'}
                                    </label>
                                    <textarea 
                                        value={currentSlides[selectedSlideIndex].speakerNotes} 
                                        onChange={(e) => handleNotesChange(selectedSlideIndex, e.target.value)} 
                                        className="w-full p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 min-h-[100px] resize-y bg-yellow-50" 
                                        placeholder={isAr ? 'أضف ملاحظات العرض هنا...' : 'Add presentation notes here...'}
                                    />
                                </div>

                                {/* Section: Media & AI */}
                                <div className="space-y-3 pt-4 border-t border-gray-100">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                        <ToolbarIcons.Image />
                                        {isAr ? 'الوسائط والصور' : 'Media & Visuals'}
                                    </label>
                                    
                                    {/* Prompt Input */}
                                    <div>
                                        <label className="text-xs text-gray-500 mb-1 block">{isAr ? 'وصف الصورة (AI Prompt)' : 'AI Image Description'}</label>
                                        <textarea
                                            value={currentSlides[selectedSlideIndex].imagePrompt || ''}
                                            onChange={(e) => handleImagePromptChange(selectedSlideIndex, e.target.value)}
                                            placeholder={isAr ? 'صف الصورة بالإنجليزية...' : 'Describe image in English...'}
                                            className="w-full p-2 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-300 min-h-[60px]"
                                        />
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="grid grid-cols-1 gap-2">
                                        <button 
                                            onClick={() => handleRegenerateImageFromPrompt(selectedSlideIndex)} 
                                            disabled={!currentSlides[selectedSlideIndex].imagePrompt || imageGenStatus[selectedSlideIndex]?.loading}
                                            className="flex items-center justify-center gap-2 w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded shadow-sm transition disabled:bg-indigo-300"
                                        >
                                            {imageGenStatus[selectedSlideIndex]?.loading ? <Spinner className="h-3 w-3" /> : <ToolbarIcons.Magic />}
                                            {isAr ? 'توليد صورة AI' : 'Generate AI Image'}
                                        </button>
                                        
                                        <div className="grid grid-cols-2 gap-2">
                                            <button onClick={() => handleUploadClick(selectedSlideIndex)} className="flex items-center justify-center gap-1 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded border border-gray-200 transition">
                                                <ToolbarIcons.Upload /> {isAr ? 'رفع' : 'Upload'}
                                            </button>
                                            <button onClick={() => openYouTubeModal(selectedSlideIndex)} className="flex items-center justify-center gap-1 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded border border-gray-200 transition">
                                                <ToolbarIcons.Video /> {isAr ? 'فيديو' : 'Video'}
                                            </button>
                                        </div>
                                        
                                        {(currentSlides[selectedSlideIndex].imageUrl || currentSlides[selectedSlideIndex].youtubeVideoId) && (
                                            <button onClick={() => removeMedia(selectedSlideIndex)} className="text-xs text-red-500 hover:text-red-700 underline text-center mt-1">
                                                {isAr ? 'إزالة الوسائط' : 'Remove Media'}
                                            </button>
                                        )}
                                    </div>
                                    {imageGenStatus[selectedSlideIndex]?.error && <p className="text-xs text-red-500">{imageGenStatus[selectedSlideIndex].error}</p>}
                                </div>

                                 {/* Section: Slide Actions */}
                                 <div className="space-y-3 pt-4 border-t border-gray-100">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                        <ToolbarIcons.Refresh />
                                        {isAr ? 'إجراءات' : 'Actions'}
                                    </label>
                                    <button 
                                        onClick={() => handleRegenerateSlide(selectedSlideIndex)}
                                        disabled={regeneratingSlide === selectedSlideIndex}
                                        className="w-full py-2 border border-indigo-200 text-indigo-700 hover:bg-indigo-50 rounded-md text-xs font-semibold transition flex items-center justify-center gap-2"
                                    >
                                        {regeneratingSlide === selectedSlideIndex ? <Spinner className="h-3 w-3"/> : <ToolbarIcons.Refresh />}
                                        {isAr ? 'إعادة صياغة المحتوى (AI)' : 'Regenerate Content (AI)'}
                                    </button>
                                 </div>

                            </div>
                        </>
                    ) : (
                        /* GLOBAL SETTINGS MODE (No Slide Selected) */
                        <>
                             <div className="p-4 border-b border-gray-100 bg-gray-50">
                                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">{isAr ? 'إعدادات العرض' : 'Presentation Settings'}</h3>
                            </div>
                            <div className="p-4 space-y-8 text-center">
                                 <div className="text-indigo-200 mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                                 </div>
                                 <p className="text-gray-500 text-sm">{isAr ? 'حدد شريحة من القائمة لتعديل محتواها، أو غير الإعدادات العامة أدناه.' : 'Select a slide from the left to edit its content, or adjust global settings below.'}</p>
                                 
                                 {/* Theme Selector */}
                                 <div className="text-left space-y-2">
                                     <label className="text-xs font-bold text-gray-600 uppercase">{isAr ? 'التصميم العام' : 'Global Theme'}</label>
                                     <div className="grid grid-cols-5 gap-2">
                                        {Object.keys(themes).map(key => (
                                            <button key={key} onClick={() => setActiveTheme(key)} className={`w-8 h-8 rounded-full border-2 transition-all ${activeTheme === key ? 'border-indigo-600 ring-2 ring-indigo-100 scale-110' : 'border-transparent hover:scale-105'} ${themes[key].bg}`} title={themes[key].name[lang]} />
                                        ))}
                                     </div>
                                     <p className="text-xs text-gray-400">{themes[activeTheme].name[lang]}</p>
                                 </div>

                                 {/* Transition Selector */}
                                 <div className="text-left space-y-2">
                                     <label className="text-xs font-bold text-gray-600 uppercase">{isAr ? 'الحركة الانتقالية' : 'Transition Effect'}</label>
                                     <select
                                          value={activeAnimation}
                                          onChange={(e) => setActiveAnimation(e.target.value as any)}
                                          className="w-full p-2 text-sm border border-gray-300 rounded-md bg-white"
                                        >
                                          <option value="slide">{isAr ? 'انزلاق (Slide)' : 'Slide'}</option>
                                          <option value="fade">{isAr ? 'تلاشي (Fade)' : 'Fade'}</option>
                                          <option value="zoom">{isAr ? 'تكبير (Zoom)' : 'Zoom'}</option>
                                    </select>
                                 </div>
                            </div>
                        </>
                    )}
                </div>
                </>
            ) : (
                /* CLASSROOM MODE */
                <div className="flex-grow bg-gray-900 flex flex-col relative overflow-hidden">
                    {/* Live Lesson Progress Bar */}
                    <div className="absolute top-0 left-0 w-full z-[60] px-20 py-2 bg-gradient-to-b from-gray-900/80 to-transparent pointer-events-none flex justify-center">
                         <div className="bg-black/60 backdrop-blur-md rounded-full px-4 py-1 flex items-center gap-4 border border-white/10 pointer-events-auto">
                            {/* Lesson Status Icon */}
                            <div className={`w-2 h-2 rounded-full animate-pulse ${isLessonRunning ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            
                            {/* Current Activity Timer */}
                            <div className={`font-mono font-bold text-lg ${lessonTimeRemaining < 60 ? 'text-red-400' : 'text-white'}`}>
                                {formatTime(lessonTimeRemaining)}
                            </div>
                            
                            {/* Progress Bar */}
                            <div className="w-32 h-1 bg-gray-600 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${((activeSlideIndex + 1) / currentSlides.length) * 100}%` }}></div>
                            </div>
                            
                             {/* Total Time */}
                             <div className="text-xs text-gray-400 font-mono">
                                {formatTime(totalTimeElapsed)}
                             </div>
                        </div>
                    </div>

                    {/* Full Screen Slide Container */}
                    <div className="flex-grow flex items-center justify-center p-4 md:p-10 relative">
                        <div className={`aspect-w-16 aspect-h-9 w-full max-w-[90vw] max-h-[85vh] bg-white shadow-2xl rounded-xl overflow-hidden relative ${currentTheme.bg}`}>
                             {/* Drawing Canvas Overlay */}
                             <canvas 
                                ref={canvasRef} 
                                className={`absolute inset-0 z-30 touch-none ${isDrawing ? 'cursor-crosshair pointer-events-auto' : 'pointer-events-none'}`}
                                width={1280} 
                                height={720} 
                             />

                             {/* Slide Content */}
                             <div className={`absolute inset-0 flex p-8 sm:p-12 md:p-16 ${isAr ? 'flex-row-reverse' : 'flex-row'} z-10 pointer-events-auto`}>
                                  <div className={`flex flex-col justify-center ${activeSlide.imageUrl || activeSlide.youtubeVideoId ? 'w-1/2' : 'w-full'}`}>
                                        <h1 className={`text-4xl md:text-5xl font-bold text-center mb-8 ${currentTheme.titleColor}`}>{activeSlide.title}</h1>
                                        <div className={`space-y-4 text-2xl md:text-3xl ${currentTheme.textColor}`}>
                                            {activeSlide.content.map((item, i) => (
                                                <div key={i} className="flex items-start gap-4">
                                                    <span className="mt-2 opacity-60">•</span>
                                                    <p>{item}</p>
                                                </div>
                                            ))}
                                        </div>
                                  </div>
                                  
                                  {(activeSlide.imageUrl || activeSlide.youtubeVideoId) && (
                                      <div className={`flex-grow flex items-center justify-center ${isAr ? 'mr-10' : 'ml-10'} relative`}>
                                           {activeSlide.imageUrl ? (
                                                <img src={activeSlide.imageUrl} alt={activeSlide.title} className="max-w-full max-h-full object-contain rounded-lg shadow-lg" />
                                           ) : (
                                                <iframe className="w-full h-full rounded-lg shadow-lg" src={`https://www.youtube.com/embed/${activeSlide.youtubeVideoId}`} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                                           )}
                                      </div>
                                  )}
                             </div>
                             
                             {/* Slide Number */}
                             <div className={`absolute bottom-4 ${isAr ? 'left-6' : 'right-6'} text-2xl font-bold opacity-30 ${currentTheme.textColor}`}>
                                {activeSlideIndex + 1} / {currentSlides.length}
                            </div>

                            {/* Time's Up Notification */}
                            {timeIsUp && (
                                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-500/90 backdrop-blur-md text-white px-8 py-6 rounded-2xl shadow-2xl z-50 flex flex-col items-center animate-bounce">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <h2 className="text-3xl font-bold">{isAr ? 'انتهى الوقت!' : "Time's Up!"}</h2>
                                    <p className="text-lg mt-1 opacity-90">{isAr ? 'حان الوقت للانتقال إلى النشاط التالي.' : 'Time to move to the next activity.'}</p>
                                    <button onClick={() => setTimeIsUp(false)} className="mt-4 bg-white text-red-600 px-4 py-2 rounded-full font-bold hover:bg-gray-100 transition">{isAr ? 'حسناً' : 'Dismiss'}</button>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Classroom Bottom Dock */}
                    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-4 z-[60]">
                        
                        {/* Smart Activity Timer Indicator */}
                         {activeSlide.duration && activeSlide.duration > 0 && !showTimer && (
                            <button 
                                onClick={() => {
                                    setInitialTimerValue(activeSlide.duration! * 60);
                                    setShowTimer(true);
                                }}
                                className="animate-pulse bg-indigo-600 text-white px-4 py-1.5 rounded-full shadow-lg flex items-center gap-2 text-sm font-bold hover:bg-indigo-500 transition transform hover:scale-105"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                </svg>
                                <span>{isAr ? `نشاط: ${activeSlide.duration} دقيقة` : `Activity: ${activeSlide.duration} mins`}</span>
                            </button>
                        )}

                        <div className="bg-gray-800/90 backdrop-blur border border-gray-700 rounded-full px-6 py-3 flex items-center gap-6 shadow-2xl relative">
                            {/* Navigation */}
                            <div className="flex items-center gap-2 border-r border-gray-600 pr-6">
                                <button 
                                    onClick={() => setSelectedSlideIndex(Math.max(0, activeSlideIndex - 1))} 
                                    disabled={activeSlideIndex === 0}
                                    className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-30 transition"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${isAr ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                </button>
                                <span className="text-white font-mono font-bold w-16 text-center text-lg">
                                    {activeSlideIndex + 1} / {currentSlides.length}
                                </span>
                                <button 
                                    onClick={() => setSelectedSlideIndex(Math.min(currentSlides.length - 1, activeSlideIndex + 1))} 
                                    disabled={activeSlideIndex === currentSlides.length - 1}
                                    className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-30 transition"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${isAr ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                </button>
                            </div>
                            
                            {/* Tools */}
                            <div className="flex items-center gap-4">
                                {/* Lesson Play/Pause Control */}
                                <button 
                                    onClick={() => setIsLessonRunning(!isLessonRunning)} 
                                    className={`p-3 rounded-full transition ${isLessonRunning ? 'bg-red-500 text-white animate-pulse' : 'bg-green-600 text-white hover:bg-green-500'}`}
                                    title={isLessonRunning ? (isAr ? 'إيقاف مؤقت' : 'Pause Lesson') : (isAr ? 'بدء الدرس' : 'Start Lesson')}
                                >
                                    {isLessonRunning ? <ToolbarIcons.Pause /> : <ToolbarIcons.Play />}
                                </button>

                                <div className="w-px h-8 bg-gray-600 mx-1"></div>

                                <button 
                                    onClick={() => setIsDrawing(!isDrawing)} 
                                    className={`p-3 rounded-full transition ${isDrawing ? 'bg-indigo-600 text-white ring-2 ring-indigo-400' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                                    title={isAr ? 'قلم' : 'Pen'}
                                >
                                    <ToolbarIcons.Pen />
                                </button>
                                
                                {isDrawing && (
                                    <div className="absolute bottom-full mb-4 left-1/2 transform -translate-x-1/2 bg-gray-800 rounded-full p-2 flex items-center gap-3 shadow-xl border border-gray-700 whitespace-nowrap">
                                        {['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#ffffff'].map(c => (
                                            <button 
                                                key={c} 
                                                onClick={() => setBrushColor(c)} 
                                                className={`w-6 h-6 rounded-full border-2 ${brushColor === c ? 'border-white scale-110' : 'border-transparent hover:scale-110'}`}
                                                style={{ backgroundColor: c }}
                                            />
                                        ))}
                                        <div className="w-px h-6 bg-gray-600 mx-1"></div>
                                         <div className="flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path d="M10 18a8 8 0 100-16 8 8 0 000 16z" /></svg>
                                            <input
                                                type="range"
                                                min="2"
                                                max="20"
                                                step="2"
                                                value={brushSize}
                                                onChange={(e) => setBrushSize(Number(e.target.value))}
                                                className="w-16 h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                                title="Brush Size"
                                            />
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path d="M10 18a8 8 0 100-16 8 8 0 000 16z" /></svg>
                                        </div>
                                        <div className="w-px h-6 bg-gray-600 mx-1"></div>
                                        <button onClick={clearCanvas} className="p-1 hover:text-red-400 text-gray-300" title={isAr ? 'مسح' : 'Clear Slide'}><ToolbarIcons.Trash /></button>
                                    </div>
                                )}

                                <button 
                                    onClick={() => {
                                        if(!showTimer && activeSlide.duration) {
                                             setInitialTimerValue(activeSlide.duration * 60);
                                        } else if (!showTimer) {
                                             setInitialTimerValue(300);
                                        }
                                        setShowTimer(!showTimer);
                                    }} 
                                    className={`p-3 rounded-full transition ${showTimer ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                                    title={isAr ? 'مؤقت' : 'Timer'}
                                >
                                    <ToolbarIcons.Clock />
                                </button>
                                <button 
                                    onClick={() => setShowPicker(!showPicker)} 
                                    className={`p-3 rounded-full transition ${showPicker ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                                    title={isAr ? 'اختيار عشوائي' : 'Random Picker'}
                                >
                                    <ToolbarIcons.Users />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Floating Widgets */}
                    {showTimer && (
                        <TimerWidget 
                            initialTime={initialTimerValue} 
                            autoStart={activeSlide.duration !== undefined && activeSlide.duration > 0}
                            onComplete={() => setTimeIsUp(true)}
                        />
                    )}
                    {showPicker && <PickerWidget />}

                </div>
            )}

        </div>
      </div>

      {/* YouTube Import Modal (Kept separate for z-index simplicity) */}
      {youtubeModalState.isOpen && ( <div className="fixed inset-0 bg-gray-900 bg-opacity-60 z-[70] flex items-center justify-center" onClick={closeYouTubeModal}> <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg m-4" onClick={(e) => e.stopPropagation()} dir={isAr ? 'rtl' : 'ltr'}> <h3 className="text-xl font-bold mb-4">{isAr ? 'استيراد فيديو من يوتيوب' : 'Import YouTube Video'}</h3> <div className="space-y-2"> <div> <label htmlFor="youtube_url" className="block text-sm font-medium text-gray-700">{isAr ? 'رابط فيديو يوتيوب' : 'YouTube Video URL'}</label> <input type="url" id="youtube_url" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" value={youtubeModalState.url} onChange={(e) => setYoutubeModalState(prev => ({ ...prev, url: e.target.value, error: null }))} placeholder="https://www.youtube.com/watch?v=..." /> </div> {youtubeModalState.error && <p className="text-red-600 text-sm">{youtubeModalState.error}</p>} </div> <div className={`mt-6 flex ${isAr ? 'justify-start space-x-reverse' : 'justify-end'} space-x-3`}> <button onClick={closeYouTubeModal} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition">{isAr ? 'إلغاء' : 'Cancel'}</button> <button onClick={handleImportVideo} className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition">{isAr ? 'استيراد' : 'Import'}</button> </div> </div> </div>
      )}
    </>
  );
};

export default PresentationView;