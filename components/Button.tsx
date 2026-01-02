import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  startIcon?: string;
  endIcon?: string;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  startIcon,
  endIcon,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center font-bold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";
  
  const variants = {
    primary: "bg-primary hover:bg-primary-dark text-[#102217] shadow-lg shadow-primary/20 focus:ring-primary",
    secondary: "bg-surface-variant-light dark:bg-surface-variant-dark text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 focus:ring-gray-500",
    danger: "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 focus:ring-red-500",
    ghost: "bg-transparent hover:bg-gray-100 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300 focus:ring-gray-500",
    outline: "bg-transparent border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600 focus:ring-gray-500"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-3 text-sm gap-2",
    lg: "px-6 py-4 text-base gap-3"
  };

  const widthClass = fullWidth ? "w-full" : "";

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <span className="animate-spin material-symbols-outlined text-lg">progress_activity</span>
      )}
      
      {!isLoading && startIcon && (
        <span className="material-symbols-outlined text-lg">{startIcon}</span>
      )}
      
      <span>{children}</span>
      
      {!isLoading && endIcon && (
        <span className="material-symbols-outlined text-lg">{endIcon}</span>
      )}
    </button>
  );
};

export default Button;
