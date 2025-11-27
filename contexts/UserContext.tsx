
import React, { createContext, useState, useEffect } from 'react';
import { User, SubscriptionPlan, SubscriptionTier } from '../types';

interface UserContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (email: string) => void;
    logout: () => void;
    subscribe: (plan: SubscriptionPlan) => void;
    incrementUsage: (type: 'plans' | 'downloads') => void;
    showPricing: () => void;
}

export const UserContext = createContext<UserContextType>({
    user: null,
    isAuthenticated: false,
    login: () => {},
    logout: () => {},
    subscribe: () => {},
    incrementUsage: () => {},
    showPricing: () => {},
});

const getNextResetDate = (): string => {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    return date.toISOString();
}

export const subscriptionPlans: SubscriptionPlan[] = [
    {
        id: 'free',
        name: { ar: 'مجانية', en: 'Free' },
        price: { ar: '0 ر.ق', en: '0 QAR' },
        features: [
            { ar: '2 إنشاءات خطط شهرياً', en: '2 Plan Generations / month' },
            { ar: '2 تنزيلات عروض تقديمية شهرياً', en: '2 Presentation Downloads / month' },
            { ar: 'إنشاء صور AI أساسية', en: 'Basic AI Image Generation' }
        ],
        planGenerationLimit: 2,
        presentationDownloadLimit: 2,
    },
    {
        id: 'teacher',
        name: { ar: 'الباقة الأساسية', en: 'Standard Package' },
        price: { ar: '100 ر.ق / 10 تحضيرات', en: '100 QAR / 10 Preps' },
        features: [
            { ar: 'نظام باقات (10 ريالات للتحضير)', en: 'Package System (10 QAR/Prep)' },
            { ar: '10 تحضيرات كاملة (خطة + عرض)', en: '10 Full Preps (Plan + Slides)' },
            { ar: 'شامل تحليل الصور وتنزيل الملفات', en: 'Includes Image Analysis & Downloads' },
            { ar: 'إنشاء صور AI وتصدير Word/PPTX', en: 'AI Images & Word/PPTX Export' }
        ],
        planGenerationLimit: 10,
        presentationDownloadLimit: 10,
        isPopular: true,
    },
    {
        id: 'school',
        name: { ar: 'باقات المدارس', en: 'School Packages' },
        price: { ar: 'تواصل معنا', en: 'Contact Us' },
        features: [
            { ar: 'باقات مخصصة للمدارس', en: 'Custom School Packages' },
            { ar: 'حسابات متعددة للمعلمين', en: 'Multiple Teacher Accounts' },
            { ar: 'دعم ذو أولوية', en: 'Priority Support' },
            { ar: 'تحليلات وتقارير مخصصة', en: 'Custom Analytics & Reporting' },
        ],
        planGenerationLimit: 9999,
        presentationDownloadLimit: 9999,
    }
];

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        // Check local storage for a saved user session
        try {
            const savedUser = localStorage.getItem('smartLessonUser');
            if (savedUser) {
                const parsedUser: User = JSON.parse(savedUser);
                // Check if the usage period has reset
                if (parsedUser.subscription && new Date() > new Date(parsedUser.subscription.resetDate)) {
                    parsedUser.subscription.plansUsed = 0;
                    parsedUser.subscription.downloadsUsed = 0;
                    parsedUser.subscription.resetDate = getNextResetDate();
                }
                setUser(parsedUser);
                setIsAuthenticated(true);
            }
        } catch (error) {
            console.error("Failed to parse user from localStorage", error);
            localStorage.removeItem('smartLessonUser');
        }
    }, []);

    const saveUser = (updatedUser: User | null) => {
        setUser(updatedUser);
        if (updatedUser) {
            localStorage.setItem('smartLessonUser', JSON.stringify(updatedUser));
        } else {
            localStorage.removeItem('smartLessonUser');
        }
    };

    const login = (email: string) => {
        // In a real app, this would involve an API call. Here we simulate it.
        const newUser: User = {
            email,
            subscription: null, // User starts without a subscription
        };
        saveUser(newUser);
        setIsAuthenticated(true);
    };

    const logout = () => {
        saveUser(null);
        setIsAuthenticated(false);
    };

    const subscribe = (plan: SubscriptionPlan) => {
        if (user) {
            const updatedUser: User = {
                ...user,
                subscription: {
                    plan: plan,
                    plansUsed: 0,
                    downloadsUsed: 0,
                    resetDate: getNextResetDate(),
                },
            };
            saveUser(updatedUser);
        }
    };

    const incrementUsage = (type: 'plans' | 'downloads') => {
        if (user && user.subscription) {
            const updatedSubscription = { ...user.subscription };
            if (type === 'plans') {
                updatedSubscription.plansUsed += 1;
            } else {
                updatedSubscription.downloadsUsed += 1;
            }
            const updatedUser = { ...user, subscription: updatedSubscription };
            saveUser(updatedUser);
        }
    };

    const showPricing = () => {
         if (user) {
            const updatedUser = { ...user, subscription: null };
            saveUser(updatedUser);
        }
    }


    return (
        <UserContext.Provider value={{ user, isAuthenticated, login, logout, subscribe, incrementUsage, showPricing }}>
            {children}
        </UserContext.Provider>
    );
};
