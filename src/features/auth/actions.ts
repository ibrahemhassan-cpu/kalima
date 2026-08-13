import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { authErrorAr } from "./errors";

/**
 * All auth side effects in one place, so screens stay presentational
 * and the cache is always cleaned up on sign-out.
 */

export const REDIRECT_RESET = "kalima://reset-password";
export const REDIRECT_CONFIRM = "kalima://(auth)/sign-in";

export function useSignIn() {
  return useMutation({
    mutationFn: async (v: { email: string; password: string }) => {
      const { error } = await supabase.auth.signInWithPassword({
        email: v.email.trim().toLowerCase(),
        password: v.password,
      });
      if (error) throw new Error(error.message);
    },
  });
}

export function useSignUp() {
  return useMutation({
    mutationFn: async (v: { name: string; email: string; password: string }) => {
      const { data, error } = await supabase.auth.signUp({
        email: v.email.trim().toLowerCase(),
        password: v.password,
        options: {
          data: { full_name: v.name.trim() },
          emailRedirectTo: REDIRECT_CONFIRM,
        },
      });
      if (error) throw new Error(error.message);
      // No session means email confirmation is required.
      return { needsConfirmation: !data.session };
    },
  });
}

export function useResendConfirmation() {
  return useMutation({
    mutationFn: async (email: string) => {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email.trim().toLowerCase(),
        options: { emailRedirectTo: REDIRECT_CONFIRM },
      });
      if (error) throw new Error(error.message);
    },
  });
}

export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: async (email: string) => {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { redirectTo: REDIRECT_RESET },
      );
      // Never reveal whether the address exists — that would leak our user list.
      if (error && !/not found|user/i.test(error.message)) {
        throw new Error(error.message);
      }
    },
  });
}

export function useUpdatePassword() {
  return useMutation({
    mutationFn: async (password: string) => {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw new Error(error.message);
    },
  });
}

export function useSignOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await supabase.auth.signOut();
    },
    onSettled: () => {
      // Wipe every cached query — otherwise the next account briefly sees
      // the previous user's words.
      qc.clear();
    },
  });
}

export { authErrorAr as authError };
