import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminLogin from "./pages/AdminLogin";
import ForgotPassword from "./pages/ForgotPassword";
import ProtectedRoute from "./pages/ProtectedRoute";
import Owner from "./pages/Owner";
import Reservations from "./pages/Reservations";
import OrderQueue from "./pages/OrderQueue";
import PaymentTransactions from "./pages/PaymentTransactions";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<AdminLogin />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

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