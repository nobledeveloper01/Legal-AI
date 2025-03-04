
import { Routes, Route } from "react-router-dom";
import Login from "../Pages/Auth/Login";
import SignUp from "../Pages/Auth/SignUp";
import ForgotPassword from "../Pages/Auth/ForgotPassword";
import VerificationOTP from "../Pages/Auth/VerificationOTP";
import NewPassword from "../Pages/Auth/NewPassword";
import DashboardWithNoAcc from "../Pages/Dashboard/DashboardWithNoAcc";
import DashboardWithAcc from "../Pages/Dashboard/DashboardWithAcc";

const AllRoute = () => {
  return (
    <>
    <Routes>
    <Route path="/" element={<DashboardWithNoAcc />} />
    <Route path="/AccDashboard" element={<DashboardWithAcc />} />
    <Route path="/login" element={<Login />} />
    <Route path="/signup" element={<SignUp />} />
    <Route path="/forgot-password" element={<ForgotPassword />} />
    <Route path="/verify-otp" element={<VerificationOTP />} />
    <Route path="/reset-password" element={<NewPassword />} />
    </Routes>
    </>
  )
}

export default AllRoute