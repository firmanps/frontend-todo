"use client";

import { Sidebar, SidebarTrigger } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import type { User as UserType } from "@/types/todo";
import { Camera, Mail, Save, User } from "lucide-react";

const ProfilePage = () => {
  const router = useRouter();

  const [user, setUser] = useState<UserType | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [todosTotal, setTodosTotal] = useState(0);
  const [todosDone, setTodosDone] = useState(0);

  useEffect(() => {
    // ✅ aman di Next.js: hanya jalan di client
    const savedUser = localStorage.getItem("user");
    if (!savedUser) {
      router.replace("/auth");
      return;
    }

    const parsed = JSON.parse(savedUser) as UserType;
    setUser(parsed);
    setName((parsed as any).name ?? ""); // kalau type kamu pakai "username", ganti di sini
    setEmail(parsed.email ?? "");
    setPassword(parsed.email ?? "");

    // ambil stats todos (sekali saat mount)
    const todos = JSON.parse(localStorage.getItem("todos") || "[]") as Array<{
      completed?: boolean;
    }>;
    setTodosTotal(todos.length);
    setTodosDone(todos.filter((t) => t.completed).length);
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);

    // simulasi delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const updatedUser = { ...user, name, email } as any;
    localStorage.setItem("user", JSON.stringify(updatedUser));
    setUser(updatedUser);

    toast.success("Profil berhasil diperbarui!");

    setIsLoading(false);
  };

  const getInitials = (fullName: string) => {
    return fullName
      .trim()
      .split(/\s+/)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const initials = useMemo(() => {
    const displayName = (user as any)?.name || (user as any)?.username || "U";
    return getInitials(displayName);
  }, [user]);

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(false)} />

      <main className="flex-1 p-6 lg:p-8 overflow-auto">
        <div className="max-w-2xl mx-auto animate-fade-in">
          {/* Header */}
          <div className="mb-8 flex items-start gap-3">
            <SidebarTrigger onClick={() => setSidebarOpen(true)} />
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Profil
              </h1>
              <div>
                <p className="text-muted-foreground">
                  Lihat dan perbarui informasi profil Anda
                </p>
              </div>
            </div>
          </div>

          {/* Profile Card */}
          <div className="bg-card rounded-2xl shadow-medium border border-border/50 overflow-hidden">
            {/* Cover */}
            <div className="h-32 gradient-primary relative">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-4 left-8 w-16 h-16 bg-primary-foreground rounded-full" />
                <div className="absolute bottom-4 right-12 w-24 h-24 bg-primary-foreground rounded-full" />
              </div>
            </div>

            {/* Avatar */}
            <div className="relative px-6">
              <div className="absolute -top-12 left-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-2xl gradient-accent flex items-center justify-center text-2xl font-bold text-accent-foreground shadow-large border-4 border-card">
                    {initials}
                  </div>
                  <button
                    type="button"
                    className="absolute -bottom-1 -right-1 w-8 h-8 rounded-lg bg-card shadow-soft border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => toast.success("asdd")}
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="px-6 pt-16 pb-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Username
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Username"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nama@email.com"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="********"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full sm:w-auto"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        Menyimpan...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Save className="w-4 h-4" />
                        Simpan Perubahan
                      </span>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* Stats Card */}
          <div className="mt-6 bg-card rounded-xl p-6 shadow-soft border border-border/50">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Statistik Anda
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-secondary rounded-lg">
                <p className="text-2xl font-bold text-foreground">
                  {todosTotal}
                </p>
                <p className="text-sm text-muted-foreground">Total Tugas</p>
              </div>
              <div className="text-center p-4 bg-secondary rounded-lg">
                <p className="text-2xl font-bold text-foreground">
                  {todosDone}
                </p>
                <p className="text-sm text-muted-foreground">Selesai</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
