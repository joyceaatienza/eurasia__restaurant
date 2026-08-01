import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, allow }) {
  const role = localStorage.getItem("eurasia_role");

  if (!role) {
    return <Navigate to="/login" replace />;
  }

  if (!allow.includes(role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
}