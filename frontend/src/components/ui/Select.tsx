"use client";

import React from "react";

type SelectProps = {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
  className?: string;
};

export function Select({ value, onChange, children, className }: SelectProps) {
  return (
    <select
      value={value}
      onChange={onChange}
      className={
        "w-full rounded-md border border-neutral-700 bg-white px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-neutral-500 " +
        (className ?? "")
      }
    >
      {children}
    </select>
  );
}
