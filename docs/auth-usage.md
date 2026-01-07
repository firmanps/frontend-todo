# Auth System Usage Guide

Sistem authentication menggunakan cookies httpOnly untuk menyimpan `access_token`. Frontend tidak bisa membaca token secara langsung, jadi satu-satunya cara untuk cek login adalah dengan hit endpoint `/api/v1/user/me`.

## Komponen yang Tersedia

### 1. `getMe()` - Fungsi untuk cek authentication
```typescript
import { getMe } from "@/lib/auth";

const { user, isAuthenticated } = await getMe();
// user: User | null
// isAuthenticated: boolean
```

### 2. `useAuth()` - Hook untuk akses auth state
```typescript
import { useAuth } from "@/contexts/AuthContext";

const { user, isAuthenticated, isLoading, refetch } = useAuth();
```

### 3. `useRequireAuth()` - Hook untuk proteksi route
```typescript
import { useRequireAuth } from "@/hooks/useRequireAuth";

// Otomatis redirect ke /auth jika belum login
useRequireAuth();
```

## Contoh Penggunaan

### 1. Proteksi Route (Redirect ke /auth jika belum login)

```typescript
"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/auth");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return null; // Akan redirect
  }

  return <div>Protected Content</div>;
}
```

### 2. Tampilkan Nama User di Navbar/UI

```typescript
"use client";

import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";

export function UserProfile() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated || !user) {
    return <a href="/auth">Login</a>;
  }

  return (
    <div className="flex items-center gap-2">
      {user.profile?.image ? (
        <Image
          src={user.profile.image}
          width={32}
          height={32}
          alt={user.username}
          className="rounded-full"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          {user.username.charAt(0).toUpperCase()}
        </div>
      )}
      <span>{user.username}</span>
    </div>
  );
}
```

### 3. Conditional Rendering Berdasarkan Auth Status

```typescript
"use client";

import { useAuth } from "@/contexts/AuthContext";

export function Navigation() {
  const { isAuthenticated } = useAuth();

  return (
    <nav>
      {isAuthenticated ? (
        <>
          <a href="/dashboard">Dashboard</a>
          <a href="/profile">Profile</a>
        </>
      ) : (
        <>
          <a href="/auth">Login</a>
          <a href="/auth">Register</a>
        </>
      )}
    </nav>
  );
}
```

### 4. Manual Check Auth (Tanpa Context)

```typescript
import { getMe } from "@/lib/auth";

async function checkUser() {
  const { user, isAuthenticated } = await getMe();
  
  if (isAuthenticated) {
    console.log("User:", user);
  } else {
    console.log("Not logged in");
  }
}
```

### 5. Refresh Auth State

```typescript
"use client";

import { useAuth } from "@/contexts/AuthContext";

export function RefreshButton() {
  const { refetch } = useAuth();

  const handleRefresh = async () => {
    await refetch(); // Re-check authentication
  };

  return <button onClick={handleRefresh}>Refresh Auth</button>;
}
```

## Response Format

### Success (200)
```json
{
  "id": "fa431f62-61e0-4073-9c1a-457f190025a4",
  "username": "admin@demo.com",
  "email": "admin@demo.com",
  "profile": {
    "image": "https://res.cloudinary.com/dbhnbrxjb/image/upload/v1767698082/profile_todo_default_oovtib.png"
  }
}
```

### Unauthorized (401)
```json
{
  "message": "Unauthorized",
  "statusCode": 401
}
```

## Catatan Penting

1. **Cookies httpOnly**: Token tidak bisa dibaca via JavaScript, hanya bisa dikirim otomatis dengan `credentials: "include"`
2. **CSRF Token**: Setiap request perlu include CSRF token di header `X-CSRF-Token`
3. **Single Source of Truth**: Endpoint `/api/v1/user/me` adalah satu-satunya cara untuk cek login status
4. **Auto Refresh**: Auth context akan auto-check saat component mount
5. **Manual Refresh**: Gunakan `refetch()` untuk re-check authentication

