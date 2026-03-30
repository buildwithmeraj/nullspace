"use client";

import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { protectedApiRequest } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import InfoMsg from "@/components/utilities/Info";
import { useSearchParams } from "next/navigation";
import RequireLogin from "@/components/auth/RequireLogin";

type UpdateProfileResponse = {
  success?: boolean;
  message?: string;
  data?: Record<string, unknown>;
};

type FormState = {
  name: string;
  username: string;
  bio: string;
  imageFile: File | null;
};

export default function UpdateProfile() {
  const { user, setUser, loading } = useAuth();
  const params = useSearchParams();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const initial = useMemo<FormState>(
    () => ({
      name: String(user?.name ?? ""),
      username: String(user?.username ?? ""),
      bio: String(user?.bio ?? ""),
      imageFile: null,
    }),
    [user],
  );

  const [form, setForm] = useState<FormState>(initial);

  useEffect(() => {
    setForm(initial);
  }, [initial]);

  const uploadImage = async (file: File): Promise<string> => {
    const body = new FormData();
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

    const json = (await res.json().catch(() => null)) as
      | { success?: boolean; message?: string; data?: { url?: string } }
      | null;

    const url = json?.data?.url;
    if (!res.ok || !json?.success || !url) {
      throw new Error(json?.message ?? "Image upload failed");
    }
    return url;
  };

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onPickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setForm((prev) => ({ ...prev, imageFile: file }));
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || loading) return;

    setSaving(true);
    try {
      const username = form.username.trim();
      if (!username) {
        toast.error("Username is required");
        return;
      }

      // Avatar and profile picture are merged; `image` is the canonical field.
      let nextImageUrl = String(user.image ?? "").trim();
      if (form.imageFile) {
        setUploading(true);
        nextImageUrl = await uploadImage(form.imageFile);
        setUploading(false);
      }

      const payload = {
        name: form.name.trim(),
        username,
        bio: form.bio.trim(),
        image: nextImageUrl,
      };

      const res = await protectedApiRequest<UpdateProfileResponse>({
        url: "/users/me",
        method: "PATCH",
        data: payload,
      });

      if (!res?.success) {
        throw new Error(res?.message ?? "Failed to update profile");
      }

      if (res.data) {
        setUser((prev) => ({ ...(prev ?? {}), ...res.data }));
      }

      setForm((prev) => ({ ...prev, imageFile: null }));
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      toast.success(res.message ?? "Profile updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setUploading(false);
      setSaving(false);
    }
  };

  useEffect(() => {
    return () => {
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, []);

  if (loading) return null;
  if (!user)
    return (
      <RequireLogin
        title="Edit profile"
        message={<span className="text-sm">Log in to edit your profile.</span>}
        nextPath="/profile/edit"
      />
    );

  const redirected =
    params.get("reason") === "complete_profile" || Boolean(params.get("next"));
  const needsUsername = !String(user.username ?? "").trim();

  return (
    <section className="card bg-base-100 border border-base-200 shadow-sm">
      <div className="card-body space-y-4">
        <div>
          <h2 className="card-title text-base">Edit profile</h2>
          <p className="text-sm opacity-70">
            Update your display info. Username must be unique.
          </p>
        </div>

        {redirected && needsUsername ? (
          <InfoMsg
            message={
              <span className="text-sm">
                You were redirected here because you must complete your profile
                (set a username) to continue.
              </span>
            }
          />
        ) : null}

        <form className="space-y-3" onSubmit={submit}>
          <div className="flex items-center gap-3">
            <div className="avatar">
              <div className="w-12 rounded-full bg-base-200">
                {previewUrl || user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewUrl ?? String(user.image ?? "")}
                    alt="Profile"
                    className="object-cover"
                  />
                ) : null}
              </div>
            </div>
            <div className="text-sm">
              <div className="font-medium">Profile picture</div>
              <div className="opacity-70">
                Upload a square image for best results.
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="form-control w-full">
              <div className="label">
                <span className="label-text">Name</span>
              </div>
              <input
                name="name"
                className="input input-bordered w-full"
                value={form.name}
                onChange={onChange}
                disabled={saving || uploading}
                required
              />
            </label>

            <label className="form-control w-full">
              <div className="label">
                <span className="label-text">Username</span>
              </div>
              <input
                name="username"
                className="input input-bordered w-full"
                value={form.username}
                onChange={onChange}
                disabled={saving || uploading}
                required
              />
            </label>
          </div>

          <label className="form-control w-full">
            <div className="label">
              <span className="label-text">Bio</span>
            </div>
            <textarea
              name="bio"
              className="textarea textarea-bordered w-full min-h-24"
              value={form.bio}
              onChange={onChange}
              disabled={saving || uploading}
              placeholder="Tell people what you build…"
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="form-control w-full">
              <div className="label">
                <span className="label-text">Profile image (upload)</span>
              </div>
              <input
                type="file"
                className="file-input file-input-bordered w-full"
                accept="image/*"
                onChange={onPickImage}
                disabled={saving || uploading}
              />
            </label>
          </div>

          <div className="card-actions justify-end">
            <button
              type="submit"
              className="btn btn-neutral"
              disabled={saving || uploading}
            >
              {uploading ? "Uploading…" : saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
