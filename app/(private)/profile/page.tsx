"use client";

import { Sidebar, SidebarTrigger } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { getCsrfToken } from "@/lib/axios";
import { Camera, KeyIcon, Mail, Save, User } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

const ProfilePage = () => {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, refetch } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [todosTotal, setTodosTotal] = useState(0);
  const [todosDone, setTodosDone] = useState(0);

  // Proteksi route: redirect ke /auth jika belum login
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/auth");
    }
  }, [isAuthenticated, authLoading, router]);

  // Set form values dari user data
  useEffect(() => {
    if (user) {
      setName(user.username || "");
      setEmail(user.email || "");
      setPassword(""); // Jangan set password dari user data
    }
  }, [user]);

  // Ambil stats todos dari localStorage
  useEffect(() => {
    const todos = JSON.parse(localStorage.getItem("todos") || "[]") as Array<{
      completed?: boolean;
    }>;
    setTodosTotal(todos.length);
    setTodosDone(todos.filter((t) => t.completed).length);
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("File harus berupa gambar");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Ukuran gambar maksimal 5MB");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      setSelectedImage(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        toast.success(
          "Gambar dipilih. Klik 'Simpan Perubahan' untuk mengupload."
        );
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !hasChanges) return;

    setIsLoading(true);

    try {
      // Dapatkan CSRF token terlebih dahulu
      const csrfToken = await getCsrfToken();

      // Buat FormData untuk multipart/form-data
      const formData = new FormData();

      // Tambahkan fields yang berubah
      if (name !== user.username && name.trim() !== "") {
        formData.append("username", name.trim());
      }

      if (email !== user.email && email.trim() !== "") {
        formData.append("email", email.trim());
      }

      if (password.trim() !== "") {
        // Validasi password minimal 6 karakter
        if (password.length < 6) {
          toast.error("Password minimal 6 karakter");
          setIsLoading(false);
          return;
        }
        formData.append("password", password);
      }

      // Tambahkan image jika ada
      if (selectedImage) {
        formData.append("image", selectedImage);
        console.log(
          "Uploading image:",
          selectedImage.name,
          selectedImage.size,
          "bytes"
        );
      }

      // Hit update profile endpoint
      const response = await fetch("/api/user/updateprofile", {
        method: "PATCH",
        credentials: "include", // Include cookies (access_token httpOnly)
        headers: {
          ...(csrfToken && { "X-CSRF-Token": csrfToken }), // Sertakan CSRF token jika ada
          // Jangan set Content-Type, biarkan browser set otomatis dengan boundary untuk multipart/form-data
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || data.error || "Gagal memperbarui profil"
        );
      }

      toast.success(data.message || "Profil berhasil diperbarui!");

      // Reset form
      setPassword("");
      setSelectedImage(null);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Refresh auth data untuk mendapatkan data terbaru (termasuk image baru)
      await refetch();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Gagal memperbarui profil";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
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
    if (!user) return "U";
    return getInitials(user.username || user.email || "U");
  }, [user]);

  // Cek apakah ada perubahan pada form
  const hasChanges = useMemo(() => {
    if (!user) return false;
    return (
      name !== user.username ||
      email !== user.email ||
      password.trim() !== "" ||
      selectedImage !== null
    );
  }, [user, name, email, password, selectedImage]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null; // Will redirect via useEffect
  }

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
                  {imagePreview ? (
                    <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-large border-4 border-card">
                      <Image
                        src={imagePreview}
                        alt="Preview"
                        width={1000}
                        height={1000}
                        className="w-full h-full object-contain"
                        priority
                      />
                    </div>
                  ) : user.profile?.image ? (
                    <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-large border-4 border-card">
                      <Image
                        src={user.profile.image}
                        alt={user.username}
                        width={1000}
                        height={1000}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-2xl gradient-accent flex items-center justify-center text-2xl font-bold text-accent-foreground shadow-large border-4 border-card">
                      {initials}
                    </div>
                  )}
                  <button
                    type="button"
                    className="absolute -bottom-1 -right-1 w-8 h-8 rounded-lg bg-card shadow-soft border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
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
                    Password
                  </Label>
                  <div className="relative">
                    <KeyIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="********"
                      className="pl-10"
                      minLength={6}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <div className="flex flex-col gap-3">
                    {/* Info jika ada gambar yang akan di-upload */}
                    {selectedImage && (
                      <div className="text-sm text-muted-foreground bg-secondary/50 rounded-lg p-3">
                        <p className="font-medium text-foreground mb-1">
                          Gambar akan di-upload:
                        </p>
                        <p className="text-xs">
                          {selectedImage.name} (
                          {(selectedImage.size / 1024).toFixed(2)} KB)
                        </p>
                      </div>
                    )}
                    <Button
                      type="submit"
                      disabled={isLoading || !hasChanges}
                      className="w-full sm:w-auto"
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                          {selectedImage
                            ? "Mengupload gambar..."
                            : "Menyimpan..."}
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Save className="w-4 h-4" />
                          Simpan Perubahan
                          {selectedImage && (
                            <span className="text-xs opacity-75">
                              (+ gambar)
                            </span>
                          )}
                        </span>
                      )}
                    </Button>
                  </div>
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
