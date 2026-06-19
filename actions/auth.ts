'use server';

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export async function signInEmail(formData: FormData) {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();

  if (!email || !password) {
    return { error: "Email dan password wajib diisi" };
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Sign in error:", error);

    // Handle specific Supabase auth error codes
    if (error.code === "email_not_confirmed") {
      return { error: "Email belum dikonfirmasi. Silakan cek inbox email Anda untuk link konfirmasi." };
    }
    if (error.code === "invalid_credentials") {
      return { error: "Email atau password salah" };
    }

    return { error: error.message || "Email atau password salah" };
  }

  redirect("/dashboard/overview");
}

export async function signUpEmail(formData: FormData) {
  const name = formData.get("name")?.toString();
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();

  if (!name || !email || !password) {
    return { error: "Semua field wajib diisi" };
  }

  if (!email.toLowerCase().endsWith("@gmail.com")) {
    return { error: "Pendaftaran akun baru hanya diperbolehkan menggunakan akun yang terdaftar di Google (@gmail.com)" };
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
    },
  });

  if (error) {
    console.error("Sign up error:", error);
    return { error: error.message || "Gagal membuat akun" };
  }

  // If email confirmation is required, Supabase returns a user but
  // the session will be null until the email is confirmed
  if (data?.user && !data?.session) {
    return {
      success: true,
      message: "Akun berhasil dibuat! Silakan cek inbox email Anda untuk link konfirmasi sebelum login.",
    };
  }

  redirect("/dashboard/overview");
}

export async function signOut() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  await supabase.auth.signOut();
  redirect("/login");
}