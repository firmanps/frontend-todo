"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, ListChecks, Sparkles, Users } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

const features = [
  {
    icon: ListChecks,
    title: "Kelola Tugas",
    description:
      "Buat, edit, dan hapus tugas dengan mudah. Tandai selesai dengan satu klik.",
  },
  {
    icon: Sparkles,
    title: "Cari & Filter",
    description:
      "Temukan tugas dengan cepat menggunakan pencarian dan filter yang powerful.",
  },
  {
    icon: Users,
    title: "Profil Personal",
    description: "Kelola profil Anda dan lihat statistik produktivitas harian.",
  },
];

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Navbar */}
      <nav className="border-b border-border/40">
        <div className="container mx-auto flex items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <Image
              src="/icon2.png"
              alt="Logo"
              width={3000}
              height={3000}
              className="h-10 w-10 shrink-0 rounded-sm"
              sizes="32px"
              priority
            />
            <span className="truncate text-base font-bold text-foreground sm:text-lg">
              TaskFlow
            </span>
          </div>

          <Button
            onClick={() => router.push("/auth")}
            variant="outline"
            className="shrink-0"
          >
            Masuk
          </Button>
        </div>
      </nav>

      {/* Main */}
      <main className="flex-1">
        {/* Hero + Features */}
        <section className="relative isolate overflow-hidden">
          {/* Background decoration */}
          <div className="pointer-events-none absolute left-1/2 -top-24 -z-10 h-[min(34rem,90vw)] w-[min(34rem,90vw)] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

          {/* ✅ bikin “area landing” pas & rapi di desktop */}
          <div className="container mx-auto px-4 pt-12 pb-16 sm:px-6 sm:pt-16 sm:pb-20 lg:pt-28 lg:pb-24">
            {/* ✅ Hero text (max width) */}
            <div className="mx-auto max-w-3xl text-center">
              <div className="mx-auto mb-5 inline-flex max-w-full items-center justify-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs font-medium text-[#F97C19] sm:text-sm">
                <Sparkles className="h-4 w-4 shrink-0" />
                <span className="truncate">Produktivitas tanpa batas</span>
              </div>

              <h1 className="mb-5 text-balance text-3xl font-bold leading-tight text-foreground sm:text-5xl lg:text-6xl">
                Kelola Tugas dengan{" "}
                <span className="text-gradient-primary">Lebih Mudah</span>
              </h1>

              <p className="mx-auto mb-8 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
                TaskFlow membantu Anda mengorganisir tugas sehari-hari dengan
                cara yang sederhana, intuitif, dan menyenangkan. Mulai
                produktivitas Anda sekarang!
              </p>

              <div className="mx-auto flex w-full max-w-md flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center sm:gap-4">
                <Button
                  size="lg"
                  onClick={() => router.push("/auth")}
                  className="gradient-primary-hover w-full gap-2 text-primary-foreground sm:w-auto"
                >
                  Mulai Gratis
                  <ArrowRight className="h-4 w-4" />
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => router.push("/auth")}
                  className="w-full sm:w-auto"
                >
                  Pelajari Lebih Lanjut
                </Button>
              </div>
            </div>

            {/* ✅ Features (DI LUAR max-w-3xl biar desktop lebar) */}
            <div
              className="
                mx-auto mt-14
                grid grid-cols-1 gap-6
                sm:mt-16 sm:grid-cols-2 sm:gap-8
                lg:mt-20 lg:grid-cols-3 lg:gap-10
                max-w-6xl lg:max-w-7xl
              "
            >
              {features.map((feature, i) => (
                <div
                  key={i}
                  className="
                    rounded-3xl border border-border/50 bg-card
                    p-7 sm:p-8 lg:p-10
                    shadow-xl shadow-orange-500/20
                    transition-all duration-300 ease-out
                    hover:-translate-y-2
                    hover:shadow-2xl hover:shadow-orange-500/35
                  "
                >
                  <div
                    className="
                      gradient-primary mx-auto mb-6
                      flex items-center justify-center
                      h-12 w-12
                      sm:h-14 sm:w-14
                      lg:h-16 lg:w-16
                      rounded-2xl text-primary-foreground
                    "
                  >
                    <feature.icon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8" />
                  </div>

                  <h3 className="mb-3 text-center text-lg font-semibold text-foreground sm:text-xl lg:text-2xl">
                    {feature.title}
                  </h3>

                  <p className="text-center text-sm leading-relaxed text-muted-foreground sm:text-base lg:text-lg">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative mt-auto overflow-hidden border-t border-border/40 py-6 sm:py-8">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[min(22rem,80vw)] w-[min(22rem,80vw)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl"
        />

        <div className="container mx-auto px-4 text-center text-xs text-muted-foreground sm:px-6 sm:text-sm">
          © 2024 <span className="font-medium text-foreground">TaskFlow</span>.
          Dibuat dengan <span className="text-red-500">❤️</span> untuk
          produktivitas <span className="inline-block">🧑‍💻</span> Anda.
        </div>
      </footer>
    </div>
  );
}
