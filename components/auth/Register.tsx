"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
// Define the type for your form data
interface FormData {
  name: string;
  email: string;
  password: string;
  imageFile: File | null;
}

const Register = () => {
  const { register, loading, startGoogleLogin } = useAuth();
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

    const res = await fetch("/api/cloudinary/upload", {
      method: "POST",
      body,
      credentials: "include",
    });

    const json = (await res.json().catch(() => null)) as
      | { success?: boolean; data?: { url?: string } }
      | null;

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
    <div className="mx-auto w-full max-w-sm">
      <div className="card bg-base-100 w-full shrink-0 border border-base-200 shadow-sm transition-shadow hover:shadow-md">
      <form className="card-body" onSubmit={handleSubmit}>
        <fieldset className="fieldset">
          {error ? <div className="text-error text-sm">{error}</div> : null}
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
          <button className="btn btn-primary mt-4" disabled={loading || uploading}>
            {uploading || loading ? "Loading..." : "Register"}
          </button>
          <div className="divider">OR</div>
          <button type="button" className="btn btn-outline" onClick={startGoogleLogin}>
            Continue with Google
          </button>
          <Link className="link link-hover text-sm" href="/login">
            Already have an account? Log in
          </Link>
        </fieldset>
      </form>
    </div>
    </div>
  );
};

export default Register;
