"use client";

import { getCurrentUser, logout } from "@/lib/auth";
import type { User } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function TopBar() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  function onLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <header className="topbar">
      <p>
        Signed in as <strong>{user?.name ?? "User"}</strong>
      </p>
      <button className="btn btn-small btn-secondary" onClick={onLogout} type="button">
        Logout
      </button>
    </header>
  );
}
