import * as React from "react";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        {...props}
        className={`w-full liquid-glass liquid-edge rounded-[14px] px-4 py-3.5 text-[15px] text-white
          outline-none focus:border-[#FF4FD8]/50 transition-all duration-200 bg-transparent appearance-none cursor-pointer ${className ?? ""}`}
      >
        {children}
      </select>
    );
  }
);
Select.displayName = "Select";
