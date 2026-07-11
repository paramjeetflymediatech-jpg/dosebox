'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';

function AuthSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth(); // Just to trigger any possible re-renders if needed, though we rely on localStorage primarily

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    const userStr = searchParams.get('user');

    if (accessToken && refreshToken && userStr) {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', userStr);
      
      // We must reload to force the AuthContext to pick up the new localStorage values immediately,
      // and redirect the user back to the app smoothly.
      window.location.href = '/';
    } else {
      // Missing tokens, redirect home with error
      window.location.href = '/?error=GoogleAuthFailed';
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-xl font-bold text-slate-800">Authenticating...</h2>
        <p className="text-slate-500 mt-2">Please wait while we log you in securely.</p>
      </div>
    </div>
  );
}

export default function AuthSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-16 h-16 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto"></div>
      </div>
    }>
      <AuthSuccessContent />
    </Suspense>
  );
}
