import { createAuthClient } from "better-auth/react";

const API_URL = process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:4001";

export const authClient = createAuthClient({
  baseURL: API_URL,
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
} = authClient;

export const signInWithRoblox = () => {
  return signIn.social({
    provider: "roblox",
    callbackURL: "/", 
  });
}
  export const signInWithGoogle = () => {
  return signIn.social({
    provider: "google",
    callbackURL: "/", 
  });
};
