// ProtectedRoute.tsx
import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";
import { ReactNode } from "react";

// Define interface for decoded token (adjust according to your token structure)
interface DecodedToken {
  exp: number;
  iat?: number;
  [key: string]: any; // Add other expected token properties
}

// Token expiration check function with proper typing
const isTokenExpired = (token: string | undefined): boolean => {
  if (!token) return true;

  try {
    const decoded: DecodedToken = jwtDecode<DecodedToken>(token);
    console.log("Decoded token:", decoded);
    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  } catch (error) {
    console.error("Error decoding token:", error);
    return true;
  }
};

// Define props interface for ProtectedRoute
interface ProtectedRouteProps {
  children: ReactNode;
}

// Protected Route Component with TypeScript
const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const token = Cookies.get("token");

  if (!token || isTokenExpired(token)) {
    Cookies.remove("token");
    Cookies.remove("user");
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};



// AllRoute.tsx
import { Routes, Route } from "react-router-dom";
import Login from "../Pages/Auth/Login";
import SignUp from "../Pages/Auth/SignUp";
import ForgotPassword from "../Pages/Auth/ForgotPassword";
import VerificationOTP from "../Pages/Auth/VerificationOTP";
import NewPassword from "../Pages/Auth/NewPassword";
import DashboardWithNoAcc from "../Pages/Dashboard/DashboardWithNoAcc";
import DashboardWithAcc from "../Pages/Dashboard/DashboardWithAcc";


// Define component type
const AllRoute: React.FC = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<DashboardWithNoAcc />} />
        <Route
          path="/AccDashboard"
          element={
            <ProtectedRoute>
              <DashboardWithAcc />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<VerificationOTP />} />
        <Route path="/reset-password" element={<NewPassword />} />
      </Routes>
    </>
  );
};

export default AllRoute;