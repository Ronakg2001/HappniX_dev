import * as React from "react";

export interface ToastProps {
  msg: string;
  type: "error" | "success";
}

export function Toast({ msg, type }: ToastProps) {
  if (!msg) return null;
  return (
    <div className={`rounded-[12px] px-4 py-3 text-[13px] font-medium ${
      type === "error"
        ? "bg-[#FF4FD8]/10 border border-[#FF4FD8]/30 text-[#FF4FD8]"
        : "bg-[#28c840]/10 border border-[#28c840]/30 text-[#28c840]"
    }`}>
      {msg}
    </div>
  );
}
