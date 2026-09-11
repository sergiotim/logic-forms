import React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'outline' | 'disabled';
  className?: string;
};

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', className = '', children, disabled, ...props }) => {
  const baseClasses = 'px-6 py-2 rounded-md font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 font-sans active:scale-[0.98]';
  
  let variantClasses = '';
  if (disabled || variant === 'disabled') {
    variantClasses = 'bg-border-subtle text-text-muted cursor-not-allowed opacity-70';
  } else if (variant === 'primary') {
    variantClasses = 'bg-primary hover:bg-primary-hover text-white';
  } else if (variant === 'outline') {
    variantClasses = 'bg-transparent border border-border-subtle text-text-main hover:border-primary hover:text-primary';
  }

  return (
    <button 
      className={`${baseClasses} ${variantClasses} ${className}`}
      disabled={disabled || variant === 'disabled'}
      {...props}
    >
      {children}
    </button>
  );
};
