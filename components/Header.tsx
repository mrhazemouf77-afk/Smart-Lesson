
import React, { useContext } from 'react';
import { UserContext } from '../contexts/UserContext';

interface HeaderProps {
  lang: 'ar' | 'en';
  academicYear: string;
  onAcademicYearChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const Header: React.FC<HeaderProps> = ({ lang, academicYear, onAcademicYearChange }) => {
  const { user, logout, showPricing } = useContext(UserContext);
  const isAr = lang === 'ar';

  const planName = user?.subscription?.plan.name[lang] || '';
  const plansUsed = user?.subscription?.plansUsed ?? 0;
  const planLimit = user?.subscription?.plan.planGenerationLimit ?? 0;
  const downloadsUsed = user?.subscription?.downloadsUsed ?? 0;
  const downloadLimit = user?.subscription?.plan.presentationDownloadLimit ?? 0;


  return (
    <header className="mb-4 no-print">
      <div className="flex justify-between items-start">
        {/* Left Section (User & Plan) */}
        <div className={`w-1/3 ${isAr ? 'text-right' : 'text-left'}`}>
          {user && (
            <div className="text-xs text-gray-600">
                <p className="font-semibold">{user.email}</p>
                <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-full font-bold">{planName}</span>
                    <span className="text-gray-500">{isAr ? 'الخطط' : 'Plans'}: {plansUsed}/{planLimit}</span>
                    <span className="text-gray-500">{isAr ? 'التنزيلات' : 'Downloads'}: {downloadsUsed}/{downloadLimit}</span>
                </div>
                <div className="mt-2">
                     <button onClick={showPricing} className="text-indigo-600 hover:underline text-xs font-semibold mr-3">{isAr ? 'إدارة الاشتراك' : 'Manage Subscription'}</button>
                    <button onClick={logout} className="text-red-600 hover:underline text-xs font-semibold">{isAr ? 'تسجيل الخروج' : 'Logout'}</button>
                </div>
            </div>
          )}
        </div>

        {/* Center Section (Title) */}
        <div className="flex-grow text-center px-4">
          <h1 className="text-xl font-bold text-gray-800">
            Daily Lesson Plan Template
          </h1>
           <h2 className="text-lg font-semibold text-gray-700">
              خطة التحضير اليومية
            </h2>
          <div className="mt-2 text-md text-gray-600 flex items-center justify-center">
             {isAr ? (
                <>
                  <input 
                    name="academicYear"
                    value={academicYear}
                    onChange={onAcademicYearChange}
                    className="w-24 bg-transparent text-center focus:ring-1 focus:ring-indigo-500 rounded-sm"
                  />
                  <span>/ العام الأكاديمي</span>
                </>
             ) : (
                <>
                    <span>Academic Year / </span>
                    <input 
                      name="academicYear"
                      value={academicYear}
                      onChange={onAcademicYearChange}
                      className="w-24 bg-transparent text-center focus:ring-1 focus:ring-indigo-500 rounded-sm"
                    />
                </>
             )}
          </div>
        </div>

        {/* Right Section (Empty now) */}
        <div className={`w-1/3 ${isAr ? 'text-right' : 'text-left'}`}>
        </div>
      </div>
    </header>
  );
};

export default Header;
