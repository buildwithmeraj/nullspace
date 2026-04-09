"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import ErrorMsg from "@/components/utilities/Error";
import { FaGoogle, FaUserPlus } from "react-icons/fa6";
// Define the type for your form data
interface FormData {
  name: string;
  email: string;
  password: string;
  imageFile: File | null;
}

const Register = () => {
  const { register, loading, startGoogleLogin, user } = useAuth();
  const router = useRouter();
  // Manage form state
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    imageFile: null,
  });
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    // If already logged in (e.g., Google), don't keep user on register screen.
    if (loading) return;
    if (!user) return;
    router.replace("/profile");
  }, [loading, router, user]);

  // A generic change handler for multiple inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.type === "file") {
      const file = e.target.files?.[0] ?? null;
      setFormData({ ...formData, imageFile: file });
      return;
    }
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const uploadImage = async (file: File): Promise<string> => {
    const body = new FormData();
    // Backend is expected to read `file` and upload to Cloudinary.
    // Your backend expects a single file field named `image`.
    body.append("image", file);

    const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ?? "";
    const uploadUrl = base
      ? `${base}/cloudinary/upload`
      : "/api/cloudinary/upload";
    const res = await fetch(uploadUrl, {
      method: "POST",
      body,
      credentials: "include",
    });

    const json = (await res.json().catch(() => null)) as {
      success?: boolean;
      data?: { url?: string };
    } | null;

    const url = json?.data?.url;
    if (!res.ok || !json?.success || !url) {
      throw new Error("Image upload failed");
    }
    return url;
  };

  // Submit handler function
  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevent default page reload
    setError(null);
    try {
      if (!formData.imageFile) {
        setError("Please select an image file");
        return;
      }

      setUploading(true);
      const imageUrl = await uploadImage(formData.imageFile);

      const res = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        image: imageUrl,
      });
      if (!res.ok) {
        const msg = res.error ?? "Registration failed";
        setError(msg);
        toast.error(msg);
      } else {
        toast.success("Account created");
        router.push("/profile");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="card bg-base-100 w-full shrink-0 border border-base-200 shadow-sm transition-shadow hover:shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 items-center">
          <form className="card-body" onSubmit={handleSubmit}>
            <h2 className="font-bold text-3xl text-center">Register</h2>
            <fieldset className="fieldset">
              {error ? <ErrorMsg message={<span>{error}</span>} /> : null}
              <label className="label">Name</label>
              <input
                type="text"
                className="input input-bordered"
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
              <label className="label">Photo</label>
              <input
                type="file"
                className="file-input file-input-bordered"
                accept="image/*"
                id="image"
                name="image"
                onChange={handleChange}
                required
              />
              <button
                className="btn btn-primary mt-4"
                disabled={loading || uploading}
              >
                <FaUserPlus size={16} />
                {uploading || loading ? "Loading..." : "Register"}
              </button>
              <div className="divider my-1">OR</div>
              <button
                type="button"
                className="btn btn-outline"
                onClick={startGoogleLogin}
              >
                <FaGoogle className="mt-0.5" />
                Continue with Google
              </button>
              <p className="my-1 text-center">
                <Link className="link link-hover text-sm" href="/login">
                  Already have an account?
                </Link>
              </p>
            </fieldset>
          </form>
          <div className="hidden md:block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://res.cloudinary.com/dwicoeqnl/image/upload/v1774865028/uploads/lplmsnsy9afll2uuf1mp.png"
              alt="Register"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
