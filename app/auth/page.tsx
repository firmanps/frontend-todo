"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, CheckCircle2, Lock, Mail, User } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function AuthPage() {
  const router = useRouter();

  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // simulasi request API
      await new Promise((r) => setTimeout(r, 1000));

      // contoh validasi error (simulasi)
      if (!email || !password) {
        throw new Error("Email dan password wajib diisi");
      }

      // mock auth success
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: "1",
          name: isLogin ? "User" : name,
          email,
        })
      );

      toast.success(
        isLogin ? "Berhasil masuk ke akun Anda" : "Akun berhasil dibuat",
        {
          description: isLogin
            ? "Selamat datang kembali di TaskFlow."
            : "Selamat datang di TaskFlow.",
        }
      );

      router.push("/dashboard");
    } catch (error) {
      toast.error("Terjadi kesalahan ❌", {
        description:
          error instanceof Error ? error.message : "Silakan coba lagi.",
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
                width={200}
                height={200}
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
