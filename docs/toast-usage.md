# Custom Toast Component - Orange Theme

Custom Toast component berdasarkan Sonner dari shadcn/ui dengan tema orange yang modern dan konsisten.

## Installation

Component sudah terintegrasi di `app/layout.tsx`. Tidak perlu setup tambahan.

## API

### Import

```typescript
import { toast } from "@/lib/toast";
```

### Methods

#### `toast.success(message, options?)`

Success toast dengan soft orange/green-tinted background.

```typescript
toast.success("Profile updated successfully", {
  description: "Your changes have been saved",
  duration: 4000,
});
```

#### `toast.error(message, options?)`

Error toast dengan orange-red accent dan strong contrast.

```typescript
toast.error("Failed to save", {
  description: "Please try again later",
  duration: 5000,
});
```

#### `toast.info(message, options?)`

Info toast dengan subtle orange accent.

```typescript
toast.info("New feature available", {
  description: "Check out the new dashboard",
});
```

#### `toast.loading(message, options?)`

Loading toast dengan subtle orange accent.

```typescript
const toastId = toast.loading("Saving changes...");

// Dismiss when done
toast.dismiss(toastId);
toast.success("Changes saved!");
```

#### `toast.warning(message, options?)`

Warning toast dengan amber/orange accent.

```typescript
toast.warning("Please review your changes", {
  description: "Some fields may need attention",
});
```

#### `toast.promise(promise, messages)`

Promise toast untuk async operations.

```typescript
toast.promise(
  updateProfile(data),
  {
    loading: "Updating profile...",
    success: "Profile updated successfully!",
    error: "Failed to update profile",
  }
);
```

#### `toast.dismiss(toastId?)`

Dismiss specific toast or all toasts.

```typescript
// Dismiss specific toast
toast.dismiss(toastId);

// Dismiss all toasts
toast.dismiss();
```

## Options

```typescript
interface ToastOptions {
  description?: string;        // Optional description text
  duration?: number;           // Duration in milliseconds (default: 4000)
  action?: {                  // Optional action button
    label: string;
    onClick: () => void;
  };
  cancel?: {                   // Optional cancel button
    label: string;
    onClick?: () => void;
  };
}
```

## Examples

### Basic Usage

```typescript
import { toast } from "@/lib/toast";

// Success
toast.success("Operation completed!");

// Error
toast.error("Something went wrong");

// Info
toast.info("New update available");

// Loading
toast.loading("Processing...");
```

### With Description

```typescript
toast.success("Login successful", {
  description: "Welcome back to TaskFlow",
});

toast.error("Login failed", {
  description: "Please check your credentials",
});
```

### With Action Button

```typescript
toast.error("Failed to delete", {
  description: "The item could not be deleted",
  action: {
    label: "Retry",
    onClick: () => handleRetry(),
  },
  cancel: {
    label: "Dismiss",
  },
});
```

### Promise Toast

```typescript
const handleSave = async () => {
  await toast.promise(
    saveData(),
    {
      loading: "Saving...",
      success: "Data saved successfully!",
      error: (err) => `Failed to save: ${err.message}`,
    }
  );
};
```

### Loading with Manual Dismiss

```typescript
const handleAsyncOperation = async () => {
  const toastId = toast.loading("Processing request...");
  
  try {
    await someAsyncOperation();
    toast.dismiss(toastId);
    toast.success("Operation completed!");
  } catch (error) {
    toast.dismiss(toastId);
    toast.error("Operation failed");
  }
};
```

## Styling

### Color Scheme

- **Success**: Soft orange/green-tinted background (`from-orange-50 to-amber-50`)
- **Error**: Orange-red accent (`from-red-50 to-orange-50`)
- **Info**: Subtle orange accent (`from-orange-50 to-amber-50`)
- **Warning**: Amber/orange accent (`from-amber-50 to-orange-50`)
- **Loading**: Subtle orange accent (`from-orange-50 to-amber-50`)

### Dark Mode

Semua toast types mendukung dark mode dengan opacity yang disesuaikan untuk readability.

### Icons

- **Success**: `CheckCircle2` (orange-600/orange-400)
- **Error**: `XCircle` (red-600/red-400)
- **Info**: `Info` (orange-600/orange-400)
- **Warning**: `AlertCircle` (amber-600/amber-400)
- **Loading**: `Loader2` dengan spin animation (orange-600/orange-400)

## Accessibility

- ✅ High contrast untuk readability
- ✅ Focus-safe dengan ring indicators
- ✅ Proper ARIA labels
- ✅ Keyboard navigation support
- ✅ Screen reader friendly

## Customization

Styling dapat diubah di:
- `components/ui/sonner.tsx` - Component configuration
- `app/globals.css` - Custom CSS styles
- `lib/toast.ts` - API wrapper

## Migration from Sonner

Jika sebelumnya menggunakan `toast` dari `sonner` langsung:

```typescript
// Before
import { toast } from "sonner";
toast.success("Message");

// After
import { toast } from "@/lib/toast";
toast.success("Message");
```

API tetap sama, hanya perlu mengubah import path.

