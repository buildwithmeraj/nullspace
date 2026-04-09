"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";
import ErrorMsg from "@/components/utilities/Error";
import InfoMsg from "@/components/utilities/Info";
import { FaSignInAlt } from "react-icons/fa";
import { FaGoogle } from "react-icons/fa6";

// Define the type for your form data
type FormData = {
  email: string;
  password: string;
};

const Login = ({ nextPath }: { nextPath?: string | null }) => {
  const { login, loading, startGoogleLogin, user, hydrateMe } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const queryNext = params.get("next");
  const errorCode = params.get("error");
  const [storedNext] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      return sessionStorage.getItem("postLoginRedirect");
    } catch {
      return null;
    }
  });
  const resolvedNext = nextPath ?? queryNext ?? storedNext;
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (user) {
      router.replace(resolvedNext || "/profile");
      return;
    }

    void (async () => {
      const ok = await hydrateMe();
      if (ok) router.replace(resolvedNext || "/profile");
    })();
  }, [hydrateMe, loading, resolvedNext, router, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setError(null);
      const res = await login(formData);
      if (!res.ok) {
        const msg = res.error ?? "Login failed";
        setError(msg);
        toast.error(msg);
      } else {
        toast.success("Welcome back");
        router.replace(resolvedNext || "/profile");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Login failed");
      toast.error("Login failed");
    }
  };

  return (
    <div className="card bg-base-100 max-w-3xl shrink-0 border border-base-200 shadow-sm transition-shadow hover:shadow-md mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 items-center">
        <form className="card-body" onSubmit={handleSubmit}>
          <h2 className="font-bold text-3xl text-center">Login</h2>
          <fieldset className="fieldset">
            {errorCode === "use_credentials" ? (
              <InfoMsg
                message={
                  <span className="text-sm">
                    This email is registered with credentials. Please log in
                    with email and password.
                  </span>
                }
              />
            ) : null}
            {error ? <ErrorMsg message={<span>{error}</span>} /> : null}
            <label className="label">Email</label>
            <input
              type="email"
              className="input input-bordered w-full"
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
              className="input input-bordered w-full"
              placeholder="Password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <button className="btn btn-primary mt-4" disabled={loading}>
              <FaSignInAlt className="mt-0.5" size={16} />
              {loading ? "Loading..." : "Login"}
            </button>
            <div className="divider">OR</div>
            <button
              type="button"
              className="btn btn-outline"
              onClick={startGoogleLogin}
            >
              <FaGoogle className="mt-0.5" />
              Continue with Google
            </button>
            <p className="my-1 text-center">
              <Link className="link link-hover text-sm" href="/register">
                Don&apos;t have an account?
              </Link>
            </p>
          </fieldset>
        </form>
        <div className="hidden md:block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://res.cloudinary.com/dwicoeqnl/image/upload/v1774865061/uploads/nldnxxwf9ohyy5b3krnz.png"
            alt="Login"
          />
        </div>
      </div>
    </div>
  );
};

export default Login;
