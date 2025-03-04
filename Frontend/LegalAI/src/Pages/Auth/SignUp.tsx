import { useFormik } from "formik";
import * as Yup from "yup";
import { useGoogleLogin } from "@react-oauth/google";
import { Link } from "react-router-dom";

interface SignUpFormValues {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// Define type for Google user info response
interface GoogleUserInfo {
  email: string;
  name: string;
  picture?: string;
  sub: string; // Google user ID
}

const SignUp = () => {
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
        .matches(
          /^(?=.*[A-Za-z])(?=.*\d)/,
          "Password must contain at least one letter and one number"
        )
        .required("Password is required"),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref("password")], "Passwords must match")
        .required("Please confirm your password"),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      try {
        console.log("Sign Up Data:", values);
        // Simulate API call
        // const response = await api.signup(values);
        // Handle successful signup
      } catch (error) {
        console.error("Signup error:", error);
        // Optionally set formik errors
        // formik.setFieldError('email', 'Signup failed');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const userInfo = await fetch(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          {
            headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
          }
        );
        
        if (!userInfo.ok) {
          throw new Error("Failed to fetch user info");
        }

        const userData: GoogleUserInfo = await userInfo.json();
        console.log("User Info:", userData);

        // Here you could automatically populate and submit the form
        formik.setValues({
          fullName: userData.name,
          email: userData.email,
          password: "", // You might want to generate a temporary password
          confirmPassword: "",
        });

        // Or handle Google signup separately
        // await api.googleSignup({ googleId: userData.sub, ...userData });
      } catch (error) {
        console.error("Error fetching Google user info:", error);
      }
    },
    onError: (error) => {
      console.error("Google Sign Up Failed:", error);
    },
    onNonOAuthError: (error) => {
      console.error("Google Sign Up Non-OAuth Error:", error);
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="flex w-full max-w-5xl shadow-2xl rounded-xl overflow-hidden">
        {/* Right Section - Signup Form */}
        <div className="w-full md:w-1/2 bg-white p-6 md:p-8">
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
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                name="fullName"
                className={`mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors ${
                  formik.touched.fullName && formik.errors.fullName
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                placeholder="John Doe"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.fullName}
                disabled={formik.isSubmitting}
              />
              {formik.touched.fullName && formik.errors.fullName && (
                <p className="mt-1 text-sm text-red-500">
                  {formik.errors.fullName}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                name="email"
                className={`mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors ${
                  formik.touched.email && formik.errors.email
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                placeholder="you@example.com"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.email}
                disabled={formik.isSubmitting}
              />
              {formik.touched.email && formik.errors.email && (
                <p className="mt-1 text-sm text-red-500">
                  {formik.errors.email}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                name="password"
                className={`mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors ${
                  formik.touched.password && formik.errors.password
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                placeholder="••••••••"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.password}
                disabled={formik.isSubmitting}
              />
              {formik.touched.password && formik.errors.password && (
                <p className="mt-1 text-sm text-red-500">
                  {formik.errors.password}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                className={`mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors ${
                  formik.touched.confirmPassword && formik.errors.confirmPassword
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                placeholder="••••••••"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.confirmPassword}
                disabled={formik.isSubmitting}
              />
              {formik.touched.confirmPassword && formik.errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-500">
                  {formik.errors.confirmPassword}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={formik.isSubmitting}
              className={`w-full bg-gradient-to-r from-purple-600 to-blue-500 text-white py-2 rounded-lg transition-all duration-300 font-medium ${
                formik.isSubmitting 
                  ? "opacity-75 cursor-not-allowed" 
                  : "hover:from-purple-700 hover:to-blue-600"
              }`}
            >
              {formik.isSubmitting ? "Signing Up..." : "Sign Up"}
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
              disabled={formik.isSubmitting}
              className={`w-full flex items-center justify-center gap-2 bg-white py-2 rounded-lg border border-gray-300 transition-all duration-300 text-gray-700 font-medium ${
                formik.isSubmitting 
                  ? "opacity-75 cursor-not-allowed" 
                  : "hover:bg-gray-50"
              }`}
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
              to="/login" // Changed from "/" to "/login" for clarity
              className="text-purple-600 hover:text-purple-800 transition-colors"
            >
              Sign in
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