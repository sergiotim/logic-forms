'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { LogOut, Settings, ChevronDown, User as UserIcon } from 'lucide-react';

export function ProfileMenu() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const user = session?.user;

  // Fecha o menu ao clicar fora dele
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (!user) return null;

  // Extrai o primeiro nome para exibição na navbar
  const firstName = user.name ? user.name.split(' ')[0] : user.email?.split('@')[0];
  const isTeacher = user.role === 'TEACHER';

  return (
    <div className="relative" ref={menuRef}>
      {/* Botão de Trigger do Perfil */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="Menu do usuário"
        className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-full sm:rounded-xl hover:bg-surface border border-transparent hover:border-border-subtle transition-all cursor-pointer text-text-main select-none"
      >
        {/* Foto de Perfil ou Fallback */}
        <div className="w-8 h-8 rounded-full overflow-hidden bg-primary/10 border border-border-subtle flex items-center justify-center shrink-0">
          {user.image ? (
            <img
              src={user.image}
              alt={user.name || 'Foto de Perfil'}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          ) : (
            <UserIcon size={16} className="text-primary" />
          )}
        </div>

        {/* Nome do Usuário no Desktop */}
        <span className="text-sm font-medium hidden sm:inline max-w-[120px] truncate">
          {firstName}
        </span>

        {/* Seta indicativa */}
        <ChevronDown
          size={14}
          className={`text-text-muted transition-transform duration-200 hidden sm:inline ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Menu Suspenso (Dropdown) */}
      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-64 bg-surface border border-border-subtle rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Informações do Usuário */}
          <div className="px-4 py-3 flex items-start gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-primary/10 border border-border-subtle flex items-center justify-center shrink-0 mt-0.5">
              {user.image ? (
                <img
                  src={user.image}
                  alt={user.name || 'Foto de Perfil'}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserIcon size={20} className="text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {user.name || firstName}
              </p>
              <p className="text-xs text-text-muted font-mono truncate" title={user.email || ''}>
                {user.email}
              </p>
              <span
                className={`mt-1.5 inline-block text-[10px] font-mono uppercase px-2 py-0.5 rounded border font-semibold ${
                  isTeacher
                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                }`}
              >
                {isTeacher ? 'Professor' : 'Aluno'}
              </span>
            </div>
          </div>

          <div className="border-t border-border-subtle/60 my-1" />

          {/* Atalho para Modo Editor (Apenas Professores) */}
          {isTeacher && (
            <Link
              href="/editor"
              role="menuitem"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-text-muted hover:text-white hover:bg-white/5 transition-colors"
            >
              <Settings size={16} className="text-primary" />
              <span>Modo Editor</span>
            </Link>
          )}

          {/* Botão de Logout */}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setIsOpen(false);
              signOut({ callbackUrl: '/login' });
            }}
            className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-text-muted hover:text-error hover:bg-error/10 transition-colors cursor-pointer text-left"
          >
            <LogOut size={16} />
            <span>Sair da conta</span>
          </button>
        </div>
      )}
    </div>
  );
}
