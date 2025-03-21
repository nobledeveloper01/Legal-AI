import { useFormik } from "formik";
import * as Yup from "yup";
import { useGoogleLogin } from "@react-oauth/google";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import { useState } from "react";
import { showToast } from "../../components/ShowToast";
import { sanitizeInput, sanitizeFormValues } from '../../Utils/SantizeInput';

// Define the interface for handling API error responses
interface ErrorResponse {
  response?: {
    data?: {
      error?: string;
      message?: string;
    };
  };
  message?: string;
}

// Define interface for form values
interface LoginFormValues {
  email: string;
  password: string;
  rememberMe: boolean;
}

const Login = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const formik = useFormik<LoginFormValues>({
    initialValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
    validationSchema: Yup.object({
      email: Yup.string()
        .email("Invalid email address")
        .required("Email is required"),
      password: Yup.string()
        .min(6, "Password must be at least 6 characters")
        .required("Password is required"),
    }),
    onSubmit: async (values) => {
      setIsLoading(true);
      // Sanitize form values before submission
      const sanitizedValues = sanitizeFormValues({
        email: values.email,
        password: values.password,
        rememberMe: values.rememberMe,
      });
      try {
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/login`,
          sanitizedValues // Use sanitized values in the API call
        );
        const { token, user } = response.data || {};
        if (!token || !user) throw new Error("Invalid response from server");

        // Sanitize token and user data before storing in cookies
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

        navigate("/AccDashboard");
        showToast(
          sanitizeInput(response.data.message) || "Login successful",
          "success"
        );
      } catch (error) {
        const err = error as ErrorResponse;
        const errorMessage =
          sanitizeInput(
            err.response?.data?.error ||
            err.response?.data?.message ||
            err.message ||
            "Login failed"
          );
        console.error("Login Error:", errorMessage);
        showToast(errorMessage, "error");
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
            googleToken: sanitizeInput(tokenResponse.access_token), // Sanitize Google token
          }
        );

        const { token, user } = response.data;

        // Sanitize token and user data before storing in cookies
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

        navigate("/AccDashboard");
        showToast(
          sanitizeInput(response.data.message) || "Login successful",
          "success"
        );
      } catch (error: unknown) {
        const err = error as ErrorResponse;
        const errorMessage = sanitizeInput(
          err.response?.data?.message || err.message || "Google login failed"
        );
        console.error("Google Login Error:", errorMessage);
        showToast(
          sanitizeInput(err.response?.data?.error) || "Google login failed. Please try again.",
          "error"
        );
      } finally {
        setIsLoading(false);
      }
    },
    onError: (error) => console.error("Google Login Failed:", sanitizeInput(error.message)),
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="flex w-full max-w-5xl shadow-2xl rounded-xl overflow-hidden">
        {/* Left Section - Decorative */}
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

        {/* Right Section - Form */}
        <div className="w-full md:w-1/2 bg-white p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 text-transparent bg-clip-text">
              Legal AI
            </h1>
            <h2 className="mt-4 text-2xl font-semibold text-gray-800">
              Welcome Back!
            </h2>
            <p className="mt-1 text-gray-600 text-sm">
              Sign in to access your account
            </p>
          </div>
          <div className="flex justify-end mb-6">
  <Link to="/">
    <button
      type="button"
      className=" bg-gradient-to-r from-purple-600 to-blue-500 text-white  rounded-lg hover:bg-blue-400 transition-all duration-300 font-medium flex items-center justify-center px-4 py-2"
    >
      Back to Home
    </button>
  </Link>
</div>
          <form onSubmit={formik.handleSubmit} className="space-y-6">
            {/* Email Field */}
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

            {/* Password Field */}
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

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-[12px] md:text-sm">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="rememberMe"
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  onChange={formik.handleChange}
                  checked={formik.values.rememberMe}
                  disabled={isLoading}
                />
                <span className="ml-2 text-gray-700">Remember me</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-purple-600 hover:text-purple-800 transition-colors"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-blue-500 text-white py-2 rounded-lg hover:from-purple-700 hover:to-blue-600 transition-all duration-300 font-medium flex items-center justify-center disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </button>
            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Or sign in with
                </span>
              </div>
            </div>

            {/* Google Sign-In Button */}
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
              Sign in with Google
            </button>
          </form>

          {/* Sign Up Link */}
          <p className="mt-4 text-center text-sm text-gray-600">
            Don’t have an account?{" "}
            <Link
              to="/signup"
              className="text-purple-600 hover:text-purple-800 transition-colors"
            >
              Sign up here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;