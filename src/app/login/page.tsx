'use client';

import React from 'react';
import { signIn } from 'next-auth/react';
import { ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const handleGoogleLogin = () => {
    signIn('google', { callbackUrl: '/' });
  };

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white flex flex-col justify-center items-center px-4">
      <div className="w-full max-w-md bg-[#171717] border border-[#374151] rounded-2xl p-8 shadow-2xl text-center">
        {/* Brand Icon (Mesmo logo da navbar) */}
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/10">
          <svg
            className="w-9 h-9 text-primary shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
          >
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
            <line x1="12" y1="22.08" x2="12" y2="12"></line>
          </svg>
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Lógica <span className="text-primary">Dinâmica</span>
        </h1>
        <p className="text-gray-400 text-sm mb-8">
          Plataforma Educacional Interativa para Ensino de Lógica Formal
        </p>

        {/* Instructions */}
        <div className="bg-[#1F2937]/50 border border-[#374151]/60 rounded-xl p-4 mb-8 text-left">
          <p className="text-sm text-gray-300">
            Faça login com sua conta do Google para acessar os exercícios e salvar seu progresso.
          </p>
        </div>

        {/* Google Login Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl flex items-center justify-center gap-3 transition-colors shadow-lg shadow-blue-500/20 cursor-pointer"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Entrar com Google</span>
          <ArrowRight className="w-4 h-4 ml-auto opacity-70" />
        </button>
      </div>

  
    </main>
  );
}
