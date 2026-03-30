"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";

// Define the type for your form data
interface FormData {
  email: string;
  password: string;
}

const Login = ({ nextPath }: { nextPath?: string | null }) => {
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
      if (!res.ok) {
        const msg = res.error ?? "Login failed";
        setError(msg);
        toast.error(msg);
      } else {
        toast.success("Welcome back");
        router.replace(nextPath || "/profile");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Login failed");
      toast.error("Login failed");
    }
  };

  return (
    <div className="card bg-base-100 w-full shrink-0 border border-base-200 shadow-sm transition-shadow hover:shadow-md">
      <form className="card-body" onSubmit={handleSubmit}>
        <fieldset className="fieldset">
          {error ? <div className="text-error text-sm">{error}</div> : null}
          <label className="label">Email</label>
          <input
            type="email"
            className="input input-bordered"
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
            className="input input-bordered"
            placeholder="Password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <button className="btn btn-primary mt-4" disabled={loading}>
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
          <Link className="link link-hover text-sm" href="/register">
            Create an account
          </Link>
        </fieldset>
      </form>
    </div>
  );
};

export default Login;
