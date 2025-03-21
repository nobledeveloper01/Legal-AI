import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { showToast } from "../../components/ShowToast";
import { sanitizeInput, sanitizeFormValues } from '../../Utils/SantizeInput'; // Add this import

interface ErrorResponse {
  error?: string;
  message?: string;
}

interface NewPasswordValues {
  password: string;
  confirmPassword: string;
}

const PasswordInput = ({ 
  formik, 
  name, 
  label, 
  placeholder 
}: { 
  formik: any;
  name: string;
  label: string;
  placeholder: string;
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-2">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative">
        <input
          id={name}
          type={showPassword ? "text" : "password"}
          name={name}
          className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
            formik.touched[name] && formik.errors[name]
              ? "border-red-400"
              : "border-gray-200 hover:border-gray-300"
          }`}
          placeholder={placeholder}
          onChange={(e) => {
            const sanitizedValue = sanitizeInput(e.target.value);
            formik.setFieldValue(name, sanitizedValue);
          }}
          onBlur={formik.handleBlur}
          value={formik.values[name]}
          disabled={formik.isSubmitting}
        />
        <button
          type="button"
          className="absolute inset-y-0 right-2 flex items-center"
          onClick={() => setShowPassword(!showPassword)}
        >
          <svg
            className="h-5 w-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {showPassword ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm6 0c0 6-9 9-9 9s-9-3-9-9 9-9 9-9 9 3 9 9z"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c-4.478 0-8.268 2.943-9.543-7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
              />
            )}
          </svg>
        </button>
      </div>
      {formik.touched[name] && formik.errors[name] && (
        <p className="text-sm text-red-500">{formik.errors[name]}</p>
      )}
    </div>
  );
};

const NewPassword = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const email = sanitizeInput(state?.email || ""); // Sanitize email from state
  const resetToken = sanitizeInput(state?.resetToken || ""); // Sanitize resetToken from state

  const formik = useFormik<NewPasswordValues>({
    initialValues: {
      password: "",
      confirmPassword: "",
    },
    validationSchema: Yup.object({
      password: Yup.string()
        .min(8, "Must be at least 8 characters")
        .required("Required"),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref("password")], "Passwords must match")
        .required("Required"),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      try {
        // Sanitize form values before submission
        const sanitizedValues = sanitizeFormValues({
          email,
          password: values.password,
          resetToken,
        });

        const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/reset-password`, sanitizedValues);

        if (response.status === 200) {
          showToast(sanitizeInput(response.data.message) || "Password reset successfully!", "success");
          setTimeout(() => navigate("/login"), 1500);
        }
      } catch (error) {
        if (axios.isAxiosError<ErrorResponse>(error)) {
          const message = sanitizeInput(
            error.response?.data?.message || 
            error.response?.data?.error || 
            "Failed to reset password"
          );
          showToast(message, "error");
        } else {
          showToast(sanitizeInput("Something went wrong"), "error");
        }
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-600">Legal AI</h1>
          <h2 className="mt-2 text-xl font-semibold text-gray-800">Reset Password</h2>
          <p className="mt-1 text-gray-500 text-sm">
            Enter your new password for {email || "your account"}
          </p>
        </div>

        <form onSubmit={formik.handleSubmit} className="space-y-6">
          <PasswordInput
            formik={formik}
            name="password"
            label="New Password"
            placeholder="Enter new password"
          />
          <PasswordInput
            formik={formik}
            name="confirmPassword"
            label="Confirm Password"
            placeholder="Confirm new password"
          />

          <button
            type="submit"
            disabled={formik.isSubmitting}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors flex items-center justify-center gap-2"
          >
            {formik.isSubmitting && (
              <svg
                className="animate-spin h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            )}
            {formik.isSubmitting ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Back to{" "}
          <button
            type="button" // Changed to type="button" since it's not submitting a form
            onClick={() => navigate("/login")}
            className="text-indigo-600 hover:text-indigo-800"
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
};

export default NewPassword;