"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

import { useAuth } from "@/contexts/AuthContext";
import { protectedApiRequest } from "@/lib/api";
import InfoMsg from "@/components/utilities/Info";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

type CreatePostResult = {
  success?: boolean;
  message?: string;
  data?: unknown;
};

type UploadResponse =
  | { success: true; data: { url: string } }
  | { success: false; message?: string; data?: { url?: string } };

const MAX_CHARS = 10_000;
const MAX_IMAGES = 5;

const CreatePost = ({ onCreated }: { onCreated?: () => void }) => {
  const { user, loading } = useAuth();
  const { resolvedTheme } = useTheme();
  const [content, setContent] = useState<string>("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const previewOptions = useMemo(
    () => ({
      remarkPlugins: [remarkGfm],
      rehypePlugins: [rehypeHighlight],
    }),
    [],
  );

  const canSubmit =
    Boolean(content.trim()) &&
    content.length <= MAX_CHARS &&
    !submitting &&
    !uploading;

  const username = String(user?.username ?? "").trim();
  const needsUsername = Boolean(user) && !username;
  const colorMode = resolvedTheme === "dark" ? "dark" : "light";

  useEffect(() => {
    // Maintain local object URLs for selected images and clean them up.
    const urls = imageFiles.map((f) => URL.createObjectURL(f));
    setImagePreviews(urls);
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [imageFiles]);

  const onPickImages = (files: FileList | null) => {
    setError(null);
    if (!files) return;
    const picked = Array.from(files);
    if (!picked.length) return;

    const next = [...imageFiles, ...picked].slice(0, MAX_IMAGES);
    if (imageFiles.length + picked.length > MAX_IMAGES) {
      setError(`You can upload up to ${MAX_IMAGES} images`);
    }
    setImageFiles(next);
  };

  const removeImageAt = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadOne = async (file: File): Promise<string> => {
    const body = new FormData();
    // Backend expects single file field named `image`.
    body.append("image", file);

    const res = await fetch("/api/cloudinary/upload", {
      method: "POST",
      body,
      credentials: "include",
    });

    const json = (await res.json().catch(() => null)) as UploadResponse | null;
    const url = json && "data" in json ? json.data?.url : undefined;
    if (!res.ok || !json?.success || !url) {
      throw new Error((json && "message" in json ? json.message : undefined) ?? "Image upload failed");
    }
    return url;
  };

  const submit = async () => {
    setError(null);
    setSuccess(null);
    const nextContent = content.trim();
    if (!nextContent) {
      setError("Post content is required");
      return;
    }
    if (nextContent.length > MAX_CHARS) {
      setError(`Post content cannot exceed ${MAX_CHARS} characters`);
      return;
    }
    if (imageFiles.length > MAX_IMAGES) {
      setError(`You can upload up to ${MAX_IMAGES} images`);
      return;
    }

    setSubmitting(true);
    try {
      setUploading(true);
      const imageUrls =
        imageFiles.length ? await Promise.all(imageFiles.map((f) => uploadOne(f))) : [];
      setUploading(false);

      const res = await protectedApiRequest<CreatePostResult>({
        url: "/posts",
        method: "POST",
        data: {
          content: nextContent,
          images: imageUrls.map((url) => ({ url })),
        },
      });

      if (!res?.success) {
        setError(res?.message ?? "Failed to create post");
        return;
      }

      setContent("");
      setImageFiles([]);
      setSuccess("Post created");
      onCreated?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create post");
    } finally {
      setUploading(false);
      setSubmitting(false);
    }
  };

  return (
    <section className="card bg-base-100 w-full shadow-xl">
      <div className="card-body space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="card-title">Create post</h2>
            <p className="text-sm opacity-70">
              Markdown supported — paste code blocks with triple backticks.
            </p>
          </div>
          <div className="text-sm opacity-70">
            {content.length}/{MAX_CHARS}
          </div>
        </div>

        {loading ? (
          <div className="text-sm opacity-70">Checking session…</div>
        ) : !user ? (
          <div className="text-sm">
            You need to <Link className="link" href="/login">log in</Link> to create a post.
          </div>
        ) : needsUsername ? (
          <InfoMsg
            message={
              <span className="text-sm">
                You must complete your profile (set a{" "}
                <Link className="link" href="/profile/edit">
                  username
                </Link>
                ) to continue.
              </span>
            }
          />
        ) : (
          <>
            {error ? <div className="alert alert-error py-2">{error}</div> : null}
            {success ? <div className="alert alert-success py-2">{success}</div> : null}

            <div data-color-mode={colorMode}>
              <MDEditor
                value={content}
                onChange={(v) => setContent(v ?? "")}
                height={260}
                previewOptions={previewOptions}
                textareaProps={{
                  placeholder: "Write your post in Markdown…",
                }}
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <input
                type="file"
                className="file-input file-input-bordered w-full"
                accept="image/*"
                multiple
                disabled={submitting || uploading}
                onChange={(e) => onPickImages(e.target.files)}
              />
              <div className="text-sm opacity-70 shrink-0">
                {imageFiles.length}/{MAX_IMAGES}
              </div>
            </div>

            {imagePreviews.length ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {imagePreviews.map((src, idx) => (
                  <div key={src} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt="Selected"
                      className="rounded-md object-cover w-full h-28"
                    />
                    <button
                      type="button"
                      className="btn btn-xs btn-circle absolute top-1 right-1"
                      onClick={() => removeImageAt(idx)}
                      disabled={submitting || uploading}
                      aria-label="Remove image"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="card-actions justify-end">
              <button className="btn btn-neutral" onClick={() => void submit()} disabled={!canSubmit}>
                {uploading ? "Uploading…" : submitting ? "Posting…" : "Post"}
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default CreatePost;
