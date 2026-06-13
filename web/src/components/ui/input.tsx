import * as React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        {...props}
        className={`w-full liquid-glass liquid-edge rounded-[14px] px-4 py-3 text-[15px] text-white
          placeholder:text-white/25 outline-none focus:border-[#FF4FD8]/50 focus:shadow-glow
          transition-all duration-200 ${className ?? ""}`}
      />
    );
  }
);
Input.displayName = "Input";
