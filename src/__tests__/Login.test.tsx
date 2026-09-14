import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import LoginPage from '@/app/login/page';
import { signIn } from 'next-auth/react';

// Mock do next-auth
jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
}), { virtual: true });

describe('Página de Login (/login)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar a marca do projeto e a mensagem de boas-vindas', () => {
    render(<LoginPage />);
    expect(screen.getByRole('heading', { name: /Lógica Dinâmica/i })).toBeInTheDocument();
    expect(screen.getByText(/Faça login com sua conta do Google/i)).toBeInTheDocument();
  });

  it('deve renderizar o botão de login com Google', () => {
    render(<LoginPage />);
    const button = screen.getByRole('button', { name: /Entrar com Google/i });
    expect(button).toBeInTheDocument();
  });

  it('deve chamar a função signIn do next-auth ao clicar no botão de login', () => {
    render(<LoginPage />);
    const button = screen.getByRole('button', { name: /Entrar com Google/i });
    
    fireEvent.click(button);
    
    // Espera que chame o signIn passando 'google' como provider e callbackUrl
    expect(signIn).toHaveBeenCalledWith('google', expect.objectContaining({ callbackUrl: '/' }));
  });
});
