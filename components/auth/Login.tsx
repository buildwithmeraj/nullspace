"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

// Define the type for your form data
interface FormData {
  email: string;
  password: string;
}

const Login = () => {
  const { login, loading, startGoogleLogin } = useAuth();
  const router = useRouter();
  // Manage form state
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);

  // A generic change handler for multiple inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Submit handler function
  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevent default page reload
    try {
      setError(null);
      const res = await login(formData);
      if (!res.ok) setError(res.error ?? "Login failed");
      else router.push("/profile");
    } catch (error) {
      console.error("Login error:", error);
      setError("Login failed");
    }
  };

  return (
    <div className="card bg-base-100 w-full max-w-sm shrink-0 shadow-2xl">
      <form className="card-body" onSubmit={handleSubmit}>
        <fieldset className="fieldset">
          {error ? <div className="text-error text-sm">{error}</div> : null}
          <label className="label">Email</label>
          <input
            type="email"
            className="input"
            placeholder="Email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <label className="label">Password</label>
          <input
            type="password"
            className="input"
            placeholder="Password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <button className="btn btn-neutral mt-4" disabled={loading}>
            {loading ? "Loading..." : "Login"}
          </button>
          <div className="divider">OR</div>
          <button
            type="button"
            className="btn btn-outline"
            onClick={startGoogleLogin}
          >
            Continue with Google
          </button>
          <Link href="/register">Register</Link>{" "}
        </fieldset>
      </form>
    </div>
  );
};

export default Login;
