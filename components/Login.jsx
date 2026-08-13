// components/Login.jsx
// Thin export so the component name matches the requested deliverable list.
// Renders the shared AuthForm defaulted to login mode (user can still toggle to signup).
"use client";
import AuthForm from "./AuthForm";

export default function Login() {
  return <AuthForm defaultMode="login" />;
}
