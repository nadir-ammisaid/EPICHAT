import React from "react";
import { Eye, EyeOff } from "lucide-react";

interface InputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "size"
> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
  size?: "sm" | "md" | "lg";
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      className = "",
      id,
      fullWidth = true,
      size = "md",
      ...props
    },
    ref,
  ) => {
    const inputId = id || props.name;
    const isPasswordField = props.type === "password";
    const [showPassword, setShowPassword] = React.useState(false);
    const resolvedType = isPasswordField
      ? showPassword
        ? "text"
        : "password"
      : props.type;

    const sizes = {
      sm: "px-2 py-1 text-sm",
      md: "px-3 py-2 text-base",
      lg: "px-4 py-3 text-lg",
    };

    const widthClass = fullWidth ? "w-full" : "";

    return (
      <div className={widthClass}>
        {label && (
          <label htmlFor={inputId} className="mb-1 block text-sm font-medium">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            className={`${widthClass} ${sizes[size]} border-border rounded-md border ${
              error ? "border-error" : ""
            } ${isPasswordField ? "pr-11" : ""} ${className}`}
            {...props}
            type={resolvedType}
          />
          {isPasswordField && (
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="text-muted hover:text-foreground absolute inset-y-0 right-0 flex items-center pr-3"
              aria-label={
                showPassword
                  ? "Masquer le mot de passe"
                  : "Afficher le mot de passe"
              }
              title={showPassword ? "Masquer" : "Afficher"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
        {error && <p className="text-error mt-1 text-sm">{error}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";
