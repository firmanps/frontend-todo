"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCsrfToken, resetCsrfToken } from "@/lib/axios";
import { ArrowRight, CheckCircle2, Lock, Mail, User } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "@/lib/toast";

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  // Set mode login jika ada query parameter dari redirect register
  useEffect(() => {
    const mode = searchParams.get("mode");
    if (mode === "login") {
      setIsLogin(true);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validasi input
      if (!email || !password) {
        throw new Error("Email dan password wajib diisi");
      }

      if (!isLogin && !name) {
        throw new Error("Username wajib diisi");
      }

      if (isLogin) {
        // Dapatkan CSRF token terlebih dahulu
        const csrfToken = await getCsrfToken();

        // Login request melalui Next.js API route (proxy)
        const loginResponse = await fetch("/api/auth/login", {
          method: "POST",
          credentials: "include", // Include cookies
          headers: {
            "Content-Type": "application/json",
            ...(csrfToken && { "X-CSRF-Token": csrfToken }), // Sertakan CSRF token jika ada
          },
          body: JSON.stringify({
            email,
            password,
          }),
        });

        const loginData = await loginResponse.json();

        if (!loginResponse.ok) {
          throw new Error(
            loginData.message || loginData.error || "Login gagal"
          );
        }

        // Redirect ke path yang diminta sebelumnya (dari query param 'next') atau ke dashboard
        // Authentication menggunakan cookies (httpOnly) dari backend, tidak perlu localStorage
        const nextPath = decodeURIComponent(
          searchParams.get("next") || "/dashboard"
        );

        toast.success(loginData.message || "Berhasil masuk ke akun Anda", {
          description: "Selamat datang kembali di TaskFlow.",
        });

        // Reset CSRF token setelah login sukses untuk memastikan token fresh
        resetCsrfToken();

        // Delay untuk memastikan cookies ter-set di browser sebelum redirect
        // Cookies dari backend sudah di-forward oleh API route menggunakan NextResponse.cookies
        // Setelah cookies ter-set, middleware akan mengecek dengan /v1/user/me
        // Jika cookies valid, middleware akan allow access
        // Jika cookies tidak valid, middleware akan redirect ke /auth
        setTimeout(() => {
          window.location.href = nextPath;
        }, 500);
      } else {
        // Dapatkan CSRF token terlebih dahulu
        const csrfToken = await getCsrfToken();

        // Register request melalui Next.js API route (proxy)
        const registerResponse = await fetch("/api/auth/register", {
          method: "POST",
          credentials: "include", // Include cookies
          headers: {
            "Content-Type": "application/json",
            ...(csrfToken && { "X-CSRF-Token": csrfToken }), // Sertakan CSRF token jika ada
          },
          body: JSON.stringify({
            username: name,
            email,
            password,
          }),
        });

        const registerData = await registerResponse.json();

        if (!registerResponse.ok) {
          throw new Error(
            registerData.message || registerData.error || "Registrasi gagal"
          );
        }

        toast.success("Akun berhasil dibuat", {
          description: "Silakan masuk dengan akun yang baru dibuat.",
        });

        // Redirect ke halaman auth dengan mode login
        router.push("/auth?mode=login");
        // Reset form
        setEmail("");
        setPassword("");
        setName("");
      }
    } catch (error: any) {
      // Handle error dari API
      const errorMessage =
        error?.message || "Terjadi kesalahan. Silakan coba lagi.";

      toast.error("Terjadi kesalahan ❌", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* LEFT - FORM */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md animate-fade-in">
          {/* Logo */}
          <div className="mb-3 flex items-center gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <Image
                src="/icon2.png"
                alt="Logo"
                width={2000}
                height={2000}
                className="h-10 w-10 shrink-0 rounded-lg"
                sizes="32px"
                priority
              />
            </div>
            <span className="text-2xl font-bold text-foreground">TaskFlow</span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold text-foreground">
              {isLogin ? "Selamat Datang!" : "Buat Akun Baru"}
            </h1>
            <p className="text-muted-foreground">
              {isLogin
                ? "Masuk untuk melanjutkan produktivitas Anda"
                : "Mulai perjalanan produktivitas Anda hari ini"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-2">
                <Label>Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Username"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  minLength={6}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={isLoading}
              className="gradient-primary-hover w-full gap-2 text-primary-foreground"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                  Loading...
                </span>
              ) : (
                <>
                  {isLogin ? "Masuk" : "Daftar"}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Toggle */}
          <p className="mt-6 text-center text-muted-foreground">
            {isLogin ? "Belum punya akun?" : "Sudah punya akun?"}{" "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="font-semibold text-primary hover:underline"
            >
              {isLogin ? "Daftar sekarang" : "Masuk di sini"}
            </button>
          </p>
        </div>
      </div>

      {/* RIGHT - ILLUSTRATION (DESKTOP ONLY) */}
      <div className="relative hidden flex-1 items-center justify-center overflow-hidden lg:flex gradient-primary">
        {/* blur */}
        <div className="absolute inset-0 opacity-15">
          <div className="absolute left-16 top-16 h-40 w-40 rounded-full bg-primary-foreground" />
          <div className="absolute bottom-24 right-16 h-56 w-56 rounded-full bg-primary-foreground" />
        </div>

        <div className="relative z-10 max-w-md text-center text-primary-foreground">
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-foreground/20 backdrop-blur">
            <CheckCircle2 className="h-10 w-10" />
          </div>

          <h2 className="mb-4 text-3xl font-bold">Kelola Tugas dengan Mudah</h2>

          <p className="text-lg text-primary-foreground/80">
            TaskFlow membantu Anda mengorganisir tugas secara sederhana, cepat,
            dan efektif.
          </p>

          <div className="mt-8 space-y-4">
            {[
              "Buat & kelola tugas",
              "Cari dan filter tugas",
              "Pantau progres harian",
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-center gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-foreground/20">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Memuat...</p>
          </div>
        </div>
      }
    >
      <AuthPageContent />
    </Suspense>
  );
}
