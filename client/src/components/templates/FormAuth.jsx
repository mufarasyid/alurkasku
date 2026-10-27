import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

const FormAuth = ({
  title,
  subtitle,
  fields = [],
  submitLabel = "Submit",
  onSubmit,
  footer,
}) => {
  const [showPassword, setShowPassword] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    if (onSubmit) {
      onSubmit(data);
    }
  };

  const togglePassword = (name) => {
    setShowPassword((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2">
          {title && <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>}
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map((field) => {
            const isPassword = field.type === "password";
            const inputType = isPassword && showPassword[field.name] ? "text" : field.type || "text";

            return (
              <div key={field.name} className="space-y-2">
                {field.label && (
                  <label htmlFor={field.name} className="text-sm font-medium">
                    {field.label}
                  </label>
                )}
                <div className="relative">
                  <Input
                    id={field.name}
                    name={field.name}
                    type={inputType}
                    placeholder={field.placeholder}
                    required={field.required}
                    autoComplete={field.autoComplete}
                    className={isPassword ? "pr-10" : undefined}
                  />
                  {isPassword && (
                    <button
                      type="button"
                      onClick={() => togglePassword(field.name)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword[field.name] ? "Sembunyikan password" : "Tampilkan password"}
                    >
                      {showPassword[field.name] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          <Button type="submit" className="w-full">
            {submitLabel}
          </Button>
        </form>
        {footer && <div className="text-center text-sm">{footer}</div>}
      </div>
    </div>
  );
};

export default FormAuth;
