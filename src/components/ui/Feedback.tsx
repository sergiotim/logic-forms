import React from 'react';

type FeedbackType = 'success' | 'error' | 'warning' | null;

interface FeedbackProps {
  type: FeedbackType;
  message: string;
}

export const Feedback: React.FC<FeedbackProps> = ({ type, message }) => {
  if (!type || !message) return null;

  let icon = null;
  let textColorClass = '';

  switch (type) {
    case 'success':
      icon = (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      );
      textColorClass = 'text-success';
      break;
    case 'error':
      icon = (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      );
      textColorClass = 'text-error';
      break;
    case 'warning':
      icon = (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
        </svg>
      );
      textColorClass = 'text-warning';
      break;
  }

  return (
    <div className={`text-sm font-medium flex items-center gap-2 ${textColorClass} transition-opacity duration-300 opacity-100`}>
      {icon}
      <span>{message}</span>
    </div>
  );
};
