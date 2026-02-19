import type { User } from "@/lib/types";

const USERS_KEY = "isa_users";
const SESSION_KEY = "isa_session_user_id";

function readUsers(): User[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = localStorage.getItem(USERS_KEY);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as User[];
  } catch {
    return [];
  }
}

function writeUsers(users: User[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function signup(payload: Pick<User, "name" | "email" | "password">): { ok: true } | { ok: false; message: string } {
  const users = readUsers();
  const exists = users.some((user) => user.email.toLowerCase() === payload.email.toLowerCase());

  if (exists) {
    return { ok: false, message: "Email already exists." };
  }

  const nextUser: User = {
    id: crypto.randomUUID(),
    name: payload.name,
    email: payload.email,
    password: payload.password
  };

  users.push(nextUser);
  writeUsers(users);
  localStorage.setItem(SESSION_KEY, nextUser.id);

  return { ok: true };
}

export function login(payload: Pick<User, "email" | "password">): { ok: true } | { ok: false; message: string } {
  const users = readUsers();
  const user = users.find(
    (candidate) =>
      candidate.email.toLowerCase() === payload.email.toLowerCase() && candidate.password === payload.password
  );

  if (!user) {
    return { ok: false, message: "Invalid credentials." };
  }

  localStorage.setItem(SESSION_KEY, user.id);
  return { ok: true };
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

export function getCurrentUser(): User | null {
  const users = readUsers();
  const sessionId = localStorage.getItem(SESSION_KEY);

  if (!sessionId) {
    return null;
  }

  return users.find((user) => user.id === sessionId) ?? null;
}
