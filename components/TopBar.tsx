"use client";

import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function TopBar() {
  const router = useRouter();
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setName(user.user_metadata?.name ?? user.email ?? "User");
      }
    });
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <div className="topbar">
      <p>{name ? `Logged in as ${name}` : ""}</p>
      <button className="btn btn-small btn-ghost" type="button" onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
}
