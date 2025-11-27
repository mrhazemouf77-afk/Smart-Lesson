import React, { useState, useContext } from 'react';
import { UserContext } from '../contexts/UserContext';
import { SubscriptionPlan } from '../types';
import Spinner from './Spinner';

interface PaymentModalProps {
    plan: SubscriptionPlan;
    onClose: () => void;
    lang: 'ar' | 'en';
}

const PaymentModal: React.FC<PaymentModalProps> = ({ plan, onClose, lang }) => {
    const { subscribe } = useContext(UserContext);
    const [isLoading, setIsLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('card');
    
    const isAr = lang === 'ar';

    const handleSubscribe = () => {
        setIsLoading(true);
        // Simulate API call
        setTimeout(() => {
            subscribe(plan);
            setIsLoading(false);
            // onClose will be called by the context update in App.tsx
        }, 1500);
    };
    
    // Automatically subscribe if the plan is free
    React.useEffect(() => {
        if (plan.id === 'free') {
            handleSubscribe();
        }
    }, [plan]);

    if (plan.id === 'free') {
        return (
            <div className="fixed inset-0 bg-gray-900 bg-opacity-75 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg p-8 text-center">
                    <Spinner className="text-indigo-600 h-12 w-12 mx-auto" />
                    <p className="mt-4 text-lg font-semibold text-gray-800">
                        {isAr ? 'جاري إعداد خطتك المجانية...' : 'Setting up your free plan...'}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="p-8">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-900">{isAr ? `إكمال الدفع لخطة ${plan.name.ar}` : `Complete Payment for ${plan.name.en} Plan`}</h2>
                        <p className="mt-2 text-gray-600">{isAr ? 'هذا نموذج دفع تجريبي. لا تدخل أي معلومات حقيقية.' : 'This is a demo payment form. Do not enter real information.'}</p>
                    </div>

                    <div className="mt-8">
                        <div className="mb-6">
                            <h3 className="text-lg font-medium text-gray-800">{isAr ? 'اختر طريقة الدفع' : 'Select Payment Method'}</h3>
                            <div className="mt-2 grid grid-cols-3 gap-4">
                                <button onClick={() => setPaymentMethod('card')} className={`px-4 py-2 rounded-lg border-2 flex items-center justify-center transition ${paymentMethod === 'card' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300'}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H4a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                                </button>
                                <button onClick={() => setPaymentMethod('paypal')} className={`px-4 py-2 rounded-lg border-2 flex items-center justify-center transition ${paymentMethod === 'paypal' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300'}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-800" viewBox="0 0 24 24" fill="currentColor"><path d="M7.383 3.034C7.14 2.45 6.54 2 5.865 2H2.399c-.675 0-1.275.45-1.518 1.034L0 3.818V12c0 1.105.895 2 2 2h4.5c.34 0 .667-.14.895-.385l.105-.115C8.37 12.55 9 11.385 9 10c0-1.105-.895-2-2-2H4.135L4.5 7h3c.552 0 1-.448 1-1s-.448-1-1-1H3.635L4 4h2.865c.17 0 .325.085.42.215L7.383 3.034zM16.383 3.034C16.14 2.45 15.54 2 14.865 2H11.399c-.675 0-1.275.45-1.518 1.034L9 3.818V12c0 1.105.895 2 2 2h4.5c.34 0 .667-.14.895-.385l.105-.115c.87-.95 1.5-2.115 1.5-3.5 0-1.105-.895-2-2-2h-2.865L13.5 7h3c.552 0 1-.448 1-1s-.448-1-1-1h-3.365L13 4h2.865c.17 0 .325.085.42.215l.098-.215zM24 12c0 1.105-.895 2-2 2h-4.5c-.34 0-.667-.14-.895-.385l-.105-.115C15.37 12.55 15 11.385 15 10c0-1.105.895-2 2-2h2.865L19.5 7h-3c-.552 0-1-.448-1-1s.448-1 1-1h3.365L22 4h-2.865c-.17 0-.325-.085-.42-.215L18.617 3.034C18.86 2.45 19.46 2 20.135 2H21a2 2 0 0 1 2 2v8z" /></svg>
                                </button>
                                 <button onClick={() => setPaymentMethod('gpay')} className={`px-4 py-2 rounded-lg border-2 flex items-center justify-center transition ${paymentMethod === 'gpay' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300'}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" viewBox="0 0 24 24" fill="currentColor"><path d="M20.25 8.333H17.5V5.5h-1.667v2.833H13V10h2.833v2.833h1.667V10H20.25z" /><path d="M11.667 12.833c0-2.3-1.867-4.166-4.167-4.166S3.333 10.533 3.333 12.833s1.867 4.167 4.167 4.167S11.667 15.133 11.667 12.833zm-4.167 2.5c-1.383 0-2.5-1.117-2.5-2.5s1.117-2.5 2.5-2.5 2.5 1.117 2.5 2.5-1.117 2.5-2.5 2.5z" /><path d="M7.5 3.333C4.283 3.333 1.667 5.95 1.667 9.167v.433c0 .55.45 1 1 1h9.183c-.083-.333-.133-.667-.133-1C11.717 6.033 9.85 3.633 7.5 3.333z" /><path d="M12.333 18.5v-1.133c0-.55-.45-1-1-1H4.667c.9 2.033 2.933 3.5 5.333 3.5 1.05 0 2.033-.3 2.883-.817A1.652 1.652 0 0 0 12.333 18.5z" /></svg>
                                </button>
                            </div>
                        </div>

                        {paymentMethod === 'card' && (
                            <form className="space-y-4">
                                <div><label htmlFor="card-number" className="sr-only">{isAr ? 'رقم البطاقة' : 'Card Number'}</label><input id="card-number" className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder={isAr ? 'رقم البطاقة' : 'Card Number'} /></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label htmlFor="expiry" className="sr-only">{isAr ? 'تاريخ الانتهاء' : 'Expiry'}</label><input id="expiry" className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="MM / YY" /></div>
                                    <div><label htmlFor="cvc" className="sr-only">CVC</label><input id="cvc" className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="CVC" /></div>
                                </div>
                            </form>
                        )}
                         {paymentMethod !== 'card' && (
                            <div className="text-center p-8 bg-gray-50 rounded-lg">
                                <p className="text-gray-600">{isAr ? `سيتم إعادة توجيهك إلى ${paymentMethod === 'paypal' ? 'PayPal' : 'Google Pay'} لإكمال عملية الشراء.` : `You will be redirected to ${paymentMethod === 'paypal' ? 'PayPal' : 'Google Pay'} to complete your purchase.`}</p>
                            </div>
                         )}

                    </div>

                     <div className="mt-8 px-8 pb-8 flex flex-col items-center">
                        <button
                            onClick={handleSubscribe}
                            disabled={isLoading}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400"
                        >
                            {isLoading ? <Spinner /> : `${isAr ? 'اشترك الآن مقابل' : 'Subscribe Now for'} ${plan.price[lang]}`}
                        </button>
                         <button onClick={onClose} className="mt-4 text-sm font-medium text-gray-600 hover:text-gray-800">{isAr ? 'إلغاء' : 'Cancel'}</button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default PaymentModal;
