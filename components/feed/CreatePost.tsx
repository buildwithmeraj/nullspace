"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import axios from "axios";

import { useAuth } from "@/contexts/AuthContext";
import { protectedApiRequest } from "@/lib/api";
import InfoMsg from "@/components/utilities/Info";
import ErrorMsg from "@/components/utilities/Error";
import RequireLogin from "@/components/auth/RequireLogin";
import ImageLightbox from "@/components/shared/ImageLightbox";
import { Wand2 } from "lucide-react";
import toast from "react-hot-toast";

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

type MentionUser = {
  _id: string;
  name?: string;
  username: string;
  image?: string;
};
type SearchUsersResponse = { success?: boolean; data?: MentionUser[] };
type PreviewImage = {
  file: File;
  url: string;
};

function getMentionMatch(text: string, caret: number) {
  const before = text.slice(0, caret);
  // Match "@foo" at the end of the current token.
  const match = before.match(/(^|\\s)@([a-zA-Z0-9_]{1,24})$/);
  if (!match) return null;
  const query = match[2] ?? "";
  const start = caret - query.length - 1; // index of "@"
  return { query, start, end: caret };
}

const CreatePost = ({ onCreated }: { onCreated?: () => void }) => {
  const { user, loading } = useAuth();
  const { resolvedTheme } = useTheme();
  const [content, setContent] = useState<string>("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [mention, setMention] = useState<{
    query: string;
    start: number;
    end: number;
  } | null>(null);
  const [mentionUsers, setMentionUsers] = useState<MentionUser[]>([]);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [previewImages, setPreviewImages] = useState<PreviewImage[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previewImagesRef = useRef<PreviewImage[]>([]);

  const previewOptions = useMemo(() => {
    const highlight: [
      typeof rehypeHighlight,
      { detect: boolean; ignoreMissing: boolean },
    ] = [rehypeHighlight, { detect: true, ignoreMissing: true }];

    return {
      remarkPlugins: [remarkGfm],
      // `detect: true` highlights fenced blocks without an explicit language.
      // `ignoreMissing: true` avoids runtime errors for unknown languages.
      rehypePlugins: [highlight],
    };
  }, []);

  const canSubmit =
    Boolean(content.trim()) &&
    content.length <= MAX_CHARS &&
    !submitting &&
    !uploading &&
    !enhancing;

  const username = String(user?.username ?? "").trim();
  const needsUsername = Boolean(user) && !username;
  const colorMode = resolvedTheme === "dark" ? "dark" : "light";
  const imageFiles = previewImages.map((image) => image.file);

  useEffect(() => {
    if (!mention?.query || !mentionOpen) return;

    const handle = setTimeout(() => {
      void (async () => {
        const res = await protectedApiRequest<SearchUsersResponse>({
          url: `/users/search?query=${encodeURIComponent(mention.query)}`,
          method: "GET",
        }).catch(() => null);
        const users = res?.data ?? [];
        setMentionUsers(users);
        setMentionIndex(0);
      })();
    }, 250);

    return () => clearTimeout(handle);
  }, [mention?.query, mentionOpen]);

  useEffect(() => {
    previewImagesRef.current = previewImages;
  }, [previewImages]);

  useEffect(() => {
    return () => {
      previewImagesRef.current.forEach((image) => URL.revokeObjectURL(image.url));
    };
  }, []);

  const onPickImages = (files: FileList | null) => {
    setError(null);
    if (!files) return;
    const picked = Array.from(files);
    if (!picked.length) return;

    const remainingSlots = Math.max(0, MAX_IMAGES - previewImages.length);
    const accepted = picked.slice(0, remainingSlots).map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));

    if (previewImages.length + picked.length > MAX_IMAGES) {
      setError(`You can upload up to ${MAX_IMAGES} images`);
    }

    if (!accepted.length) return;

    setPreviewImages((prev) => [...prev, ...accepted]);
  };

  const removeImageAt = (index: number) => {
    setPreviewImages((prev) => {
      const target = prev[index];
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((_, i) => i !== index);
    });
    setLightboxIndex((prev) => {
      if (prev === null) return prev;
      if (prev === index) return null;
      if (prev > index) return prev - 1;
      return prev;
    });
  };

  const uploadOne = async (file: File): Promise<string> => {
    const body = new FormData();
    // Backend expects single file field named `image`.
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

    const json = (await res.json().catch(() => null)) as UploadResponse | null;
    const url = json && "data" in json ? json.data?.url : undefined;
    if (!res.ok || !json?.success || !url) {
      throw new Error(
        (json && "message" in json ? json.message : undefined) ??
          "Image upload failed",
      );
    }
    return url;
  };

  const submit = async () => {
    setError(null);
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
      const imageUrls = imageFiles.length
        ? await Promise.all(imageFiles.map((f) => uploadOne(f)))
        : [];
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
      setPreviewImages((prev) => {
        prev.forEach((image) => URL.revokeObjectURL(image.url));
        return [];
      });
      setLightboxIndex(null);
      toast.success(res?.message ?? "Post created");
      onCreated?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create post");
    } finally {
      setUploading(false);
      setSubmitting(false);
    }
  };

  const enhance = async () => {
    setError(null);

    const raw = content.trim();
    if (!raw) {
      setError("Write something first");
      return;
    }

    const prose = raw
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/~~~[\s\S]*?~~~/g, " ")
      .replace(/`[^`]*`/g, " ");
    const words = (prose.match(/[A-Za-z0-9_']+/g) ?? []).length;
    if (words < 5) {
      setError("Write at least one sentence (5+ words) to enhance.");
      return;
    }

    setEnhancing(true);
    try {
      const json = await protectedApiRequest<{
        success?: boolean;
        message?: string;
        data?: { content?: string };
      }>({
        url: "/ai/enhance",
        method: "POST",
        data: { content: raw },
      });

      if (!json?.success) {
        setError(json?.message ?? "Failed to enhance post");
        return;
      }

      const next = String(json.data?.content ?? "").trim();
      if (!next) {
        setError("Enhancer returned empty output");
        return;
      }
      setContent(next);
      toast.success(json?.message ?? "Post enhanced");
    } catch (e) {
      if (axios.isAxiosError(e)) {
        const data = e.response?.data as unknown;
        const msg =
          typeof (data as { message?: unknown } | null)?.message === "string"
            ? String((data as { message: string }).message)
            : e.message;
        setError(msg || "Failed to enhance post");
      } else {
        setError(e instanceof Error ? e.message : "Failed to enhance post");
      }
    } finally {
      setEnhancing(false);
    }
  };

  const insertMention = (u: MentionUser) => {
    if (!mention) return;
    const label = `@${u.username}`;
    const href = `/d/${encodeURIComponent(u.username)}`;
    const md = `[${label}](${href}) `;

    const next =
      content.slice(0, mention.start) + md + content.slice(mention.end);
    setContent(next);
    setMentionOpen(false);
    setMention(null);

    // Put caret right after inserted mention.
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      const pos = mention.start + md.length;
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  };

  const handleTextareaKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    textareaRef.current = el;
    const caret = el.selectionStart ?? 0;
    const m = getMentionMatch(el.value, caret);
    if (!m) {
      setMentionOpen(false);
      setMention(null);
      return;
    }
    setMention(m);
    setMentionOpen(true);
  };

  const handleTextareaKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    textareaRef.current = e.currentTarget;
    if (!mentionOpen) return;
    if (!mentionUsers.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setMentionIndex((i) => Math.min(i + 1, mentionUsers.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setMentionIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      const u = mentionUsers[mentionIndex];
      if (u) insertMention(u);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setMentionOpen(false);
      setMention(null);
    }
  };

  return (
    <section className="card bg-base-100 w-full border border-base-200 shadow-sm">
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
          <RequireLogin
            title="Create post"
            message={<span className="text-sm">Log in to create a post.</span>}
          />
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
            {error ? (
              <ErrorMsg message={<span className="text-sm">{error}</span>} />
            ) : null}

            <div data-color-mode={colorMode}>
              <MDEditor
                value={content}
                onChange={(v) => setContent(v ?? "")}
                height={260}
                preview="edit"
                previewOptions={previewOptions}
                textareaProps={{
                  placeholder: "Write your post in Markdown…",
                  onKeyUp: handleTextareaKeyUp,
                  onKeyDown: handleTextareaKeyDown,
                }}
              />
            </div>

            {mentionOpen && mention?.query ? (
              <div className="border border-base-300 rounded-md bg-base-100">
                <div className="px-3 py-2 text-xs opacity-70">
                  Mention: @{mention.query}
                </div>
                {mentionUsers.length ? (
                  <ul className="menu menu-sm">
                    {mentionUsers.map((u, idx) => (
                      <li key={u._id}>
                        <button
                          type="button"
                          className={idx === mentionIndex ? "active" : ""}
                          onMouseDown={(ev) => {
                            // Prevent editor blur before we insert.
                            ev.preventDefault();
                            insertMention(u);
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <div className="avatar">
                              <div className="w-6 rounded-full bg-base-200">
                                {u.image ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={u.image}
                                    alt={u.username}
                                    loading="lazy"
                                    decoding="async"
                                  />
                                ) : null}
                              </div>
                            </div>
                            <div className="text-left">
                              <div className="text-sm font-medium">
                                {String(u.name ?? u.username)}
                              </div>
                              <div className="text-xs opacity-70">
                                @{u.username}
                              </div>
                            </div>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-3 py-2 text-sm opacity-70">
                    No users found.
                  </div>
                )}
              </div>
            ) : null}

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

            {previewImages.length ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {previewImages.map((image, idx) => (
                  <div key={image.url} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image.url}
                      alt="Selected"
                      className="rounded-md object-cover w-full h-28 cursor-zoom-in"
                      loading="lazy"
                      decoding="async"
                      onClick={() => setLightboxIndex(idx)}
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
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => void enhance()}
                disabled={submitting || uploading || enhancing}
                title="Enhance (rewrite to be professional)"
              >
                <Wand2 size={16} />
                {enhancing ? "Enhancing…" : "Enhance"}
              </button>
              <button
                className="btn btn-neutral"
                onClick={() => void submit()}
                disabled={!canSubmit}
              >
                {uploading ? "Uploading…" : submitting ? "Posting…" : "Post"}
              </button>
            </div>

            <ImageLightbox
              images={previewImages.map((image) => ({
                url: image.url,
                alt: "Selected image preview",
              }))}
              index={lightboxIndex ?? 0}
              open={lightboxIndex !== null}
              onClose={() => setLightboxIndex(null)}
              onChange={setLightboxIndex}
            />
          </>
        )}
      </div>
    </section>
  );
};

export default CreatePost;
