
import React, { useState, useEffect, useRef } from 'react';
import { LessonPlan } from '../types';

interface LiveLessonModeProps {
    lessonPlan: LessonPlan;
    lang: 'ar' | 'en';
    onClose: () => void;
}

interface LessonStep {
    id: number;
    title: string;
    subtitle?: string;
    content: string;
    durationMinutes: number;
    type: 'starter' | 'main' | 'closure';
}

const LiveLessonMode: React.FC<LiveLessonModeProps> = ({ lessonPlan, lang, onClose }) => {
    const isAr = lang === 'ar';
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [secondsRemaining, setSecondsRemaining] = useState(0);
    const [isPaused, setIsPaused] = useState(true); // Start paused
    const [steps, setSteps] = useState<LessonStep[]>([]);
    const [totalLessonTime, setTotalLessonTime] = useState(0);
    const [elapsedTime, setElapsedTime] = useState(0);

    // --- Drawing State ---
    const [isDrawing, setIsDrawing] = useState(false);
    const [brushColor, setBrushColor] = useState('#ef4444');
    const [brushSize, setBrushSize] = useState(4);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // --- Audio Helpers ---
    const playAlarm = () => {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
        oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.5);
        
        gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.5);
    };

    const speak = (text: string) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel(); // Stop previous
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = isAr ? 'ar-SA' : 'en-US';
            utterance.rate = 0.9;
            window.speechSynthesis.speak(utterance);
        }
    };

    // --- Parsing Logic ---
    const parseDuration = (timeStr: string): number => {
        if (!timeStr) return 5; // Default
        const match = timeStr.match(/(\d+)/);
        return match ? parseInt(match[1], 10) : 5;
    };

    useEffect(() => {
        // 1. Flatten Lesson Plan into Steps
        const newSteps: LessonStep[] = [];
        let idCounter = 0;

        // Starter
        newSteps.push({
            id: idCounter++,
            title: isAr ? 'التهيئة' : 'Starter',
            content: lessonPlan.starter.activity,
            durationMinutes: parseDuration(lessonPlan.starter.time),
            type: 'starter'
        });

        // Main Activities
        lessonPlan.mainActivities.forEach((act, idx) => {
            newSteps.push({
                id: idCounter++,
                title: isAr ? `النشاط الرئيسي ${idx + 1}` : `Main Activity ${idx + 1}`,
                subtitle: act.teacherStrategy,
                content: act.studentActivity,
                durationMinutes: parseDuration(act.time),
                type: 'main'
            });
        });

        // Closure
        newSteps.push({
            id: idCounter++,
            title: isAr ? 'الغلق الختامي' : 'Closure',
            content: lessonPlan.closure,
            durationMinutes: 5, // Default for closure if not specified
            type: 'closure'
        });

        setSteps(newSteps);
        
        // Calculate Totals
        const total = newSteps.reduce((acc, step) => acc + step.durationMinutes, 0);
        setTotalLessonTime(total * 60);
        
        // Initialize First Step
        if (newSteps.length > 0) {
            setSecondsRemaining(newSteps[0].durationMinutes * 60);
        }

    }, [lessonPlan, isAr]);

    // --- Timer Logic ---
    useEffect(() => {
        let interval: number;
        if (!isPaused) {
            interval = window.setInterval(() => {
                setElapsedTime(prev => prev + 1);
                
                setSecondsRemaining(prev => {
                    if (prev <= 1) {
                        // Time is up for current step
                        handleStepComplete();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isPaused, currentStepIndex, steps]);

    const handleStepComplete = () => {
        setIsPaused(true);
        playAlarm();
        
        const currentStep = steps[currentStepIndex];
        const nextStep = steps[currentStepIndex + 1];
        
        const message = isAr 
            ? `انتهى وقت ${currentStep.title}. ${nextStep ? 'النشاط التالي هو ' + nextStep.title : 'انتهى الدرس'}`
            : `Time is up for ${currentStep.title}. ${nextStep ? 'Next is ' + nextStep.title : 'Lesson complete'}`;
            
        speak(message);
    };

    const handleNext = () => {
        if (currentStepIndex < steps.length - 1) {
            const nextIndex = currentStepIndex + 1;
            setCurrentStepIndex(nextIndex);
            setSecondsRemaining(steps[nextIndex].durationMinutes * 60);
            setIsPaused(false);
            // Clear canvas on step change
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
            if (canvas && ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        } else {
            onClose(); // Finish
        }
    };

    const handlePrev = () => {
        if (currentStepIndex > 0) {
            const prevIndex = currentStepIndex - 1;
            setCurrentStepIndex(prevIndex);
            setSecondsRemaining(steps[prevIndex].durationMinutes * 60);
            setIsPaused(true);
             // Clear canvas on step change
             const canvas = canvasRef.current;
             const ctx = canvas?.getContext('2d');
             if (canvas && ctx) {
                 ctx.clearRect(0, 0, canvas.width, canvas.height);
             }
        }
    };

    // --- Drawing Logic ---
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const handleResize = () => {
            const parent = canvas.parentElement;
            if (parent) {
                canvas.width = parent.clientWidth;
                canvas.height = parent.clientHeight;
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize(); // Initial size

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let drawing = false;

        const getPos = (e: MouseEvent | TouchEvent) => {
            const rect = canvas.getBoundingClientRect();
            let clientX, clientY;
             if ('touches' in e) {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else {
                clientX = (e as MouseEvent).clientX;
                clientY = (e as MouseEvent).clientY;
            }
            return {
                x: clientX - rect.left,
                y: clientY - rect.top
            };
        };

        const start = (e: MouseEvent | TouchEvent) => {
            drawing = true;
            ctx.beginPath();
            const { x, y } = getPos(e);
            ctx.moveTo(x, y);
        };

        const move = (e: MouseEvent | TouchEvent) => {
            if (!drawing) return;
            e.preventDefault();
            const { x, y } = getPos(e);
            ctx.lineTo(x, y);
            ctx.strokeStyle = brushColor;
            ctx.lineWidth = brushSize;
            ctx.lineCap = 'round';
            ctx.stroke();
        };

        const end = () => {
            drawing = false;
            ctx.closePath();
        };

        canvas.addEventListener('mousedown', start);
        canvas.addEventListener('mousemove', move);
        canvas.addEventListener('mouseup', end);
        canvas.addEventListener('mouseout', end);
        canvas.addEventListener('touchstart', start, { passive: false });
        canvas.addEventListener('touchmove', move, { passive: false });
        canvas.addEventListener('touchend', end);

        return () => {
            canvas.removeEventListener('mousedown', start);
            canvas.removeEventListener('mousemove', move);
            canvas.removeEventListener('mouseup', end);
            canvas.removeEventListener('mouseout', end);
            canvas.removeEventListener('touchstart', start);
            canvas.removeEventListener('touchmove', move);
            canvas.removeEventListener('touchend', end);
        };
    }, [isDrawing, brushColor, brushSize]);

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    };

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    if (steps.length === 0) return null;

    const currentStep = steps[currentStepIndex];
    const progress = (elapsedTime / totalLessonTime) * 100;

    return (
        <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col text-white font-sans" dir={isAr ? 'rtl' : 'ltr'}>
            {/* Header */}
            <div className="h-16 border-b border-gray-700 flex items-center justify-between px-6 bg-gray-800 z-20 relative">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold text-indigo-400 flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isPaused ? 'bg-yellow-400' : 'bg-green-400'}`}></span>
                          <span className={`relative inline-flex rounded-full h-3 w-3 ${isPaused ? 'bg-yellow-500' : 'bg-green-500'}`}></span>
                        </span>
                        {isAr ? 'وضع الدرس المباشر' : 'Live Lesson Mode'}
                    </h2>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-full text-gray-400 hover:text-white transition">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1 bg-gray-800 z-20 relative">
                <div className="h-full bg-indigo-500 transition-all duration-1000 ease-linear" style={{ width: `${Math.min(100, progress)}%` }}></div>
            </div>

            {/* Main Content */}
            <div className="flex-grow flex flex-col md:flex-row relative">
                
                {/* Canvas Overlay */}
                <canvas
                    ref={canvasRef}
                    className={`absolute inset-0 z-10 ${isDrawing ? 'cursor-crosshair pointer-events-auto' : 'pointer-events-none'}`}
                />

                {/* Timeline Sidebar */}
                <div className="w-full md:w-1/4 bg-gray-800/50 border-r border-gray-700 p-4 overflow-y-auto hidden md:block z-0">
                    <h3 className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-4">{isAr ? 'جدول الدرس' : 'Timeline'}</h3>
                    <div className="space-y-2">
                        {steps.map((step, idx) => (
                            <div 
                                key={step.id}
                                className={`p-3 rounded-lg border transition-all ${idx === currentStepIndex ? 'bg-indigo-900/50 border-indigo-500 shadow-lg shadow-indigo-500/20' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-sm">{step.title}</span>
                                    <span className="text-xs font-mono bg-black/20 px-1.5 py-0.5 rounded">{step.durationMinutes}m</span>
                                </div>
                                <p className="text-xs opacity-70 truncate">{step.content}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Active Step View */}
                <div className="flex-grow p-6 md:p-12 flex flex-col justify-center items-center relative z-0">
                    
                    {/* Step Type Badge */}
                    <span className={`mb-6 px-4 py-1 rounded-full text-sm font-bold uppercase tracking-widest ${
                        currentStep.type === 'starter' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                        currentStep.type === 'closure' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                        'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    }`}>
                        {currentStep.type.toUpperCase()}
                    </span>

                    <h1 className="text-4xl md:text-6xl font-bold text-center mb-4 leading-tight">
                        {currentStep.title}
                    </h1>
                    
                    {currentStep.subtitle && (
                         <h2 className="text-xl md:text-2xl text-gray-400 mb-8 text-center">{currentStep.subtitle}</h2>
                    )}

                    <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700 max-w-3xl w-full mb-12">
                        <p className="text-xl md:text-2xl leading-relaxed text-center text-gray-200">
                            {currentStep.content}
                        </p>
                    </div>

                    {/* Big Timer */}
                    <div className={`font-mono text-7xl md:text-9xl font-bold mb-12 tracking-tighter transition-colors ${secondsRemaining < 60 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                        {formatTime(secondsRemaining)}
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-6 z-20 relative">
                        <button 
                            onClick={handlePrev}
                            disabled={currentStepIndex === 0}
                            className="p-4 rounded-full bg-gray-800 hover:bg-gray-700 disabled:opacity-30 transition"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${isAr ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        </button>

                        <button 
                            onClick={() => setIsPaused(!isPaused)}
                            className={`p-6 rounded-full shadow-2xl transform hover:scale-105 transition active:scale-95 ${isPaused ? 'bg-green-600 hover:bg-green-500' : 'bg-yellow-500 hover:bg-yellow-400 text-gray-900'}`}
                        >
                            {isPaused ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                            )}
                        </button>

                        <button 
                            onClick={handleNext}
                            className="p-4 rounded-full bg-gray-800 hover:bg-gray-700 transition"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${isAr ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                        </button>
                        
                        {/* Drawing Tools Toggle */}
                        <div className="ml-4 pl-4 border-l border-gray-700 flex gap-2 relative">
                             <button
                                onClick={() => setIsDrawing(!isDrawing)}
                                className={`p-4 rounded-full transition ${isDrawing ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                                title={isAr ? 'قلم' : 'Pen'}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
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
                                            className="w-20 h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                            title="Brush Size"
                                        />
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path d="M10 18a8 8 0 100-16 8 8 0 000 16z" /></svg>
                                    </div>
                                    <div className="w-px h-6 bg-gray-600 mx-1"></div>
                                    <button onClick={clearCanvas} className="p-1 hover:text-red-400 text-gray-300" title={isAr ? 'مسح' : 'Clear Slide'}>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default LiveLessonMode;
