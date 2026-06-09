import * as React from "react";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        {...props}
        className={`w-full liquid-glass liquid-edge rounded-[14px] px-4 py-3.5 text-[15px] text-white
          placeholder:text-white/25 outline-none focus:border-[#FF4FD8]/50 focus:shadow-glow
          transition-all duration-200 resize-none ${className ?? ""}`}
      />
    );
  }
);
Textarea.displayName = "Textarea";
