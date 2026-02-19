import { supabase } from "@/lib/supabaseClient";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
};

export async function signUp(name: string, email: string, password: string): Promise<{ user?: AuthUser; error?: string }> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } }
  });

  if (error) return { error: error.message };
  if (!data.user) return { error: "Sign-up failed" };

  return {
    user: {
      id: data.user.id,
      email: data.user.email ?? email,
      name
    }
  };
}

export async function logIn(email: string, password: string): Promise<{ user?: AuthUser; error?: string }> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: error.message };
  if (!data.user) return { error: "Login failed" };

  return {
    user: {
      id: data.user.id,
      email: data.user.email ?? email,
      name: data.user.user_metadata?.name ?? email
    }
  };
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  return {
    id: user.id,
    email: user.email ?? "",
    name: user.user_metadata?.name ?? user.email ?? ""
  };
}

export async function logout(): Promise<void> {
  await supabase.auth.signOut();
}
