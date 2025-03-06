import { useState, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { showToast } from "../../components/ShowToast";


interface errorResponse {
  status: number;
  message: string;
  details?: {
    [key: string]: string;
  };
}

interface OTPFormValues {
  otp: string;
}

// Custom hook for resend OTP logic
const useResendOTP = (email: string) => {
  const [cooldown, setCooldown] = useState(0);

  const resendOTP = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/auth/resend-otp`, { email });
      showToast("New OTP sent!", "success");
      setCooldown(60);
    } catch (error) {
      showToast("Failed to resend OTP", "error");
    }
  };

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  return { cooldown, resendOTP };
};

// OTP Input Component
const OTPInput = ({ formik }: { formik: any }) => (
  <div className="space-y-2">
    <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
      OTP Code
    </label>
    <div className="relative">
      <input
        id="otp"
        type="text"
        name="otp"
        maxLength={6}
        inputMode="numeric"
        pattern="[0-9]*"
        className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-center tracking-wider ${
          formik.touched.otp && formik.errors.otp
            ? "border-red-400"
            : "border-gray-200 hover:border-gray-300"
        }`}
        placeholder="••••••"
        {...formik.getFieldProps("otp")}
        disabled={formik.isSubmitting}
        onKeyPress={(e) => {
          if (!/[0-9]/.test(e.key)) {
            e.preventDefault();
          }
        }}
        onChange={(e) => {
          const numericValue = e.target.value.replace(/\D/g, '');
          formik.setFieldValue('otp', numericValue);
        }}
      />
    </div>
    {formik.touched.otp && formik.errors.otp && (
      <p className="text-sm text-red-500">{formik.errors.otp}</p>
    )}
  </div>
);

const VerificationOTP = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const email = state?.email || "";
  const { cooldown, resendOTP } = useResendOTP(email);

  const formik = useFormik<OTPFormValues>({
    initialValues: { otp: "" },
    validationSchema: Yup.object({
      otp: Yup.string()
        .matches(/^\d{6}$/, "Must be 6 digits")
        .required("Required"),
    }),
    onSubmit: async (values, { setSubmitting, setFieldError }) => {
      try {
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/verify-otp`, {
          email,
          otp: values.otp,
        });

        if (response.status === 200) {
          showToast("OTP verified!", "success");
          setTimeout(() => navigate("/reset-password", { 
            state: { 
              email,
              resetToken: response.data.resetToken 
            }
          }), 1500);
        }
      } catch (error) {
        if (axios.isAxiosError<errorResponse>(error) && error.response) {
          const { status, message } = error.response.data;
          const errorMessages: { [key: number]: string } = {
            400: "Invalid OTP",
            429: "Too many attempts",
          };
          const errorMessage = errorMessages[status] || message || "Verification failed";
          setFieldError("otp", errorMessage);
          showToast(errorMessage, "error");
        } else {
          showToast("Something went wrong", "error");
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
          <h2 className="mt-2 text-xl font-semibold text-gray-800">Verify OTP</h2>
          <p className="mt-1 text-gray-500 text-sm">
            Enter the 6-digit code sent to {email || "your email"}
          </p>
        </div>

        <form onSubmit={formik.handleSubmit} className="space-y-6">
          <OTPInput formik={formik} />

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
            {formik.isSubmitting ? "Verifying..." : "Verify OTP"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={resendOTP}
            disabled={cooldown > 0 || formik.isSubmitting}
            className="text-indigo-600 hover:text-indigo-800 disabled:text-gray-400 transition-colors"
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend OTP"}
          </button>
        </div>

        <p className="mt-4 text-center text-sm text-gray-600">
          Back to{" "}
          <button
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

export default VerificationOTP;