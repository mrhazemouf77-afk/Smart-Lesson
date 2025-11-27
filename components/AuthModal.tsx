
import React, { useState, useContext } from 'react';
import { UserContext } from '../contexts/UserContext';
import Spinner from './Spinner';

const AuthModal: React.FC = () => {
  const { login } = useContext(UserContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginView, setIsLoginView] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter a valid email.');
      return;
    }
    setError('');
    setIsLoading(true);

    // Simulate network delay
    setTimeout(() => {
      login(email);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden bg-gray-900 flex items-center justify-center">
        {/* Dynamic Animated Background */}
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-600 animate-gradient-xy opacity-100"></div>
        
        {/* Floating Blobs for Depth */}
        <div className="absolute top-[10%] left-[10%] w-72 h-72 bg-cyan-400 rounded-full mix-blend-overlay filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute bottom-[10%] right-[10%] w-96 h-96 bg-yellow-300 rounded-full mix-blend-overlay filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

        {/* Split Card Container */}
        <div className="relative z-20 bg-white rounded-3xl shadow-2xl flex flex-col md:flex-row max-w-4xl w-full m-4 overflow-hidden min-h-[600px] transform transition-all">
            
            {/* Left Side: Branding (Dark & Shiny) */}
            <div className="hidden md:flex w-1/2 bg-slate-900 relative items-center justify-center p-12 overflow-hidden">
                {/* Background effects for left panel */}
                <div className="absolute inset-0 bg-gradient-to-b from-slate-800 to-slate-900 z-0"></div>
                
                {/* Rotating Glow/Clock Effect */}
                <div className="absolute w-[600px] h-[600px] bg-[conic-gradient(from_0deg,transparent_0_340deg,rgba(99,102,241,0.4)_360deg)] animate-spin-slow opacity-40 z-0"></div>
                
                <div className="relative z-10 text-center">
                    <div className="mb-6 inline-block relative">
                        <div className="absolute -inset-4 bg-indigo-500 rounded-full blur-lg opacity-20"></div>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-white relative z-10 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                    </div>
                    {/* Increased mb-2 to mb-8 for better spacing */}
                    <h1 className="text-6xl font-black text-white font-cairo mb-8 drop-shadow-lg tracking-tight">الدرس الذكي</h1>
                    <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-cyan-300 font-poppins">Smart Lesson</h2>
                    <p className="mt-6 text-indigo-200 text-base font-medium max-w-xs mx-auto leading-relaxed" dir="ltr">
                        Your AI-powered assistant for creating engaging lesson plans in 3 seconds<span className="inline-block animate-bounce text-cyan-400 font-extrabold">.</span>
                    </p>
                </div>
                
                <div className="absolute bottom-6 text-center w-full text-slate-500 text-xs z-10 font-poppins" dir="ltr">
                    &copy; {new Date().getFullYear()} Smart Lesson.
                </div>
            </div>

            {/* Right Side: Form (White & Clean) */}
            <div className="w-full md:w-1/2 bg-white p-8 md:p-12 flex flex-col justify-center relative" dir="ltr">
                <div className="max-w-sm mx-auto w-full">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-bold text-gray-900 font-poppins mb-2">
                            {isLoginView ? 'Welcome Back' : 'Get Started'}
                        </h2>
                        <p className="text-gray-500 font-medium">
                            {isLoginView ? 'Sign in to access your dashboard.' : 'Create a new account in seconds.'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1.5">
                            <label htmlFor="email" className="block text-sm font-bold text-gray-700 ml-1">Email</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all outline-none font-medium"
                                placeholder="name@school.com"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center ml-1">
                                <label htmlFor="password" className="block text-sm font-bold text-gray-700">Password</label>
                                {isLoginView && <button type="button" className="text-xs font-bold text-indigo-600 hover:text-indigo-800">Forgot?</button>}
                            </div>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all outline-none font-medium"
                                placeholder="••••••••"
                            />
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm font-medium text-center">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 relative overflow-hidden animate-shine-button disabled:opacity-70 disabled:cursor-wait mt-2"
                        >
                           <span className="relative z-10">{isLoading ? <Spinner /> : (isLoginView ? 'Sign In' : 'Create Account')}</span>
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                        <p className="text-gray-600 text-sm mb-2">
                            {isLoginView ? "Don't have an account?" : "Already have an account?"}
                        </p>
                        <button 
                            onClick={() => { setIsLoginView(!isLoginView); setError(''); }} 
                            className="text-indigo-600 font-bold hover:text-purple-600 transition-colors"
                        >
                            {isLoginView ? 'Sign up for free' : 'Log in here'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default AuthModal;
