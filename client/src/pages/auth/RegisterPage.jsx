import FormAuth from "../../components/templates/FormAuth";
import { Link } from "react-router";

const RegisterPage = () => {
  const handleRegister = (data) => {
    console.log("Register data:", data);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 min-h-screen">
      <div className="hidden md:block bg-primary"></div>
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
