import { useState } from "react";
import { Link, useNavigate } from "react-router";
import FormAuth from "../../components/templates/FormAuth";
import AuthBrandPanel from "../../components/templates/AuthBrandPanel";
import { saveSession } from "../../lib/auth-storage";
import { register } from "../../services/auth";

const RegisterPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async (data) => {
    setError("");
    setIsSubmitting(true);

    try {
      const response = await register(data);
      saveSession(response.data);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 min-h-screen">
      <AuthBrandPanel />
      <FormAuth
        title="Create an account"
        subtitle="Access your account and manage your preferences"
        fields={[
          {
            name: "name",
            label: "Full Name",
            type: "text",
            placeholder: "Enter your full name",
            required: true,
            autoComplete: "name",
          },
          {
            name: "email",
            label: "Email",
            type: "email",
            placeholder: "Enter your email",
            required: true,
            autoComplete: "email",
          },
          {
            name: "password",
            label: "Password",
            type: "password",
            placeholder: "Enter your password",
            required: true,
            autoComplete: "new-password",
          },
        ]}
        submitLabel="Create Account"
        onSubmit={handleRegister}
        error={error}
        isSubmitting={isSubmitting}
        footer={
          <p className="text-muted-foreground">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-primary underline underline-offset-4"
            >
              Sign in
            </Link>
          </p>
        }
      />
    </div>
  );
};

export default RegisterPage;
