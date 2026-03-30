"use client";

import dynamic from "next/dynamic";
import React, { useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { protectedApiRequest } from "@/lib/api";
import { useTheme } from "next-themes";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

type UpdateResponse<T> = { success?: boolean; message?: string; data?: T };

export default function PostOwnerActions({
  postId,
  content,
  onUpdated,
  onDeleted,
}: {
  postId: string;
  content: string;
  onUpdated?: (next: { content: string }) => void;
  onDeleted?: () => void;
}) {
  const { resolvedTheme } = useTheme();
  const editDialogRef = useRef<HTMLDialogElement | null>(null);
  const deleteDialogRef = useRef<HTMLDialogElement | null>(null);

  const [draft, setDraft] = useState(content);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const dirty = useMemo(() => draft.trim() !== String(content ?? "").trim(), [content, draft]);
  const colorMode = resolvedTheme === "dark" ? "dark" : "light";

  const previewOptions = useMemo(() => {
    const highlight: [
      typeof rehypeHighlight,
      { detect: boolean; ignoreMissing: boolean },
    ] = [rehypeHighlight, { detect: true, ignoreMissing: true }];
    return {
      remarkPlugins: [remarkGfm],
      rehypePlugins: [highlight],
    };
  }, []);

  const openEdit = () => {
    setDraft(content);
    editDialogRef.current?.showModal();
  };

  const openDelete = () => {
    deleteDialogRef.current?.showModal();
  };

  const closeEdit = () => editDialogRef.current?.close();
  const closeDelete = () => deleteDialogRef.current?.close();

  const save = async () => {
    const next = draft.trim();
    if (!next) {
      toast.error("Post content is required");
      return;
    }
    if (saving) return;
    setSaving(true);
    try {
      const res = await protectedApiRequest<UpdateResponse<{ content?: string }>>({
        url: `/posts/${encodeURIComponent(postId)}`,
        method: "PATCH",
        data: { content: next },
      });
      if (!res?.success) throw new Error(res?.message ?? "Failed to update post");
      onUpdated?.({ content: next });
      toast.success(res?.message ?? "Post updated");
      closeEdit();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update post");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      const res = await protectedApiRequest<UpdateResponse<unknown>>({
        url: `/posts/${encodeURIComponent(postId)}`,
        method: "DELETE",
      });
      if (!res?.success) throw new Error(res?.message ?? "Failed to delete post");
      toast.success(res?.message ?? "Post deleted");
      closeDelete();
      onDeleted?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete post");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="dropdown dropdown-end">
        <button type="button" className="btn btn-ghost btn-sm btn-circle" aria-label="Post actions">
          <MoreVertical className="h-4 w-4" />
        </button>
        <ul className="dropdown-content z-[1] mt-2 w-44 border border-base-200 bg-base-100 shadow">
          <li>
            <button type="button" className="w-full px-3 py-2 hover:bg-base-200/60 flex items-center gap-2" onClick={openEdit}>
              <Pencil className="h-4 w-4" />
              Edit
            </button>
          </li>
          <li>
            <button type="button" className="w-full px-3 py-2 hover:bg-base-200/60 flex items-center gap-2 text-error" onClick={openDelete}>
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </li>
        </ul>
      </div>

      <dialog ref={editDialogRef} className="modal">
        <div className="modal-box">
          <h3 className="font-semibold text-lg">Edit post</h3>
          <p className="text-sm opacity-70 mt-1">Update your post content.</p>

          <div className="mt-4 space-y-2">
            <div data-color-mode={colorMode}>
              <MDEditor
                value={draft}
                onChange={(v) => setDraft(v ?? "")}
                height={260}
                previewOptions={previewOptions}
                textareaProps={{
                  placeholder: "Update your post in Markdown…",
                }}
              />
            </div>
            <div className="text-xs opacity-60 flex items-center justify-between">
              <span>{dirty ? "Unsaved changes" : "No changes"}</span>
              <span>{draft.length}/10000</span>
            </div>
          </div>

          <div className="modal-action">
            <button type="button" className="btn btn-ghost" onClick={closeEdit} disabled={saving}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={() => void save()} disabled={saving || !draft.trim()}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button aria-label="Close" />
        </form>
      </dialog>

      <dialog ref={deleteDialogRef} className="modal">
        <div className="modal-box">
          <h3 className="font-semibold text-lg">Delete post?</h3>
          <p className="text-sm opacity-70 mt-1">
            This action can’t be undone.
          </p>
          <div className="modal-action">
            <button type="button" className="btn btn-ghost" onClick={closeDelete} disabled={deleting}>
              Cancel
            </button>
            <button type="button" className="btn btn-error" onClick={() => void remove()} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button aria-label="Close" />
        </form>
      </dialog>
    </>
  );
}
