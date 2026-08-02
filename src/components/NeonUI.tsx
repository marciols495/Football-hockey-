import React from 'react';
import { cn } from '../lib/utils';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger';
  children?: React.ReactNode;
};

export function NeonButton({ children, className, variant = 'primary', ...props }: ButtonProps) {
  const baseStyles = "relative px-6 py-3 font-bold uppercase tracking-wider text-white transition-all duration-300 rounded-lg outline-none overflow-hidden group";
  
  const variants = {
    primary: "border-2 border-cyan-400 text-cyan-100 hover:bg-cyan-400 hover:text-gray-900 shadow-[0_0_15px_rgba(34,211,238,0.5)] hover:shadow-[0_0_30px_rgba(34,211,238,0.8)]",
    secondary: "border-2 border-purple-500 text-purple-100 hover:bg-purple-500 hover:text-white shadow-[0_0_15px_rgba(168,85,247,0.5)] hover:shadow-[0_0_30px_rgba(168,85,247,0.8)]",
    danger: "border-2 border-pink-500 text-pink-100 hover:bg-pink-500 hover:text-white shadow-[0_0_15px_rgba(236,72,153,0.5)] hover:shadow-[0_0_30px_rgba(236,72,153,0.8)]"
  };

  return (
    <button className={cn(baseStyles, variants[variant], className)} {...props}>
      <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
      <div className="absolute inset-0 h-full w-full bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300 ease-out z-0"></div>
    </button>
  );
}

export function NeonTitle({ text, className }: { text: string; className?: string }) {
  return (
    <h1 className={cn("text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 drop-shadow-[0_0_25px_rgba(34,211,238,0.8)] tracking-tighter uppercase", className)}>
      {text}
    </h1>
  );
}
