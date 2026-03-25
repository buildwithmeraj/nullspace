"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
// Define the type for your form data
interface FormData {
  name: string;
  email: string;
  password: string;
  image: string;
}

const Register = () => {
  const { register, loading, startGoogleLogin } = useAuth();
  const router = useRouter();
  // Manage form state
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    image: "",
  });
  const [error, setError] = useState<string | null>(null);

  // A generic change handler for multiple inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Submit handler function
  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevent default page reload
    setError(null);
    const res = await register(formData);
    if (!res.ok) setError(res.error ?? "Registration failed");
    else router.push("/profile");
  };

  return (
    <div className="card bg-base-100 w-full max-w-sm shrink-0 shadow-2xl">
      <form className="card-body" onSubmit={handleSubmit}>
        <fieldset className="fieldset">
          {error ? <div className="text-error text-sm">{error}</div> : null}
          <label className="label">Name</label>
          <input
            type="text"
            className="input"
            placeholder="Full Name"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
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
          <label className="label">Photo</label>
          <input
            type="url"
            className="input"
            placeholder="Photo"
            id="image"
            name="image"
            value={formData.image}
            onChange={handleChange}
            required
          />
          <button className="btn btn-neutral mt-4" disabled={loading}>
            {loading ? "Loading..." : "Register"}
          </button>
          <div className="divider">OR</div>
          <button type="button" className="btn btn-outline" onClick={startGoogleLogin}>
            Continue with Google
          </button>
          <Link href="/login">Login</Link>
        </fieldset>
      </form>
    </div>
  );
};

export default Register;
