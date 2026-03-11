import React from "react";

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className = "", children, required, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={`mb-1 block text-sm font-medium ${className}`}
        {...props}
      >
        {children}
        {required && <span className="text-error ml-1">*</span>}
      </label>
    );
  },
);

Label.displayName = "Label";
