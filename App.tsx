
// FIX: Corrected the import for React and hooks to resolve parsing errors.
import React, { useState, useRef, useEffect, useContext } from 'react';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, HeadingLevel, AlignmentType, IStylesOptions, PageOrientation, VerticalAlign, HeightRule, ShadingType, ImageRun, PageBreak, Footer } from 'docx';
import Header from './components/Header';
import { InputField, TextArea, Checkbox, SelectField } from './components/FormElements';
import Spinner from './components/Spinner';
import GeneratingAnimation from './components/GeneratingAnimation';
import { generateLessonPlan, generatePresentationFromPlan, generateImage, transcribeAudio, refineText } from './services/geminiService';
import { LessonPlan, MainAbility, Slide } from './types';
import PresentationView from './components/PresentationView';
import LivePreviewGenerator from './components/LivePreviewGenerator';
import { UserProvider, UserContext } from './contexts/UserContext';
import AuthModal from './components/AuthModal';
import PricingPage from './components/PricingPage';
import OcrModal from './components/OcrModal';
import ImageAnalyzer from './components/ImageAnalyzer';
import LiveLessonMode from './components/LiveLessonMode';


// Data for dropdowns
const grades = ['KG1', 'KG2', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6', 'Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11', 'Year 12', 'Year 13'];
const daysOfWeek = [
  { value: 'Sunday', ar: 'الأحد', en: 'Sunday' },
  { value: 'Monday', ar: 'الاثنين', en: 'Monday' },
  { value: 'Tuesday', ar: 'الثلاثاء', en: 'Tuesday' },
  { value: 'Wednesday', ar: 'الأربعاء', en: 'Wednesday' },
  { value: 'Thursday', ar: 'الخميس', en: 'Thursday' },
];
const subjects = [
  { value: 'Arabic', ar: 'اللغة العربية', en: 'Arabic' },
  { value: 'English', ar: 'اللغة الإنجليزية', en: 'English' },
  { value: 'Mathematics', ar: 'الرياضيات', en: 'Mathematics' },
  { value: 'Science', ar: 'العلوم', en: 'Science' },
  { value: 'Physics', ar: 'الفيزياء', en: 'Physics' },
  { value: 'Chemistry', ar: 'الكيمياء', en: 'Chemistry' },
  { value: 'Biology', ar: 'الأحياء', en: 'Biology' },
  { value: 'Business Studies', ar: 'دراسات الأعمال', en: 'Business Studies' },
  { value: 'Economics', ar: 'الاقتصاد', en: 'Economics' },
  { value: 'Accounting', ar: 'المحاسبة', en: 'Accounting' },
  { value: 'ICT', ar: 'تكنولوجيا المعلومات والاتصالات', en: 'ICT' },
  { value: 'Computer Science', ar: 'علوم الحاسوب', en: 'Computer Science' },
  { value: 'Social Studies', ar: 'الدراسات الاجتماعية', en: 'Social Studies' },
  { value: 'Qatar History', ar: 'تاريخ قطر', en: 'Qatar History' },
  { value: 'Islamic Studies', ar: 'التربية الإسلامية', en: 'Islamic Studies' },
  { value: 'Physical Education', ar: 'التربية البدنية', en: 'Physical Education' },
  { value: 'Art', ar: 'الفنون', en: 'Art' },
  { value: 'Geography', ar: 'الجغرافيا', en: 'Geography' },
  { value: 'History', ar: 'التاريخ', en: 'History' },
  { value: 'Psychology', ar: 'علم النفس', en: 'Psychology' },
  { value: 'Sociology', ar: 'علم الاجتماع', en: 'Sociology' },
  { value: 'English Literature', ar: 'الأدب الإنجليزي', en: 'English Literature' },
  { value: 'Global Perspectives', ar: 'وجهات نظر عالمية', en: 'Global Perspectives' },
  { value: 'Travel & Tourism', ar: 'السفر والسياحة', en: 'Travel & Tourism' },
  { value: 'Environmental Management', ar: 'الإدارة البيئية', en: 'Environmental Management' },
  { value: 'Marine Science', ar: 'العلوم البحرية', en: 'Marine Science' },
  { value: 'Law', ar: 'القانون', en: 'Law' },
  // IGCSE Subjects
  { value: 'IGCSE Arabic', ar: 'اللغة العربية (IGCSE)', en: 'IGCSE Arabic' },
  { value: 'IGCSE English - First Language', ar: 'اللغة الإنجليزية - لغة أولى (IGCSE)', en: 'IGCSE English - First Language' },
  { value: 'IGCSE English - Second Language', ar: 'اللغة الإنجليزية - لغة ثانية (IGCSE)', en: 'IGCSE English - Second Language' },
  { value: 'IGCSE Mathematics', ar: 'الرياضيات (IGCSE)', en: 'IGCSE Mathematics' },
  { value: 'IGCSE Biology', ar: 'الأحياء (IGCSE)', en: 'IGCSE Biology' },
  { value: 'IGCSE Chemistry', ar: 'الكيمياء (IGCSE)', en: 'IGCSE Chemistry' },
  { value: 'IGCSE Physics', ar: 'الفيزياء (IGCSE)', en: 'IGCSE Physics' },
  { value: 'IGCSE Combined Science', ar: 'العلوم المشتركة (IGCSE)', en: 'IGCSE Combined Science' },
  { value: 'IGCSE Business Studies', ar: 'دراسات الأعمال (IGCSE)', en: 'IGCSE Business Studies' },
  { value: 'IGCSE Economics', ar: 'الاقتصاد (IGCSE)', en: 'IGCSE Economics' },
  { value: 'IGCSE Accounting', ar: 'المحاسبة (IGCSE)', en: 'IGCSE Accounting' },
  { value: 'IGCSE ICT', ar: 'تكنولوجيا المعلومات (IGCSE)', en: 'IGCSE ICT' },
  { value: 'IGCSE Computer Science', ar: 'علوم الحاسوب (IGCSE)', en: 'IGCSE Computer Science' },
  { value: 'IGCSE Geography', ar: 'الجغرافيا (IGCSE)', en: 'IGCSE Geography' },
  { value: 'IGCSE History', ar: 'التاريخ (IGCSE)', en: 'IGCSE History' },
  { value: 'IGCSE Global Perspectives', ar: 'وجهات نظر عالمية (IGCSE)', en: 'IGCSE Global Perspectives' },
  { value: 'IGCSE Travel & Tourism', ar: 'السفر والسياحة (IGCSE)', en: 'IGCSE Travel & Tourism' },
  // AS Level Subjects
  { value: 'AS Level Mathematics', ar: 'الرياضيات (AS Level)', en: 'AS Level Mathematics' },
  { value: 'AS Level Biology', ar: 'الأحياء (AS Level)', en: 'AS Level Biology' },
  { value: 'AS Level Chemistry', ar: 'الكيمياء (AS Level)', en: 'AS Level Chemistry' },
  { value: 'AS Level Physics', ar: 'الفيزياء (AS Level)', en: 'AS Level Physics' },
  { value: 'AS Level Business', ar: 'الأعمال (AS Level)', en: 'AS Level Business' },
  { value: 'AS Level Economics', ar: 'الاقتصاد (AS Level)', en: 'AS Level Economics' },
  { value: 'AS Level Computer Science', ar: 'علوم الحاسوب (AS Level)', en: 'AS Level Computer Science' },
  { value: 'AS Level English Language', ar: 'اللغة الإنجليزية (AS Level)', en: 'AS Level English Language' },
  // A Level Subjects
  { value: 'A Level Mathematics', ar: 'الرياضيات (A Level)', en: 'A Level Mathematics' },
  { value: 'A Level Biology', ar: 'الأحياء (A Level)', en: 'A Level Biology' },
  { value: 'A Level Chemistry', ar: 'الكيمياء (A Level)', en: 'A Level Chemistry' },
  { value: 'A Level Physics', ar: 'الفيزياء (A Level)', en: 'A Level Physics' },
  { value: 'A Level Business', ar: 'الأعمال (A Level)', en: 'A Level Business' },
  { value: 'A Level Economics', ar: 'الاقتصاد (A Level)', en: 'A Level Economics' },
  { value: 'A Level Computer Science', ar: 'علوم الحاسوب (A Level)', en: 'A Level Computer Science' },
  { value: 'A Level English Language', ar: 'اللغة الإنجليزية (A Level)', en: 'A Level English Language' },
];

const themesForApp: { [key: string]: { ar: string; en: string; swatchClass: string; ringClass: string } } = {
    default: { ar: 'افتراضي', en: 'Default', swatchClass: 'bg-white', ringClass: 'ring-gray-400' },
    midnight: { ar: 'ليلي', en: 'Midnight', swatchClass: 'bg-gray-800', ringClass: 'ring-gray-600' },
    mint: { ar: 'نعناعي', en: 'Mint', swatchClass: 'bg-emerald-200', ringClass: 'ring-emerald-400' },
    pastel: { ar: 'باستيل', en: 'Pastel', swatchClass: 'bg-rose-200', ringClass: 'ring-rose-400' },
    modernist: { ar: 'عصري', en: 'Modern', swatchClass: 'bg-slate-300', ringClass: 'ring-slate-500' },
    ocean: { ar: 'محيط', en: 'Ocean', swatchClass: 'bg-cyan-200', ringClass: 'ring-cyan-400' },
    sunset: { ar: 'غروب', en: 'Sunset', swatchClass: 'bg-orange-300', ringClass: 'ring-orange-500' },
    navy: { ar: 'بحري', en: 'Navy', swatchClass: 'bg-slate-800', ringClass: 'ring-amber-400' },
    lavender: { ar: 'خزامى', en: 'Lavender', swatchClass: 'bg-purple-300', ringClass: 'ring-purple-500' },
    nature: { ar: 'طبيعة', en: 'Nature', swatchClass: 'bg-stone-200', ringClass: 'ring-emerald-500' },
    candy: { ar: 'حلوى', en: 'Candy', swatchClass: 'bg-pink-200', ringClass: 'ring-pink-400' },
    cyber: { ar: 'سايبر', en: 'Cyber', swatchClass: 'bg-zinc-800', ringClass: 'ring-green-400' },
    vintage: { ar: 'عتيق', en: 'Vintage', swatchClass: 'bg-amber-200', ringClass: 'ring-amber-500' },
};

// Initial state for the form, representing an empty lesson plan
const initialLessonPlan: LessonPlan = {
  academicYear: '2024-2025',
  teacherName: '',
  grade: 'Year 5',
  date: new Date().toLocaleDateString('en-CA'),
  day: '',
  subject: 'Science',
  unit: 'Unit 1: Living Things',
  lessonTitle: 'Lesson 1: The Plant Cell',
  learningOutcomes: '',
  mainResource: '',
  supportingResources: '',
  resources: {
    smartBoard: false,
    worksheet: false,
    presentations: false,
    dataShow: false,
    photoAndCards: false,
    manipulative: false,
    otherResource: false,
    otherResourceText: '',
  },
  strategies: {
    directTeaching: false,
    cooperativeLearning: false,
    problemSolving: false,
    discussion: false,
    learningStation: false,
    modeling: false,
    handsOnActivity: false,
    photo: false,
    software: false,
    brainstorming: false,
    rolePlay: false,
    otherStrategy: false,
    otherStrategyText: '',
  },
  starter: {
    activity: '',
    time: '',
  },
  mainActivities: Array(4).fill({}).map(() => ({
    learningObjective: '',
    teacherStrategy: '',
    studentActivity: '',
    assessment: '',
    time: '',
  })),
  closure: '',
  assignments: '',
  nationalAndEducationalValues: '',
  integration: '',
  selfReflection: '',
};

const mainAbilityHeaders: Record<keyof MainAbility, {ar: string, en: string}> = {
  learningObjective: { ar: 'أهداف التعلم', en: 'Learning Objectives' },
  teacherStrategy: { ar: 'استراتيجيات المعلم التعليمية', en: 'Educational strategies for the teacher' },
  studentActivity: { ar: 'أنشطة الطالب التعلمية', en: 'Student learning activities' },
  assessment: { ar: 'التقويم من أجل التعلم', en: 'Assessment for learning' },
  time: { ar: 'الزمن', en: 'Time' },
};
const mainAbilityKeys: (keyof MainAbility)[] = ['learningObjective', 'teacherStrategy', 'studentActivity', 'assessment', 'time'];

// Helper function to chunk an array into smaller arrays of a specified size.
const chunk = <T,>(arr: T[], size: number): T[][] =>
  Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
    arr.slice(i * size, i * size + size)
  );


const AppContent: React.FC = () => {
  const { user, isAuthenticated, incrementUsage } = useContext(UserContext);
  
  // State for the AI generator inputs
  const [lessonDuration, setLessonDuration] = useState(45);
  const [textbookContent, setTextbookContent] = useState('');
  const [interimTranscript, setInterimTranscript] = useState(''); // New state for live voice feedback
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  
  const [formState, setFormState] = useState<LessonPlan>(initialLessonPlan);

  const [isLoading, setIsLoading] = useState(false);
  const [isExportingWord, setIsExportingWord] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const countdownIntervalRef = useRef<number | null>(null);
  const ocrFileInputRef = useRef<HTMLInputElement>(null);

  const [presentationData, setPresentationData] = useState<Slide[] | null>(null);
  const [generalPptTopic, setGeneralPptTopic] = useState('');
  const [generalPptGrade, setGeneralPptGrade] = useState('');
  const [generalPptText, setGeneralPptText] = useState('');
  const [slideCount, setSlideCount] = useState(7);
  const [generalPptTheme, setGeneralPptTheme] = useState<'default' | 'midnight' | 'mint' | 'pastel' | 'modernist' | 'ocean' | 'sunset' | 'navy' | 'lavender' | 'nature' | 'candy' | 'cyber' | 'vintage'>('default');
  const [liveGenerationProps, setLiveGenerationProps] = useState<{ topic: string; grade: string; slideCount?: number; lang: 'ar' | 'en'; initialTheme: 'default' | 'midnight' | 'mint' | 'pastel' | 'modernist' | 'ocean' | 'sunset' | 'navy' | 'lavender' | 'nature' | 'candy' | 'cyber' | 'vintage'; textToSummarize?: string; lessonPlan?: LessonPlan } | null>(null);
  const [hasSavedPresentation, setHasSavedPresentation] = useState(false);

  const [ocrFile, setOcrFile] = useState<File | null>(null);
  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);
  
  const [isLiveLessonOpen, setIsLiveLessonOpen] = useState(false);

  // Audio Transcription State
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const shouldStopRef = useRef(false);

  const isAr = language === 'ar';
  
  // Derived state for usage limits
  const canGeneratePlan = user?.subscription ? user.subscription.plansUsed < user.subscription.plan.planGenerationLimit : false;


  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  useEffect(() => {
    if (localStorage.getItem('saved_presentation')) {
        setHasSavedPresentation(true);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleNestedInputChange = (category: 'starter', e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [name as keyof LessonPlan['starter']]: value
      }
    }));
  };

  const handleCheckboxChange = (category: 'resources' | 'strategies', e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormState(prev => {
      const newCategoryState = { ...prev[category] };
      (newCategoryState as any)[name] = checked;
  
      if (!checked) {
        if (name === 'otherResource' && 'otherResourceText' in newCategoryState) {
          newCategoryState.otherResourceText = '';
        } else if (name === 'otherStrategy' && 'otherStrategyText' in newCategoryState) {
          newCategoryState.otherStrategyText = '';
        }
      }
      
      return {
        ...prev,
        [category]: newCategoryState,
      };
    });
  };
  
  const handleOtherTextChange = (category: 'resources' | 'strategies', e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const textProp = category === 'resources' ? 'otherResourceText' : 'otherStrategyText';
    const checkProp = category === 'resources' ? 'otherResource' : 'otherStrategy';

    setFormState(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [textProp]: value,
        ...(value && { [checkProp]: true }),
      }
    }));
  };

  const handleMainActivityChange = (index: number, e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const newActivities = formState.mainActivities.map((activity, i) => {
        if (i === index) {
            return { ...activity, [name]: value };
        }
        return activity;
    });
    setFormState(prev => ({ ...prev, mainActivities: newActivities }));
  };
  
  // Smart Assist Handler
  const handleSmartRefine = async (currentText: string, instruction: string) => {
      return await refineText(currentText, instruction, {
          subject: formState.subject || 'General',
          grade: formState.grade || 'General',
          topic: formState.lessonTitle || 'General',
          lang: language
      });
  };

  const handleClearForm = () => {
    setFormState(initialLessonPlan);
    setTextbookContent('');
    setInterimTranscript('');
    setError(null);
  };

  // --- OCR Handler ---
  const handleFileSelectForOcr = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        setOcrFile(file);
        setIsOcrModalOpen(true);
    }
  };

  const handleTextExtracted = (extractedText: string) => {
    setTextbookContent(prev => prev ? `${prev}\n\n${extractedText}` : extractedText);
    setIsOcrModalOpen(false);
    setOcrFile(null);
    if (ocrFileInputRef.current) {
        ocrFileInputRef.current.value = '';
    }
  };
  
  // --- Audio Transcription Handler ---
  const handleStartRecording = () => {
    // STOP RECORDING
    if (isRecording) {
      shouldStopRef.current = true; // Signal intent to stop
      
      // Stop Web Speech API if active
      if (recognitionRef.current) {
        try {
            recognitionRef.current.stop();
        } catch(e) { console.error(e); }
      } 
      
      // Stop MediaRecorder if active
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      
      setIsRecording(false);
      setInterimTranscript('');
      return;
    }

    // START RECORDING
    setError(null);
    shouldStopRef.current = false;
    setInterimTranscript('');
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    // Function to initialize Web Speech API
    const startWebSpeech = () => {
        if (!SpeechRecognition) {
            fallbackToMediaRecorder();
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = language === 'ar' ? 'ar-SA' : 'en-US';
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
           setIsRecording(true);
           setIsTranscribing(false);
        };

        recognition.onresult = (event: any) => {
           let finalChunk = '';
           let interimChunk = '';

           if (typeof event.results === 'undefined') {
               recognition.stop();
               return;
           }

           for (let i = event.resultIndex; i < event.results.length; ++i) {
             const transcript = event.results[i][0].transcript;
             if (event.results[i].isFinal) {
               finalChunk += transcript;
             } else {
               interimChunk += transcript;
             }
           }
           
           if (finalChunk) {
               setTextbookContent(prev => {
                   const prefix = prev ? prev.trim() : '';
                   // Ensure we don't stick words together
                   const spacer = prefix && !['.', ',', '!', '?', '\n'].includes(prefix.slice(-1)) ? ' ' : '';
                   return prefix + spacer + finalChunk.trim();
               });
           }
           setInterimTranscript(interimChunk);
        };

        recognition.onerror = (event: any) => {
           console.warn("Speech Recognition Error:", event.error);
           
           if (event.error === 'no-speech') {
               // Ignore no-speech, let onend restart it
               return;
           }
           
           if (event.error === 'network' || event.error === 'audio-capture' || event.error === 'not-allowed') {
               recognition.stop();
               // Determine if we should fallback or just stop
               if (event.error === 'not-allowed') {
                    shouldStopRef.current = true;
                    setIsRecording(false);
                    setError(isAr ? 'تم رفض الوصول إلى الميكروفون.' : 'Microphone access denied.');
               } else {
                   // Network/Audio errors -> Fallback to Gemini
                   shouldStopRef.current = true;
                   setIsRecording(false);
                   fallbackToMediaRecorder(); 
               }
           }
        };

        recognition.onend = () => {
            // Auto-restart if not manually stopped
            if (!shouldStopRef.current) {
                 try {
                     recognition.start();
                 } catch (e) {
                     // If restart fails, fallback
                     fallbackToMediaRecorder();
                 }
            } else {
                 setIsRecording(false);
                 setInterimTranscript('');
            }
        };

        recognitionRef.current = recognition;
        
        try {
            recognition.start();
        } catch (e) {
            console.error("Failed to start recognition:", e);
            fallbackToMediaRecorder();
        }
    };

    // Main Entry Logic
    if (SpeechRecognition) {
        startWebSpeech();
    } else {
        fallbackToMediaRecorder();
    }
  };

  const fallbackToMediaRecorder = async () => {
     try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        audioChunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };

        mediaRecorderRef.current.onstop = async () => {
          setIsRecording(false);
          setIsTranscribing(true); // Show loading state only for fallback
          
          try {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            const transcribedText = await transcribeAudio(audioBlob);
            setTextbookContent(prev => prev ? `${prev}\n\n${transcribedText}` : transcribedText);
          } catch (err) {
            setError(err instanceof Error ? err.message : (isAr ? 'فشل تحويل الصوت إلى نص.' : 'Failed to transcribe audio.'));
          } finally {
            setIsTranscribing(false);
            stream.getTracks().forEach(track => track.stop());
          }
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
    } catch (err) {
        console.error("Microphone access denied or error:", err);
        setError(isAr ? 'تم رفض الوصول إلى الميكروفون. يرجى تمكين الوصول في إعدادات المتصفح.' : 'Microphone access denied. Please enable it in your browser settings.');
    }
  };


  // --- AI Generation ---

  const handleGenerate = async () => {
    if (!canGeneratePlan) {
        setError(isAr ? 'لقد وصلت إلى الحد الأقصى لإنشاء الخطط لهذا الشهر. يرجى ترقية اشتراكك.' : 'You have reached your plan generation limit for this month. Please upgrade your subscription.');
        return;
    }
    if (!formState.subject || !formState.grade || !formState.lessonTitle || !lessonDuration) {
      setError(isAr ? 'يرجى ملء حقول المساعد: المادة، الصف، موضوع الدرس، ومدة الحصة.' : 'Please fill in AI generator fields: Subject, Grade, Topic, and Duration.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setCountdown(30);

    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    countdownIntervalRef.current = window.setInterval(() => {
        setCountdown(prev => {
            if (prev <= 1) {
                if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
                return 0;
            }
            return prev - 1;
        });
    }, 1000);

    try {
      const plan = await generateLessonPlan(formState.subject, formState.grade, formState.lessonTitle, language, lessonDuration, textbookContent);
      setFormState(prev => ({
        ...plan,
        // Preserve original dropdown selections to prevent UI reset if AI translates keys
        subject: prev.subject,
        grade: prev.grade
      }));
      incrementUsage('plans');
    } catch (err) {
      setError(err instanceof Error ? err.message : (isAr ? 'حدث خطأ غير معروف.' : 'An unknown error occurred.'));
    } finally {
      setIsLoading(false);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      setCountdown(0);
    }
  };

  // --- Generate Presentation ---
  const handleGeneratePPT = async (from: 'plan' | 'topic') => {
    if (!canGeneratePlan) {
        setError(isAr ? 'لقد وصلت إلى الحد الأقصى لإنشاء الخطط لهذا الشهر. يرجى ترقية اشتراكك.' : 'You have reached your plan generation limit for this month. Please upgrade your subscription.');
        return;
    }
    setError(null);
    setLiveGenerationProps(null);

    if (from === 'plan') {
      if (!formState.lessonTitle || formState.mainActivities.every(act => !act.studentActivity)) {
        setError(isAr ? 'يرجى ملء عنوان الدرس ونشاط طالب واحد على الأقل.' : 'Please fill in the lesson title and at least one student activity.');
        return;
      }
      setLiveGenerationProps({
        topic: formState.lessonTitle,
        grade: formState.grade,
        lang: language,
        initialTheme: generalPptTheme,
        lessonPlan: formState,
      });
      incrementUsage('plans');
      setPresentationData(null);
    } else { // from === 'topic'
        if (!generalPptTopic || !generalPptGrade) {
            setError(isAr ? 'يرجى تقديم موضوع وصف لإنشاء العرض.' : 'Please provide a topic and grade to generate.');
            return;
        }
        setLiveGenerationProps({
            topic: generalPptTopic,
            grade: generalPptGrade,
            slideCount: slideCount,
            lang: language,
            initialTheme: generalPptTheme,
            textToSummarize: generalPptText,
        });
        incrementUsage('plans');
        setPresentationData(null);
    }
  };

  const handleLoadSavedPresentation = () => {
    try {
        const savedData = localStorage.getItem('saved_presentation');
        if (savedData) {
            const savedSlides: Slide[] = JSON.parse(savedData);
            setGeneralPptTopic('Loaded Presentation');
            setGeneralPptGrade('Various');
            setPresentationData(savedSlides);
        }
    } catch (error) {
        console.error("Failed to load presentation from local storage", error);
        setError(isAr ? 'لا يمكن تحميل العرض المحفوظ. قد يكون تالفًا.' : "Could not load the saved presentation. It might be corrupted.");
        localStorage.removeItem('saved_presentation');
        setHasSavedPresentation(false);
    }
  };


  const handleExportToWord = async () => {
    setIsExportingWord(true);
    setError(null);
    setExportMessage(null);

    try {
        const FONT_FAMILY = "Amiri";
        const CHECKED = "☑";
        const UNCHECKED = "☐";
        // Increased font sizes
        const BASE_FONT_SIZE = 28; // 14pt
        const HEADER_FONT_SIZE = 36; // 18pt

        const cellMargins = { top: 80, bottom: 80, left: 120, right: 120 };
        const headerCellMargins = { top: 40, bottom: 40, left: 80, right: 80 };

        const cellBorders = {
            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        };

        const noBorders = {
            top: { style: BorderStyle.NONE, size: 0, color: "auto" },
            bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
            left: { style: BorderStyle.NONE, size: 0, color: "auto" },
            right: { style: BorderStyle.NONE, size: 0, color: "auto" },
        };
        
        const createCenteredPara = (text: string, bold = false) => new Paragraph({
            children: [new TextRun({ text, bold, font: FONT_FAMILY, size: bold ? HEADER_FONT_SIZE : BASE_FONT_SIZE })],
            alignment: AlignmentType.CENTER,
            bidirectional: isAr,
        });

        const createHeaderCell = (arText: string, enText: string, colSpan?: number, rowSpan?: number) => {
            return new TableCell({
                children: [
                    createCenteredPara(arText, true),
                    createCenteredPara(enText),
                ],
                shading: { fill: "EAEAEA", type: ShadingType.CLEAR },
                verticalAlign: VerticalAlign.CENTER,
                borders: cellBorders,
                columnSpan: colSpan,
                rowSpan: rowSpan,
                margins: headerCellMargins,
            });
        };

        const createInputCell = (text: string | null | undefined, colSpan?: number, rowSpan?: number) => {
            const safeText = String(text || '');
            return new TableCell({
                children: safeText.split('\n').map(line => new Paragraph({ children: [new TextRun({ text: line, size: BASE_FONT_SIZE, font: FONT_FAMILY })], bidirectional: isAr })),
                verticalAlign: VerticalAlign.TOP,
                borders: cellBorders,
                columnSpan: colSpan,
                rowSpan: rowSpan,
                margins: cellMargins,
            });
        };

        const createCheckboxPara = (checked: boolean, arLabel: string, enLabel: string, otherText?: string) => {
            const children = [
                new TextRun({ text: `${checked ? CHECKED : UNCHECKED} `, size: BASE_FONT_SIZE, font: FONT_FAMILY }),
                new TextRun({ text: arLabel, bold: true, size: BASE_FONT_SIZE, font: FONT_FAMILY }),
                new TextRun({ text: ` ${enLabel}`, size: BASE_FONT_SIZE, font: FONT_FAMILY }),
            ];
            if (otherText) {
                children.push(new TextRun({ text: "  ", size: BASE_FONT_SIZE, font: FONT_FAMILY }));
                children.push(new TextRun({ text: otherText, underline: {}, size: BASE_FONT_SIZE, font: FONT_FAMILY }));
            }
            return new Paragraph({
                children,
                alignment: isAr ? AlignmentType.RIGHT : AlignmentType.LEFT,
                bidirectional: isAr,
            });
        };
        
        const headerTable = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: noBorders,
            columnWidths: [25, 50, 25],
            rows: [
                new TableRow({
                    children: [
                        new TableCell({ borders: noBorders, children: [] }),
                        new TableCell({
                            borders: noBorders,
                            children: [
                                createCenteredPara("Daily Lesson Plan Template", true),
                                createCenteredPara("خطة التحضير اليومية"),
                                new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    bidirectional: isAr,
                                    children: [
                                        new TextRun({ text: isAr ? "" : "Academic Year / ", size: BASE_FONT_SIZE, font: FONT_FAMILY }),
                                        new TextRun({ text: formState.academicYear, size: BASE_FONT_SIZE, font: FONT_FAMILY }),
                                        new TextRun({ text: isAr ? " / العام الأكاديمي" : "", size: BASE_FONT_SIZE, font: FONT_FAMILY }),
                                    ],
                                }),
                            ],
                        }),
                        new TableCell({
                            borders: noBorders,
                            children: [], // Removed ministry text here
                            verticalAlign: VerticalAlign.TOP
                        }),
                    ],
                }),
            ],
        });
        
        const table1 = new Table({
            visuallyRightToLeft: isAr,
            width: { size: 100, type: WidthType.PERCENTAGE },
            columnWidths: [20, 20, 20, 20, 20],
            rows: [
                new TableRow({ children: [
                    createHeaderCell("المادة", "Subject"),
                    createHeaderCell("اليوم", "day"),
                    createHeaderCell("التاريخ", "Date"),
                    createHeaderCell("الصف", "Grade"),
                    createHeaderCell("اسم المعلم", "Teacher's name"),
                ]}),
                new TableRow({ children: [
                    createInputCell(formState.subject),
                    createInputCell(formState.day),
                    createInputCell(formState.date),
                    createInputCell(formState.grade),
                    createInputCell(formState.teacherName),
                ]}),
                 new TableRow({ children: [
                    createHeaderCell("الوحدة / المحور", "Unit / المحور", 3),
                    createHeaderCell("عنوان الدرس", "Lesson", 2),
                ]}),
                new TableRow({ children: [
                    createInputCell(formState.unit, 3),
                    createInputCell(formState.lessonTitle, 2),
                ]}),
            ]
        });

        const table2 = new Table({
            visuallyRightToLeft: isAr,
            width: { size: 100, type: WidthType.PERCENTAGE },
            columnWidths: [50, 25, 25],
            rows: [
                new TableRow({
                    children: [
                        createHeaderCell("نتاجات التعليم", "learning outcomes", 1, 2),
                        createHeaderCell("مصادر التعلم", "learning Resources", 2, 1),
                    ]
                }),
                new TableRow({
                    children: [
                        createHeaderCell("مصدر التعلم الرئيس", "Main Resource"),
                        createHeaderCell("مصادر التعلم المساندة", "Supporting Resources"),
                    ]
                }),
                new TableRow({
                    height: { rule: HeightRule.ATLEAST, value: 1440 }, // 1 inch
                    children: [
                        createInputCell(formState.learningOutcomes),
                        createInputCell(formState.mainResource),
                        createInputCell(formState.supportingResources),
                    ]
                }),
            ]
        });
        
        const table3_resources = new Table({
            visuallyRightToLeft: isAr,
            width: { size: 100, type: WidthType.PERCENTAGE },
            columnWidths: [50, 50],
            rows: [
                new TableRow({ children: [createHeaderCell("الوسائل التعليمية", "Resources", 2)] }),
                ...chunk(resourceOrder, 2).map(rowKeys => new TableRow({
                    children: rowKeys.map(key => new TableCell({
                        borders: cellBorders,
                        margins: cellMargins,
                        children: [createCheckboxPara(
                            formState.resources[key as keyof typeof formState.resources] as boolean,
                            resourceLabels[key].ar,
                            resourceLabels[key].en,
                            key === 'otherResource' ? formState.resources.otherResourceText : undefined
                        )]
                    })).concat(Array(2 - rowKeys.length).fill(null).map(() => new TableCell({borders: cellBorders, children: [new Paragraph('')]})))
                }))
            ]
        });
        
        const table4_strategies = new Table({
            visuallyRightToLeft: isAr,
            width: { size: 100, type: WidthType.PERCENTAGE },
            columnWidths: [25, 25, 25, 25],
            rows: [
                new TableRow({ children: [createHeaderCell("استراتيجيات و أساليب التعليم والتعلم", "Teaching & Learning Strategies", 4)] }),
                ...chunk(strategyOrder, 4).map(rowKeys => new TableRow({
                    children: rowKeys.map(key => new TableCell({
                        borders: cellBorders,
                        margins: cellMargins,
                        children: [createCheckboxPara(
                            formState.strategies[key as keyof typeof formState.strategies] as boolean,
                            strategyLabels[key].ar,
                            strategyLabels[key].en,
                            key === 'otherStrategy' ? formState.strategies.otherStrategyText : undefined
                        )]
                    })).concat(Array(4 - rowKeys.length).fill(null).map(() => new TableCell({borders: cellBorders, children: [new Paragraph('')]})))
                }))
            ]
        });
        
        const table5_starter = new Table({
            visuallyRightToLeft: isAr,
            width: { size: 100, type: WidthType.PERCENTAGE },
            columnWidths: [85, 15],
            rows: [
                new TableRow({ children: [createHeaderCell("التهيئة", "Starter"), createHeaderCell("الزمن", "Time")] }),
                new TableRow({
                    height: { rule: HeightRule.ATLEAST, value: 1440 },
                    children: [createInputCell(formState.starter.activity), createInputCell(formState.starter.time)]
                }),
            ]
        });
        
        const table6_main = new Table({
            visuallyRightToLeft: isAr,
            width: { size: 100, type: WidthType.PERCENTAGE },
            columnWidths: [8, 28, 28, 28, 8],
            rows: [
                new TableRow({ children: [createHeaderCell("أنشطة التعليم والتعلم الأساسية", "Main teaching and learning Activities", 5)] }),
                new TableRow({ children: mainAbilityKeys.map(key => createHeaderCell(mainAbilityHeaders[key].ar, mainAbilityHeaders[key].en)) }),
                ...formState.mainActivities.map((activity, index) => new TableRow({
                    height: { rule: HeightRule.ATLEAST, value: 1440 },
                    children: mainAbilityKeys.map(key => new TableCell({
                         children: (key === 'learningObjective' 
                            ? [new Paragraph({ children: [new TextRun({ text: String(activity[key] || ''), size: BASE_FONT_SIZE, font: FONT_FAMILY })], bidirectional: isAr }), new Paragraph({ children: [new TextRun({ text: String(index + 1), size: BASE_FONT_SIZE, font: FONT_FAMILY })], alignment: AlignmentType.RIGHT })]
                            : String(activity[key] || '').split('\n').map(line => new Paragraph({ children: [new TextRun({ text: line, size: BASE_FONT_SIZE, font: FONT_FAMILY })], bidirectional: isAr }))),
                        borders: cellBorders,
                        verticalAlign: VerticalAlign.TOP,
                        margins: cellMargins,
                    }))
                }))
            ]
        });

        const table7_closure = new Table({
            visuallyRightToLeft: isAr,
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                new TableRow({ children: [createHeaderCell("الغلق الختامي", "Closure")] }),
                new TableRow({ 
                    height: { rule: HeightRule.ATLEAST, value: 1440 },
                    children: [createInputCell(formState.closure)] 
                }),
            ]
        });
        
        const table8_assignments = new Table({
            visuallyRightToLeft: isAr,
            width: { size: 100, type: WidthType.PERCENTAGE },
            columnWidths: [34, 33, 33],
            rows: [
                new TableRow({ children: [createHeaderCell("التعيينات", "Assignments", 3)] }),
                 new TableRow({ 
                    height: { rule: HeightRule.ATLEAST, value: 1440 },
                    children: [createInputCell(formState.assignments, 3)] 
                }),
                new TableRow({ children: [
                    createHeaderCell("تعزيز الهوية الوطنية والقيم التربوية", "Promoting national identity and educational values"),
                    createHeaderCell("الربط بفروع المادة / المواد الأخرى", "Integration"),
                    createHeaderCell("التأمل الذاتي", "Self-Reflection"),
                ]}),
                new TableRow({
                    height: { rule: HeightRule.ATLEAST, value: 2160 }, // 1.5 inches
                    children: [
                    createInputCell(formState.nationalAndEducationalValues),
                    createInputCell(formState.integration),
                    createInputCell(formState.selfReflection),
                ]}),
            ]
        });
        
        const doc = new Document({
             creator: "AI Lesson Plan Generator",
             description: "Daily Lesson Plan",
             styles: { default: { document: { run: { font: FONT_FAMILY, size: BASE_FONT_SIZE } } } },
             sections: [{ 
                properties: {
                    page: {
                        size: { width: 16838, height: 11906, orientation: PageOrientation.LANDSCAPE },
                        margin: { top: 720, right: 720, bottom: 720, left: 720 }, // 0.5 inch margins
                    },
                },
                footers: {
                    default: new Footer({
                        children: [
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: "Powered by Smart Lesson | الدرس الذكي",
                                        color: "888888",
                                        size: 18, // 9pt
                                        font: FONT_FAMILY,
                                    }),
                                ],
                                alignment: AlignmentType.CENTER,
                            }),
                        ],
                    }),
                },
                children: [
                    headerTable,
                    new Paragraph({ spacing: { after: 200 } }),
                    table1, new Paragraph(""), table2, new Paragraph(""), table3_resources, new Paragraph(""), table4_strategies,
                    
                    new Paragraph({ children: [new PageBreak()] }),
                    headerTable,
                    new Paragraph({ spacing: { after: 200 } }),
                    table5_starter, new Paragraph(""), table6_main, new Paragraph(""), table7_closure,
                    
                    new Paragraph({ children: [new PageBreak()] }),
                    headerTable,
                    new Paragraph({ spacing: { after: 200 } }),
                    table8_assignments,
                ]
            }]
        });

        Packer.toBlob(doc).then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "lesson-plan.docx";
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            setExportMessage(isAr ? '✅ تم التحقق من التخطيط. نجح التصدير!' : '✅ Layout validated. Export successful!');
            setTimeout(() => setExportMessage(null), 5000);
        });

    } catch (err) {
        console.error("Error exporting to Word:", err);
        setError(err instanceof Error ? err.message : (isAr ? 'حدث خطأ غير معروف أثناء تصدير Word.' : 'An unknown error occurred during Word export.'));
    } finally {
        setIsExportingWord(false);
    }
  };

  const resourceLabels: Record<string, {ar: string, en: string}> = {
      smartBoard: { ar: "السبورة الذكية", en: "Smart Board" }, 
      worksheet: { ar: "أوراق عمل", en: "Worksheet" }, 
      presentations: { ar: "العروض التقديمية", en: "Presentations" }, 
      dataShow: { ar: "جهاز العرض العلوي", en: "Data Show" }, 
      photoAndCards: { ar: "الصور والبطاقات", en: "Photo and cards" }, 
      manipulative: { ar: "الوسائل التعليمية اليدوية", en: "Manipulative" }, 
      otherResource: {ar: 'أخرى', en: 'Other'}
  };
  const resourceOrder: (keyof LessonPlan['resources'])[] = [
    'smartBoard', 'worksheet', 
    'presentations', 'dataShow',
    'photoAndCards', 'manipulative',
    'otherResource',
  ];

  const strategyLabels: Record<string, {ar: string, en: string}> = {
      directTeaching: { ar: "التعليم المباشر (المحاضرة)", en: "Direct Teaching" }, 
      cooperativeLearning: { ar: "التعلم التعاوني", en: "Cooperative Learning" }, 
      problemSolving: { ar: "حل المشكلات", en: "Problem Solving" }, 
      discussion: { ar: "النقاش", en: "Discussion" }, 
      learningStation: { ar: "محطات التعلم", en: "learning Station" }, 
      modeling: { ar: "التعلم بالنمذجة", en: "Modeling" }, 
      handsOnActivity: { ar: "التعلم بالمحسوسات", en: "Hands on Activity" }, 
      photo: { ar: "التعلم بالصور", en: "Photo" }, 
      software: { ar: "برمجيات تعليمية", en: "Software" }, 
      brainstorming: { ar: "العصف الذهني", en: "Brainstorming" }, 
      rolePlay: { ar: "لعب الأدوار", en: "Role Play" }, 
      otherStrategy: {ar: 'أخرى', en: 'Other'}
  };
  const strategyOrder: (keyof LessonPlan['strategies'])[] = [
    'directTeaching', 'cooperativeLearning', 'problemSolving', 'discussion',
    'learningStation', 'modeling', 'handsOnActivity', 'photo',
    'software', 'brainstorming', 'rolePlay', 'otherStrategy'
  ];

  if (!isAuthenticated) {
    return <AuthModal />;
  }
  
  if (!user?.subscription) {
      return <PricingPage lang={language} />;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8 font-sans">
       {isOcrModalOpen && ocrFile && (
            <OcrModal
                file={ocrFile}
                lang={language}
                onClose={() => {
                    setIsOcrModalOpen(false);
                    setOcrFile(null);
                    if (ocrFileInputRef.current) ocrFileInputRef.current.value = '';
                }}
                onExtract={handleTextExtracted}
            />
        )}
       {presentationData !== null && (
          <PresentationView 
            slides={presentationData} 
            onClose={() => setPresentationData(null)} 
            lang={language} 
            context={{
                topic: generalPptTopic || formState.lessonTitle,
                grade: generalPptGrade || formState.grade,
            }}
          />
        )}
       
       {isLiveLessonOpen && (
            <LiveLessonMode 
                lessonPlan={formState} 
                lang={language} 
                onClose={() => setIsLiveLessonOpen(false)} 
            />
       )}

      <div className="max-w-5xl mx-auto bg-white p-6 rounded-lg shadow-lg printable-area">
        <Header lang={language} academicYear={formState.academicYear} onAcademicYearChange={handleInputChange} />
        
        <main>
          {/* AI Generator Section */}
          <section className="mb-8 p-4 border border-indigo-200 rounded-lg bg-indigo-50 no-print space-y-4">
            <div className="text-center">
                <h2 className="text-xl font-bold text-gray-800">
                  {isAr ? <>
                    <span className="text-indigo-600">AI Assistant</span> / مساعد الذكاء الاصطناعي
                  </> : 'AI Assistant'}
                </h2>
                <p className="text-gray-700 mt-1 text-sm">
                  {isAr ? 'املأ هذه الحقول لإنشاء الخطة آلياً، أو املأ الخطة يدوياً بالأسفل.' : 'Fill this to auto-generate the lesson plan below, or fill the plan manually.'}
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <SelectField
                label={{ ar: 'المادة', en: 'Subject' }}
                lang={language}
                name="subject"
                value={formState.subject}
                onChange={handleInputChange}
                options={subjects}
                ariaRequired={true}
              />
              <SelectField
                label={{ ar: 'الصف', en: 'Grade' }}
                lang={language}
                name="grade"
                value={formState.grade}
                onChange={handleInputChange}
                options={grades}
                ariaRequired={true}
              />
              <InputField
                label={{ ar: 'موضوع الدرس', en: 'Lesson Topic' }}
                lang={language}
                name="lessonTitle"
                value={formState.lessonTitle}
                onChange={handleInputChange}
                placeholder="e.g., The Water Cycle"
                ariaRequired={true}
              />
               <InputField
                label={{ ar: 'مدة الحصة (دقائق)', en: 'Lesson Duration (min)' }}
                lang={language}
                name="ai_duration"
                type="number"
                value={lessonDuration.toString()}
                onChange={(e) => setLessonDuration(Number(e.target.value))}
                ariaRequired={true}
              />
            </div>
            <div className="relative">
                <div className="flex justify-between items-center mb-1">
                    <label htmlFor="ai_textbook" className={`flex items-end text-sm font-semibold text-gray-800 ${isAr ? 'justify-between flex-grow' : 'justify-start'}`}>
                        {isAr ? ( <> <span className="text-gray-700" aria-hidden="true" lang="en">Textbook Content (Optional)</span> <span>محتوى الكتاب المدرسي (اختياري)</span> </> ) : ( <span>Textbook Content (Optional)</span> )}
                    </label>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <input type="file" ref={ocrFileInputRef} onChange={handleFileSelectForOcr} className="hidden" accept="image/png, image/jpeg, application/pdf" aria-label={isAr ? 'رفع ملف لاستخلاص النص' : 'Upload file for text extraction'} />
                      <button onClick={() => ocrFileInputRef.current?.click()} className="text-sm bg-indigo-100 text-indigo-700 font-semibold py-1 px-3 rounded-md hover:bg-indigo-200 transition disabled:opacity-50 disabled:cursor-wait" aria-label={isAr ? 'استخلاص نص من ملف' : 'Extract text from file'}>
                          {isAr ? 'استخلاص نص' : 'Extract Text'}
                      </button>
                      <button
                        onClick={handleStartRecording}
                        disabled={isTranscribing}
                        className={`text-sm font-semibold py-1 px-3 rounded-md transition disabled:opacity-50 disabled:cursor-wait flex items-center gap-1 ${
                          isRecording ? 'bg-red-200 text-red-800 hover:bg-red-300 animate-pulse' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                        }`}
                        aria-label={isRecording ? (isAr ? 'إيقاف التسجيل' : 'Stop Recording') : (isAr ? 'بدء التسجيل' : 'Start Recording')}
                      >
                        {isTranscribing ? (
                          <Spinner className="text-indigo-700 h-4 w-4" />
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4z" />
                            <path fillRule="evenodd" d="M5.5 8.5A.5.5 0 016 9v1a4 4 0 004 4 4 4 0 004-4V9a.5.5 0 011 0v1a5 5 0 01-4.5 4.975V17h2a.5.5 0 010 1h-5a.5.5 0 010-1h2v-2.025A5 5 0 015 10V9a.5.5 0 01.5-.5z" clipRule="evenodd" />
                          </svg>
                        )}
                        {isRecording ? (isAr ? 'جاري الاستماع...' : 'Listening...') : isTranscribing ? (isAr ? 'جاري النسخ...' : 'Transcribing...') : (isAr ? 'طباعة صوتية' : 'Voice Typing')}
                      </button>
                    </div>
                </div>
                <TextArea 
                    label={{ ar: '', en: '' }} 
                    lang={language} 
                    name="ai_textbook" 
                    value={textbookContent + (interimTranscript ? (textbookContent ? ' ' : '') + interimTranscript : '')} 
                    onChange={(e) => setTextbookContent(e.target.value)} 
                    placeholder={isAr ? 'الصق النص ذا الصلة من الكتاب المدرسي هنا أو استخدم زر "طباعة صوتية" للإملاء...' : 'Paste relevant text from the textbook here or use the "Voice Typing" button to dictate...'} 
                    rows={5} 
                />
                 <p className="text-xs text-gray-500 mt-1 px-1">
                    {isAr ? 'للحصول على أفضل النتائج، استخدم ملفات ممسوحة ضوئياً واضحة وعالية الدقة.' : 'For best results, use clear, high-resolution scans.'}
                </p>
             </div>
             <div className="flex flex-col items-center gap-4">
                <span className="text-sm font-medium text-gray-700"> {isAr ? 'Generation Language / لغة الإنشاء' : 'Generation Language'} </span>
                <div role="radiogroup" className="flex items-center p-1 bg-gray-200 rounded-lg">
                    <button role="radio" aria-checked={language === 'en'} onClick={() => setLanguage('en')} className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors duration-200 ease-in-out ${ language === 'en' ? 'bg-[#8A1538] text-white shadow' : 'text-gray-600 hover:bg-gray-300' }`}> English </button>
                    <button role="radio" aria-checked={language === 'ar'} onClick={() => setLanguage('ar')} className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors duration-200 ease-in-out ${ language === 'ar' ? 'bg-[#8A1538] text-white shadow' : 'text-gray-600 hover:bg-gray-300' }`}> العربية </button>
                </div>
            </div>
            <div className="text-center">
              <button onClick={handleGenerate} disabled={isLoading || !canGeneratePlan} aria-label={isLoading ? (isAr ? 'جاري إنشاء خطة الدرس' : 'Generating lesson plan') : (isAr ? 'إنشاء خطة الدرس بالذكاء الاصطناعي' : 'Generate lesson plan with AI')} aria-busy={isLoading} className="w-full md:w-auto bg-[#8A1538] text-white font-bold py-2 px-6 rounded-lg hover:bg-[#73122e] transition-colors duration-200 flex items-center justify-center mx-auto disabled:bg-rose-900 disabled:cursor-not-allowed min-h-[44px]">
                {isLoading ? ( <div className="flex flex-col items-center"> <GeneratingAnimation /> <span className="text-sm font-mono mt-1"> {isAr ? `... جاري الإنشاء (باقي: ${countdown} ثانية)` : `Generating... (${countdown}s left)`} </span> </div> ) : ( !canGeneratePlan ? (isAr ? 'الحد الأقصى للاستخدام' : 'Limit Reached') : (isAr ? 'إنشاء بالذكاء الاصطناعي' : 'Generate with AI') )}
              </button>
              {!canGeneratePlan && <p className="text-xs text-red-600 mt-2">{isAr ? 'يرجى ترقية خطتك لإنشاء المزيد.' : 'Please upgrade your plan to generate more.'}</p>}
            </div>
          </section>

          {error && <div role="alert" aria-live="assertive" className="text-red-600 bg-red-100 p-3 rounded-md text-center mb-6 no-print">{error}</div>}

          {/* Lesson Plan Form Section */}
          <section className="space-y-[-1px]">
            {/* Page 1 */}
            <table className="form-table">
              <tbody>
                <tr>
                  <td className="label-cell"><div>المادة</div><div className="en-label">Subject</div></td>
                  <td className="label-cell"><div>اليوم</div><div className="en-label">day</div></td>
                  <td className="label-cell"><div>التاريخ</div><div className="en-label">Date</div></td>
                  <td className="label-cell"><div>الصف</div><div className="en-label">Grade</div></td>
                  <td className="label-cell"><div>اسم المعلم</div><div className="en-label">Teacher's name</div></td>
                </tr>
                <tr>
                  <td className="input-cell"><input name="subject" value={formState.subject} onChange={handleInputChange} /></td>
                  <td className="input-cell"><input name="day" value={formState.day} onChange={handleInputChange} /></td>
                  <td className="input-cell"><input name="date" type="date" value={formState.date} onChange={handleInputChange} /></td>
                  <td className="input-cell"><input name="grade" value={formState.grade} onChange={handleInputChange} /></td>
                  <td className="input-cell"><input name="teacherName" value={formState.teacherName} onChange={handleInputChange} /></td>
                </tr>
                <tr>
                  <td className="label-cell" colSpan={3}><div>الوحدة / المحور</div><div className="en-label">Unit / المحور</div></td>
                  <td className="label-cell" colSpan={2}><div>عنوان الدرس</div><div className="en-label">Lesson</div></td>
                </tr>
                <tr>
                  <td className="input-cell" colSpan={3}><input name="unit" value={formState.unit} onChange={handleInputChange} /></td>
                  <td className="input-cell" colSpan={2}><input name="lessonTitle" value={formState.lessonTitle} onChange={handleInputChange} /></td>
                </tr>
              </tbody>
            </table>
            
            <table className="form-table">
                <tbody>
                    <tr>
                        <th className="header-cell w-1/2" rowSpan={2}>نتاجات التعليم <br/> learning outcomes</th>
                        <th className="header-cell" colSpan={2}>مصادر التعلم <br/> learning Resources</th>
                    </tr>
                    <tr>
                      <th className="header-cell w-1/4">مصدر التعلم الرئيس <br/> Main Resource</th>
                      <th className="header-cell w-1/4">مصادر التعلم المساندة <br/> Supporting Resources</th>
                    </tr>
                    <tr>
                        <td className="textarea-cell h-24">
                            <TextArea 
                                name="learningOutcomes" 
                                value={formState.learningOutcomes} 
                                onChange={handleInputChange} 
                                onSmartRefine={(inst) => handleSmartRefine(formState.learningOutcomes, inst)} 
                                label={{ar:'', en:''}}
                                lang={language} // Added
                            />
                        </td>
                        <td className="textarea-cell h-24"><textarea name="mainResource" value={formState.mainResource} onChange={handleInputChange} /></td>
                        <td className="textarea-cell h-24"><textarea name="supportingResources" value={formState.supportingResources} onChange={handleInputChange} /></td>
                    </tr>
                </tbody>
            </table>

            <table className="form-table">
              <tbody>
                <tr>
                  <th className="header-cell" colSpan={2}>الوسائل التعليمية <br/> Resources</th>
                </tr>
                {chunk(resourceOrder, 2).map((rowItems, rowIndex) => (
                  <tr key={rowIndex}>
                    {rowItems.map((key) => (
                      <td key={key} className="w-1/2">
                        <Checkbox
                          label={resourceLabels[key]}
                          lang={language}
                          name={key}
                          checked={formState.resources[key as keyof typeof formState.resources] as boolean}
                          onChange={(e) => handleCheckboxChange('resources', e)}
                          {...(key === 'otherResource' && {
                            otherTextName: 'otherResourceText',
                            otherTextValue: formState.resources.otherResourceText,
                            onOtherTextChange: (e) => handleOtherTextChange('resources', e),
                          })}
                        />
                      </td>
                    ))}
                    {Array(2 - rowItems.length).fill(null).map((_, i) => <td key={`pad-${i}`} ></td>)}
                  </tr>
                ))}
              </tbody>
            </table>
            
            <table className="form-table">
              <tbody>
                <tr>
                  <th className="header-cell" colSpan={4}>استراتيجيات و أساليب التعليم والتعلم <br/> Teaching & Learning Strategies</th>
                </tr>
                {chunk(strategyOrder, 4).map((rowItems, rowIndex) => (
                    <tr key={rowIndex}>
                        {rowItems.map(key => (
                            <td key={key} className="w-1/4">
                                <Checkbox
                                  label={strategyLabels[key]}
                                  lang={language}
                                  name={key}
                                  checked={formState.strategies[key as keyof typeof formState.strategies] as boolean}
                                  onChange={(e) => handleCheckboxChange('strategies', e)}
                                  {...(key === 'otherStrategy' && {
                                    otherTextName: 'otherStrategyText',
                                    otherTextValue: formState.strategies.otherStrategyText,
                                    onOtherTextChange: (e) => handleOtherTextChange('strategies', e),
                                  })}
                                />
                            </td>
                        ))}
                        {Array(4 - rowItems.length).fill(null).map((_, i) => <td key={`pad-${i}`} ></td>)}
                    </tr>
                ))}
              </tbody>
            </table>

            <div className="break-after-page"></div>

            {/* Page 2 */}
             <table className="form-table mt-8">
                 <tbody>
                    <tr>
                        <th className="header-cell">التهيئة <br/> Starter</th>
                        <th className="header-cell w-24">الزمن <br/> Time</th>
                    </tr>
                    <tr>
                       <td className="textarea-cell h-24">
                           <TextArea 
                                name="activity" 
                                value={formState.starter.activity} 
                                onChange={(e) => handleNestedInputChange('starter', e)} 
                                onSmartRefine={(inst) => handleSmartRefine(formState.starter.activity, inst)}
                                label={{ar:'', en:''}}
                                lang={language} // Added
                           />
                        </td>
                       <td className="input-cell h-24"><input name="time" value={formState.starter.time} onChange={(e) => handleNestedInputChange('starter', e)} /></td>
                    </tr>
                </tbody>
            </table>

            <table className="form-table">
                <thead>
                    <tr>
                        <th className="header-cell" colSpan={5}>أنشطة التعليم والتعلم الأساسية <br/> Main teaching and learning Activities</th>
                    </tr>
                    <tr>
                        {mainAbilityKeys.map(key => (
                            <th key={key} className={`header-cell ${key === 'time' ? 'w-20' : ''}`}>{mainAbilityHeaders[key].ar}<br/>{mainAbilityHeaders[key].en}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {formState.mainActivities.map((activity, index) => (
                      <tr key={index}>
                          {mainAbilityKeys.map(key => (
                              <td className={`textarea-cell h-28`} key={key}>
                                  {key === 'studentActivity' || key === 'teacherStrategy' || key === 'assessment' ? (
                                      <TextArea 
                                        name={key} 
                                        value={activity[key]} 
                                        onChange={(e) => handleMainActivityChange(index, e)} 
                                        onSmartRefine={(inst) => handleSmartRefine(activity[key], inst)}
                                        label={{ar:'', en:''}}
                                        lang={language} // Added
                                      />
                                  ) : (
                                    <textarea name={key} value={activity[key]} onChange={(e) => handleMainActivityChange(index, e)} />
                                  )}
                              </td>
                          ))}
                      </tr>
                    ))}
                </tbody>
            </table>
             <table className="form-table">
                 <tbody>
                    <tr>
                        <th className="header-cell">الغلق الختامي <br/> Closure</th>
                    </tr>
                    <tr>
                       <td className="textarea-cell h-24">
                           <TextArea 
                                name="closure" 
                                value={formState.closure} 
                                onChange={handleInputChange} 
                                onSmartRefine={(inst) => handleSmartRefine(formState.closure, inst)}
                                label={{ar:'', en:''}}
                                lang={language} // Added
                            />
                       </td>
                    </tr>
                </tbody>
            </table>

            <div className="break-after-page"></div>

            {/* Page 3 */}
            <table className="form-table mt-8">
                <thead>
                  <tr>
                    <th className="header-cell" colSpan={3}>التعيينات</th>
                  </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className="textarea-cell h-24" colSpan={3}>
                            <TextArea 
                                name="assignments" 
                                value={formState.assignments} 
                                onChange={handleInputChange}
                                placeholder={isAr ? "اكتب التعيينات هنا..." : "Write assignments here..."}
                                onSmartRefine={(inst) => handleSmartRefine(formState.assignments, inst)}
                                label={{ar:'', en:''}}
                                lang={language} // Added
                            />
                        </td>
                    </tr>
                    <tr>
                        <th className="header-cell w-1/3">تعزيز الهوية الوطنية والقيم التربوية <br/> Promoting national identity and educational values</th>
                        <th className="header-cell w-1/3">الربط بفروع المادة / المواد الأخرى <br/> Integration</th>
                        <th className="header-cell w-1/3">التأمل الذاتي <br/> Self-Reflection</th>
                    </tr>
                     <tr>
                        <td className="textarea-cell h-32"><textarea name="nationalAndEducationalValues" value={formState.nationalAndEducationalValues} onChange={handleInputChange} /></td>
                        <td className="textarea-cell h-32"><textarea name="integration" value={formState.integration} onChange={handleInputChange} /></td>
                        <td className="textarea-cell h-32"><textarea name="selfReflection" value={formState.selfReflection} onChange={handleInputChange} /></td>
                    </tr>
                </tbody>
            </table>
          </section>
        </main>
      </div>

      <div className={`max-w-5xl mx-auto mt-6 no-print flex items-center ${isAr ? 'justify-start space-x-reverse' : 'justify-end'} space-x-4`}>
        <div>
          {exportMessage && <p className="text-green-600 font-semibold text-sm transition-opacity duration-300">{exportMessage}</p>}
        </div>
        <button onClick={handleClearForm} aria-label={isAr ? 'مسح جميع الحقول في نموذج خطة الدرس' : "Clear all fields in the lesson plan form"} className="bg-gray-500 text-white font-bold py-2 px-5 rounded-lg hover:bg-gray-600 transition duration-200 flex items-center justify-center">
          {isAr ? 'مسح النموذج' : 'Clear Form'}
        </button>
        <button onClick={handleExportToWord} disabled={isExportingWord} aria-label={isAr ? 'تصدير خطة الدرس كملف وورد' : "Export the lesson plan as a Word document"} className="bg-green-700 text-white font-bold py-2 px-5 rounded-lg hover:bg-green-800 transition duration-200 flex items-center justify-center disabled:bg-gray-400">
            {isExportingWord ? <Spinner /> : (isAr ? 'تصدير وورد' : 'Export to Word')}
        </button>
        
        <button 
            onClick={() => setIsLiveLessonOpen(true)}
            className="bg-indigo-600 text-white font-bold py-2 px-5 rounded-lg hover:bg-indigo-700 transition duration-200 flex items-center justify-center gap-2"
        >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
            {isAr ? 'وضع الدرس المباشر' : 'Live Lesson Mode'}
        </button>
      </div>
      
      <div className="max-w-5xl mx-auto mt-12 mb-12 no-print">
         {/* AI Presentation Generator Section */}
         <section className="relative overflow-hidden rounded-3xl bg-slate-900 text-white shadow-2xl border border-slate-700/50 transition-all duration-300 hover:shadow-indigo-500/10">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 z-10"></div>
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
            
            {/* Language Toggle Button */}
            <div className={`absolute top-6 ${isAr ? 'left-6' : 'right-6'} z-20`}>
                 <button
                    onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
                    className="group flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600/50 hover:border-indigo-500/50 text-slate-300 hover:text-white transition-all duration-300 backdrop-blur-md shadow-lg shadow-indigo-500/10"
                 >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                    </svg>
                    <span className="text-sm font-medium">{language === 'ar' ? 'English Interface' : 'واجهة عربية'}</span>
                </button>
            </div>

            <div className="relative z-10 p-6 md:p-10">
                {/* Section Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center p-2 mb-4 bg-indigo-500/10 rounded-full border border-indigo-500/20 backdrop-blur-sm">
                        <span className="px-3 py-0.5 text-xs font-bold text-indigo-300 uppercase tracking-wider">{isAr ? 'جديد' : 'New'}</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-blue-200 mb-2 tracking-tight">
                         {isAr ? 'مولد العروض التقديمية بالذكاء الاصطناعي' : 'AI Presentation Generator'}
                    </h2>
                    <p className="text-slate-400 max-w-2xl mx-auto text-lg">
                        {isAr ? 'حول خطط دروسك إلى عروض تقديمية احترافية في ثوانٍ، أو أنشئ عرضاً جديداً من الصفر.' : 'Turn your lesson plans into professional presentations in seconds, or start from scratch.'}
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 relative">
                    {/* Divider Line for Desktop */}
                    <div className="hidden md:block absolute left-1/2 top-4 bottom-4 w-px bg-gradient-to-b from-transparent via-slate-700 to-transparent transform -translate-x-1/2"></div>

                    {/* Option 1: From Plan */}
                    <div className="group relative p-6 rounded-2xl bg-slate-800/40 border border-slate-700 hover:border-blue-500/50 transition-all duration-300 hover:bg-slate-800/60 flex flex-col h-full">
                         <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <span className="flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                            </span>
                        </div>
                        
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-300">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors">{isAr ? 'من خطة الدرس' : 'From Lesson Plan'}</h3>
                                <div className="flex items-center mt-1">
                                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">{isAr ? 'موصى به' : 'Recommended'}</span>
                                </div>
                            </div>
                        </div>
                        
                        <p className="text-slate-400 mb-8 flex-grow leading-relaxed">
                            {isAr ? 'استخدم البيانات من خطة الدرس التي قمت بإعدادها أعلاه لإنشاء عرض تقديمي متكامل ومتوافق تماماً مع أهدافك.' : 'Use the data from the lesson plan you prepared above to generate a comprehensive presentation perfectly aligned with your goals.'}
                        </p>

                        <button
                            onClick={() => handleGeneratePPT('plan')}
                            disabled={liveGenerationProps !== null || !canGeneratePlan}
                            className="w-full relative overflow-hidden bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-blue-600/20 transition-all duration-300 transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group/btn"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                {!canGeneratePlan ? (isAr ? 'الحد الأقصى للاستخدام' : 'Limit Reached') : (
                                    <>
                                        {isAr ? 'توليد فوري' : 'Instant Generate'}
                                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform duration-300 ${isAr ? 'group-hover/btn:-translate-x-1' : 'group-hover/btn:translate-x-1'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isAr ? "M10 19l-7-7m0 0l7-7m-7 7h18" : "M14 5l7 7m0 0l-7 7m7-7H3"} />
                                        </svg>
                                    </>
                                )}
                            </span>
                             <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-0 bg-white/10 transition-transform duration-300 ease-in-out"></div>
                        </button>
                    </div>

                    {/* Option 2: From Topic */}
                    <div className="group relative p-6 rounded-2xl bg-slate-800/40 border border-slate-700 hover:border-purple-500/50 transition-all duration-300 hover:bg-slate-800/60 flex flex-col h-full">
                         <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform duration-300">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                </svg>
                            </div>
                             <div>
                                <h3 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors">{isAr ? 'من موضوع جديد' : 'From Scratch'}</h3>
                                <p className="text-slate-400 text-xs mt-1">{isAr ? 'أدخل موضوعاً أو نصاً للتخليص' : 'Enter a topic or paste text to summarize'}</p>
                            </div>
                        </div>

                        <div className="space-y-4 mb-6 flex-grow">
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                 <div className="space-y-1">
                                     <label className="text-xs font-semibold text-slate-400 uppercase">{isAr ? 'الموضوع' : 'Topic'}</label>
                                     <input 
                                        type="text" 
                                        value={generalPptTopic}
                                        onChange={(e) => setGeneralPptTopic(e.target.value)}
                                        placeholder={isAr ? 'مثال: الفضاء' : 'e.g., Space'}
                                        className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                     />
                                 </div>
                                  <div className="space-y-1">
                                     <label className="text-xs font-semibold text-slate-400 uppercase">{isAr ? 'الصف' : 'Grade'}</label>
                                     <select 
                                        value={generalPptGrade}
                                        onChange={(e) => setGeneralPptGrade(e.target.value)}
                                        className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                     >
                                         <option value="" disabled>{isAr ? 'اختر...' : 'Select...'}</option>
                                         {grades.map(g => <option key={g} value={g}>{g}</option>)}
                                     </select>
                                 </div>
                             </div>

                             <div className="space-y-1">
                                 <label className="text-xs font-semibold text-slate-400 uppercase">{isAr ? 'لصق نص (اختياري)' : 'Paste Text (Optional)'}</label>
                                 <textarea
                                    value={generalPptText}
                                    onChange={(e) => setGeneralPptText(e.target.value)}
                                    rows={2}
                                    placeholder={isAr ? 'سيلخص الذكاء الاصطناعي هذا النص...' : 'AI will summarize this text...'}
                                    className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                                 />
                             </div>

                             <div className="space-y-1">
                                 <div className="flex justify-between items-center mb-2">
                                     <label className="text-xs font-semibold text-slate-400 uppercase">{isAr ? 'التصميم' : 'Theme'}</label>
                                     <span className="text-xs text-purple-300">{isAr ? themesForApp[generalPptTheme].ar : themesForApp[generalPptTheme].en}</span>
                                 </div>
                                 <div className="flex gap-3 justify-center sm:justify-start">
                                    {Object.entries(themesForApp).map(([key, theme]) => (
                                        <button
                                            key={key}
                                            onClick={() => setGeneralPptTheme(key as any)}
                                            className={`w-8 h-6 rounded-full transition-all duration-200 ${theme.swatchClass} ${generalPptTheme === key ? `ring-2 ring-offset-2 ring-offset-slate-800 scale-110 ${theme.ringClass}` : 'hover:scale-110 hover:opacity-90'}`}
                                            title={isAr ? theme.ar : theme.en}
                                            aria-label={isAr ? `اختر تصميم ${theme.ar}` : `Select ${theme.en} theme`}
                                        />
                                    ))}
                                 </div>
                             </div>
                             
                             <div className="space-y-1">
                                 <label className="text-xs font-semibold text-slate-400 uppercase">{isAr ? 'عدد الشرائح' : 'Slide Count'}</label>
                                 <input 
                                    type="range" 
                                    min="3" 
                                    max="15" 
                                    value={slideCount} 
                                    onChange={(e) => setSlideCount(Number(e.target.value))}
                                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                 />
                                 <div className="flex justify-between text-xs text-slate-500 px-1">
                                     <span>3</span>
                                     <span className="text-white font-bold">{slideCount}</span>
                                     <span>15</span>
                                 </div>
                             </div>
                        </div>

                        <button
                            onClick={() => handleGeneratePPT('topic')}
                            disabled={liveGenerationProps !== null || !canGeneratePlan}
                            className="w-full relative overflow-hidden bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-purple-600/20 transition-all duration-300 transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group/btn"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                {!canGeneratePlan ? (isAr ? 'الحد الأقصى للاستخدام' : 'Limit Reached') : (
                                    <>
                                        {isAr ? 'إنشاء مخصص' : 'Custom Generate'}
                                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform duration-300 ${isAr ? 'group-hover/btn:-translate-x-1' : 'group-hover/btn:translate-x-1'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                    </>
                                )}
                            </span>
                             <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-0 bg-white/10 transition-transform duration-300 ease-in-out"></div>
                        </button>
                    </div>
                </div>
                
                {/* Saved Presentation Bar */}
                 {hasSavedPresentation && (
                    <div className="mt-8 flex justify-center">
                        <button
                            onClick={handleLoadSavedPresentation}
                            className="group flex items-center gap-3 bg-slate-800/80 backdrop-blur hover:bg-slate-700 border border-slate-600 px-6 py-3 rounded-full transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/20 hover:border-indigo-500/50"
                        >
                            <div className="p-1.5 bg-indigo-500/20 rounded-full text-indigo-300 group-hover:text-white group-hover:bg-indigo-500 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
                                    <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <span className="text-slate-300 font-medium group-hover:text-white transition-colors">
                                {isAr ? 'متابعة العمل على العرض المحفوظ' : 'Resume saved presentation'}
                            </span>
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 text-slate-500 group-hover:text-white transition-all ${isAr ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>
        </section>
        
        {/* Image Analyzer Section */}
        <ImageAnalyzer lang={language} />

        {liveGenerationProps && (
            <LivePreviewGenerator 
                key={`${liveGenerationProps.topic}-${liveGenerationProps.grade}`} // Force re-mount on new generation
                {...liveGenerationProps}
                onClose={() => setLiveGenerationProps(null)}
                onEdit={(slides) => {
                    setPresentationData(slides);
                    setLiveGenerationProps(null);
                }}
            />
        )}
      </div>

    </div>
  );
};


const App: React.FC = () => {
    return (
        <UserProvider>
            <AppContent />
        </UserProvider>
    );
};


export default App;
