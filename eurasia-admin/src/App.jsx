import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminLogin from "./pages/AdminLogin";
import ProtectedRoute from "./pages/ProtectedRoute";
import Owner from "./pages/Owner";
import Reservations from "./pages/Reservations";
import OrderQueue from "./pages/OrderQueue";
import PaymentTransactions from "./pages/PaymentTransactions";

// Where each role lands after logging in
const HOME_BY_ROLE = {
  owner: "/admin",
  reception: "/reception",
  kitchen: "/kitchen",
  cashier: "/cashier",
};

// "/" sends a logged-in user to their own page instead of the login screen
function HomeRedirect() {
  const role = localStorage.getItem("eurasia_role");
  return <Navigate to={HOME_BY_ROLE[role] || "/login"} replace />;
}

// Someone still logged in who lands on /login goes back to their page
function LoginOrHome() {
  const role = localStorage.getItem("eurasia_role");
  return HOME_BY_ROLE[role] ? <Navigate to={HOME_BY_ROLE[role]} replace /> : <AdminLogin />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<LoginOrHome />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allow={["owner"]}>
              <Owner />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reception"
          element={
            <ProtectedRoute allow={["reception"]}>
              <Reservations />
            </ProtectedRoute>
          }
        />
        <Route
          path="/kitchen"
          element={
            <ProtectedRoute allow={["kitchen"]}>
              <OrderQueue />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cashier"
          element={
            <ProtectedRoute allow={["cashier"]}>
              <PaymentTransactions />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}