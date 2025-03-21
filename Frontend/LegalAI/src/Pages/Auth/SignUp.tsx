import { useFormik } from "formik";
import * as Yup from "yup";
import { useGoogleLogin } from "@react-oauth/google";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import { useState } from "react";
import { showToast } from "../../components/ShowToast";
import { sanitizeInput, sanitizeFormValues } from '../../Utils/SantizeInput'; // Add this import

interface SignUpFormValues {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface ErrorResponse {
  response?: {
    data?: {
      error?: string;
      message?: string;
    };
  };
  message?: string;
}

const SignUp = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const formik = useFormik<SignUpFormValues>({
    initialValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    validationSchema: Yup.object({
      fullName: Yup.string()
        .min(2, "Name must be at least 2 characters")
        .max(50, "Name must be 50 characters or less")
        .required("Full name is required"),
      email: Yup.string()
        .email("Invalid email address")
        .required("Email is required"),
      password: Yup.string()
        .min(6, "Password must be at least 6 characters")
        .required("Password is required"),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref("password")], "Passwords must match")
        .required("Please confirm your password"),
    }),
    onSubmit: async (values) => {
      setIsLoading(true);
      // Sanitize form values before submission
      const sanitizedValues = sanitizeFormValues({
        name: values.fullName,
        email: values.email,
        password: values.password,
      });
      try {
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/register`,
          sanitizedValues
        );
        const { message } = response.data;

        showToast(sanitizeInput(message) || "Signup successful", "success");
        navigate("/login");
      } catch (error: unknown) {
        const typedError = error as ErrorResponse;
        const errorMessage = sanitizeInput(
          typedError.response?.data?.error ||
          typedError.response?.data?.message ||
          typedError.message ||
          "Signup failed"
        );
        
        console.error("Signup Error:", errorMessage);
        showToast(errorMessage, "error");
        formik.setErrors({ email: errorMessage });
      } finally {
        setIsLoading(false);
      }
    },
  });

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      try {
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/google-login`,
          {
            googleToken: sanitizeInput(tokenResponse.access_token),
          }
        );

        const { token, user } = response.data;

        // Sanitize token and user data before storing
        const sanitizedToken = sanitizeInput(token);
        const sanitizedUser = sanitizeFormValues(user);

        Cookies.set("token", sanitizedToken, {
          expires: 7,
          secure: true,
          sameSite: "Strict",
        });
        Cookies.set("user", JSON.stringify(sanitizedUser), {
          expires: 7,
          secure: true,
          sameSite: "Strict",
        });

        showToast(sanitizeInput(response.data.message) || "Google signup successful!", "success");
        navigate("/AccDashboard");
      } catch (error: unknown) {
        const typedError = error as ErrorResponse;
        const errorMessage = sanitizeInput(
          typedError.response?.data?.error ||
          typedError.message ||
          "Google signup failed"
        );
        
        console.error("Google Signup Error:", errorMessage);
        showToast(errorMessage, "error");
        formik.setErrors({ email: errorMessage });
      } finally {
        setIsLoading(false);
      }
    },
    onError: (error) => {
      const errorMessage = sanitizeInput(error.message || "Google signup failed");
      console.error("Google Sign Up Failed:", errorMessage);
      showToast(errorMessage, "error");
      formik.setErrors({ email: errorMessage });
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="flex w-full max-w-5xl shadow-2xl rounded-xl overflow-hidden">
        <div className="w-full md:w-1/2 bg-white p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 text-transparent bg-clip-text">
              Legal AI
            </h1>
            <h2 className="mt-4 text-2xl font-semibold text-gray-800">
              Create Your Account
            </h2>
            <p className="mt-1 text-gray-600 text-sm">
              Join us to get started
            </p>
          </div>

          <form onSubmit={formik.handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                type="text"
                name="fullName"
                className={`mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors ${
                  formik.touched.fullName && formik.errors.fullName
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                placeholder="John Doe"
                onChange={(e) => {
                  const sanitizedValue = sanitizeInput(e.target.value);
                  formik.setFieldValue("fullName", sanitizedValue);
                }}
                onBlur={formik.handleBlur}
                value={formik.values.fullName}
                disabled={isLoading}
              />
              {formik.touched.fullName && formik.errors.fullName && (
                <p className="mt-1 text-sm text-red-500">
                  {formik.errors.fullName}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                name="email"
                className={`mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors ${
                  formik.touched.email && formik.errors.email
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                placeholder="you@example.com"
                onChange={(e) => {
                  const sanitizedValue = sanitizeInput(e.target.value);
                  formik.setFieldValue("email", sanitizedValue);
                }}
                onBlur={formik.handleBlur}
                value={formik.values.email}
                disabled={isLoading}
              />
              {formik.touched.email && formik.errors.email && (
                <p className="mt-1 text-sm text-red-500">
                  {formik.errors.email}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                name="password"
                className={`mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors ${
                  formik.touched.password && formik.errors.password
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                placeholder="••••••••"
                onChange={(e) => {
                  const sanitizedValue = sanitizeInput(e.target.value);
                  formik.setFieldValue("password", sanitizedValue);
                }}
                onBlur={formik.handleBlur}
                value={formik.values.password}
                disabled={isLoading}
              />
              {formik.touched.password && formik.errors.password && (
                <p className="mt-1 text-sm text-red-500">
                  {formik.errors.password}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                className={`mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors ${
                  formik.touched.confirmPassword && formik.errors.confirmPassword
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                placeholder="••••••••"
                onChange={(e) => {
                  const sanitizedValue = sanitizeInput(e.target.value);
                  formik.setFieldValue("confirmPassword", sanitizedValue);
                }}
                onBlur={formik.handleBlur}
                value={formik.values.confirmPassword}
                disabled={isLoading}
              />
              {formik.touched.confirmPassword && formik.errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-500">
                  {formik.errors.confirmPassword}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-blue-500 text-white py-2 rounded-lg hover:from-purple-700 hover:to-blue-600 transition-all duration-300 font-medium flex items-center justify-center disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                  Signing Up...
                </>
              ) : (
                "Sign Up"
              )}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Or sign up with
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleGoogleLogin()}
              className="w-full flex items-center justify-center gap-2 bg-white py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-all duration-300 text-gray-700 font-medium"
              disabled={isLoading}
            >
              <img
                src="https://www.google.com/favicon.ico"
                alt="Google"
                className="w-5 h-5"
              />
              Sign up with Google
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-purple-600 hover:text-purple-800 transition-colors"
            >
              Sign in here
            </Link>
          </p>
        </div>

        <div className="hidden md:flex w-1/2 flex-col justify-between bg-gradient-to-br from-purple-600 via-pink-500 to-blue-500 p-8">
          <div className="text-white">
            <h2 className="text-3xl font-bold tracking-tight">
              Upload, Organize, Access
            </h2>
            <p className="mt-2 text-purple-100">
              Seamless Document Management for Students
            </p>
          </div>
          <div className="text-sm text-white/80">
            © {new Date().getFullYear()} Legal AI
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;