import { useFormik } from "formik";
import * as Yup from "yup";
import axios, { AxiosError } from "axios";
import { useNavigate } from "react-router-dom";
import { showToast } from "../../components/ShowToast";
import { sanitizeInput, sanitizeFormValues } from '../../Utils/SantizeInput'; // Add this import

interface ForgotPasswordFormValues {
  email: string;
}

interface ErrorResponse {
  message: string;
  statusCode?: number;
}

const ForgotPassword = () => {
  const navigate = useNavigate();

  const formik = useFormik<ForgotPasswordFormValues>({
    initialValues: {
      email: "",
    },
    validationSchema: Yup.object({
      email: Yup.string()
        .email("Invalid email address")
        .required("Email is required"),
    }),
    onSubmit: async (values, { setSubmitting, resetForm, setFieldError }) => {
      try {
        // Sanitize the email before sending to API
        const sanitizedValues = sanitizeFormValues({ email: values.email });
        
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/forgot-password`,
          sanitizedValues
        );

        if (response.status === 200) {
          // Sanitize the response message before displaying
          showToast(sanitizeInput(response.data.message) || "Reset link sent successfully", "success");
          resetForm();
          setTimeout(() => {
            navigate("/verify-otp", { state: { email: sanitizedValues.email } });
          }, 3000);
        }
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const axiosError = error as AxiosError<ErrorResponse>;
          const errorMessage = sanitizeInput(
            axiosError.response?.data?.message || "An unexpected error occurred"
          );

          if (axiosError.response?.status === 404) {
            setFieldError("email", "No account found with this email");
            showToast(errorMessage, "error");
          } else if (axiosError.response?.status === 429) {
            setFieldError("email", "Too many requests, please try again later");
            showToast(errorMessage, "error");
          } else {
            setFieldError("email", "Failed to send reset link");
            showToast(errorMessage, "error");
          }
        } else {
          const errorMessage = sanitizeInput("An unexpected error occurred");
          showToast(errorMessage, "error");
          console.error("Unexpected error:", error);
        }
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="flex w-full max-w-5xl h-[70vh] shadow-2xl rounded-xl overflow-hidden">
        {/* Form Section */}
        <div className="w-full md:w-1/2 bg-white p-8 md:p-8 overflow-y-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 text-transparent bg-clip-text">
              Legal AI
            </h1>
            <h2 className="mt-4 text-2xl font-semibold text-gray-800">
              Reset Your Password
            </h2>
            <p className="mt-1 text-gray-600 text-sm">
              Enter your email to receive a password reset link
            </p>
          </div>

          <form onSubmit={formik.handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                name="email"
                className={`mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors ${
                  formik.touched.email && formik.errors.email
                    ? "border-red-500"
                    : "当事-gray-300"
                }`}
                placeholder="you@example.com"
                onChange={(e) => {
                  const sanitizedValue = sanitizeInput(e.target.value);
                  formik.setFieldValue("email", sanitizedValue);
                }}
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={formik.isSubmitting}
              className={`w-full bg-gradient-to-r from-purple-600 to-blue-500 text-white py-2 rounded-lg transition-all duration-300 font-medium ${
                formik.isSubmitting
                  ? "opacity-75 cursor-not-allowed"
                  : "hover:from-purple-700 hover:to-blue-600"
              }`}
            >
              {formik.isSubmitting ? (
                <>
                  <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                  Sending...
                </>
              ) : (
                "Send Reset Link"
              )}
            </button>
          </form>

          {/* Back to Login Link */}
          <p className="mt-4 text-center text-sm text-gray-600">
            Remember your password?{" "}
            <a
              href="/login"
              className="text-purple-600 hover:text-purple-800 transition-colors"
              onClick={(e) => {
                e.preventDefault();
                navigate("/login");
              }}
            >
              Sign in
            </a>
          </p>
        </div>

        {/* Right Section - Decorative */}
        <div className="hidden md:flex w-1/2 flex-col justify-between bg-gradient-to-br from-purple-600 via-pink-500 to-blue-500 p-8">
          <div className="text-white">
            <h2 className="text-3xl font-bold tracking-tight">
              Secure Account Recovery
            </h2>
            <p className="mt-2 text-purple-100">
              Get back into your account quickly and safely
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

export default ForgotPassword;