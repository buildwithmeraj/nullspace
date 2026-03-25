"use client";
import React from "react";
import { useAuth } from "@/contexts/AuthContext";

const Profile = () => {
  const { user, loading, logout } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Not logged in</div>;
  return (
    <div className="space-y-2">
      <div className="font-semibold">Name: {String(user.name ?? "")}</div>
      <div>Email: {String(user.email ?? "")}</div>
      <div>Role: {String(user.role ?? "")}</div>
      <div>Image: {String(user.image ?? user.avatar ?? "")}</div>
      <div>Created: {String(user.createdAt ?? "")}</div>
      <button className="btn btn-sm btn-neutral" onClick={() => void logout()}>
        Logout
      </button>
    </div>
  );
};

export default Profile;
