
import React, { useState, useContext } from 'react';
import { UserContext, subscriptionPlans } from '../contexts/UserContext';
import { SubscriptionPlan } from '../types';
import PaymentModal from './PaymentModal';

interface PricingPageProps {
  lang: 'ar' | 'en';
}

const PricingPage: React.FC<PricingPageProps> = ({ lang }) => {
  const { user, logout } = useContext(UserContext);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  const isAr = lang === 'ar';

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    if (plan.id === 'free') {
        // Directly subscribe to free plan
        setSelectedPlan(plan);
    } else {
        setSelectedPlan(plan);
    }
  };
  
  const handleCloseModal = () => {
    setSelectedPlan(null);
  };

  return (
    <>
      <div className="fixed inset-0 bg-gray-100 z-40 flex flex-col items-center justify-center p-4">
        <div className="absolute top-4 right-4">
            <button onClick={logout} className="text-sm font-semibold text-gray-600 hover:text-gray-900">
                {isAr ? 'تسجيل الخروج' : 'Logout'}
            </button>
        </div>
        <div className="w-full max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
            {isAr ? 'اختر الباقة المناسبة لك' : 'Choose Your Package'}
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            {isAr ? `مرحباً ${user?.email}! ابدأ مجاناً أو اشترِ باقة تحضير.` : `Welcome, ${user?.email}! Start for free or purchase a preparation package.`}
          </p>
        </div>
        
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8 w-full max-w-5xl">
          {subscriptionPlans.map((plan) => (
            <div key={plan.id} className={`bg-white rounded-2xl shadow-lg p-8 flex flex-col ${plan.isPopular ? 'border-4 border-indigo-600 relative' : 'border border-gray-200'}`}>
               {plan.isPopular && (
                    <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2">
                        <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-semibold bg-indigo-600 text-white">
                             {isAr ? 'الأكثر مبيعاً' : 'Best Seller'}
                        </span>
                    </div>
                )}
              <h3 className="text-2xl font-semibold text-gray-900">{plan.name[lang]}</h3>
              <p className="mt-4 text-3xl font-extrabold text-gray-900">{plan.price[lang]}</p>
              
              <ul className="mt-8 space-y-4 text-gray-600 flex-grow">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <svg className="flex-shrink-0 w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="ml-3">{feature[lang]}</span>
                  </li>
                ))}
              </ul>
              
              <button
                onClick={() => handleSelectPlan(plan)}
                className={`mt-10 w-full py-3 px-6 rounded-lg font-semibold text-lg transition ${plan.isPopular ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'}`}
              >
                {plan.id === 'free' ? (isAr ? 'ابدأ مجاناً' : 'Get Started') : (isAr ? 'شراء الباقة' : 'Buy Package')}
              </button>
            </div>
          ))}
        </div>
      </div>
      {selectedPlan && (
        <PaymentModal 
            plan={selectedPlan}
            onClose={handleCloseModal}
            lang={lang}
        />
      )}
    </>
  );
};

export default PricingPage;
