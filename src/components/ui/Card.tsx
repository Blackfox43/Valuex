import React from "react";

export function Card({ className = "", children, id, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      id={id}
      className={`bg-white border border-slate-200 rounded-xl shadow-sm hover:border-slate-300 transition-all duration-200 text-slate-800 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className = "", children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`p-4 border-b border-slate-100 flex flex-col gap-1 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className = "", children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={`text-base font-bold tracking-tight text-slate-900 ${className}`} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ className = "", children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={`text-xs text-slate-500 font-normal leading-relaxed ${className}`} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ className = "", children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`p-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className = "", children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`p-4 border-t border-slate-100 flex items-center justify-between gap-4 ${className}`} {...props}>
      {children}
    </div>
  );
}
