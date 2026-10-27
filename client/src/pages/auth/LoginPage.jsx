import FormAuth from "../../components/templates/FormAuth";
import { Link } from "react-router";

const LoginPage = () => {
  const handleLogin = (data) => {
    console.log("Login data:", data);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 min-h-screen">
      <FormAuth
        title="Welcome Back"
        subtitle="Sign in to your account"
        fields={[
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
            autoComplete: "current-password",
          },
        ]}
        submitLabel="Sign In"
        onSubmit={handleLogin}
        footer={
          <p className="text-muted-foreground">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-primary underline underline-offset-4"
            >
              Sign up
            </Link>
          </p>
        }
      />
      <div className="hidden md:block bg-primary"></div>
    </div>
  );
};

export default LoginPage;
