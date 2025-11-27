
export interface MainAbility {
  learningObjective: string;
  teacherStrategy: string;
  studentActivity: string;
  assessment: string;
  time: string;
}

export interface LessonPlan {
  academicYear: string;
  teacherName: string;
  grade: string;
  date: string;
  day: string;
  subject: string;
  unit: string;
  lessonTitle: string;
  learningOutcomes: string;
  mainResource: string;
  supportingResources: string;
  resources: {
    smartBoard: boolean;
    worksheet: boolean;
    presentations: boolean;
    dataShow: boolean;
    photoAndCards: boolean;
    manipulative: boolean;
    otherResource: boolean;
    otherResourceText: string;
  };
  strategies: {
    directTeaching: boolean;
    cooperativeLearning: boolean;
    problemSolving: boolean;
    discussion: boolean;
    learningStation: boolean;
    modeling: boolean;
    handsOnActivity: boolean;
    photo: boolean;
    software: boolean;
    brainstorming: boolean;
    rolePlay: boolean;
    otherStrategy: boolean;
    otherStrategyText: string;
  };
  starter: {
    activity: string;
    time: string;
  };
  mainActivities: MainAbility[];
  closure: string;
  assignments: string;
  nationalAndEducationalValues: string;
  integration: string;
  selfReflection: string;
}

export interface Slide {
  title: string;
  content: string[];
  speakerNotes: string;
  imageUrl?: string;
  youtubeVideoId?: string;
  imagePrompt?: string;
  isImageLoading?: boolean;
  duration?: number; // Duration in minutes for time management
}

// --- New Types for Authentication & Subscriptions ---

export type SubscriptionTier = 'free' | 'teacher' | 'school';

export interface SubscriptionPlan {
    id: SubscriptionTier;
    name: { ar: string; en: string };
    price: { ar: string; en: string };
    features: { ar: string; en: string }[];
    planGenerationLimit: number;
    presentationDownloadLimit: number;
    isPopular?: boolean;
}

export interface User {
    email: string;
    subscription: {
        plan: SubscriptionPlan;
        plansUsed: number;
        downloadsUsed: number;
        resetDate: string; 
    } | null;
}
