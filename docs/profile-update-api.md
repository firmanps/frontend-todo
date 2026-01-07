# Profile Update API Documentation

## Endpoint
`PATCH /api/v1/user/updateprofile`

## Request Format
- **Content-Type**: `multipart/form-data`
- **Authentication**: httpOnly cookie (access_token)
- **CSRF Protection**: Required (X-CSRF-Token header)

## Request Fields

All fields are **optional**, but at least one field must be provided:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `username` | string | No | New username |
| `email` | string | No | New email address |
| `password` | string | No | New password (min 6 characters) |
| `image` | file | No | Profile image file (image/*, max 5MB) |

## Frontend Implementation Example

### Using Fetch API

```typescript
const updateProfile = async (formData: FormData) => {
  // Get CSRF token
  const csrfToken = await getCsrfToken();

  const response = await fetch("/api/user/updateprofile", {
    method: "PATCH",
    credentials: "include", // Include httpOnly cookies
    headers: {
      ...(csrfToken && { "X-CSRF-Token": csrfToken }),
      // Don't set Content-Type, browser will set it automatically with boundary
    },
    body: formData,
  });

  const data = await response.json();
  return data;
};

// Usage
const formData = new FormData();
formData.append("username", "newusername");
formData.append("email", "newemail@example.com");
formData.append("password", "newpassword123");
formData.append("image", imageFile); // File object

await updateProfile(formData);
```

### Using Axios

```typescript
import axios from "axios";
import { getCsrfToken } from "@/lib/axios";

const updateProfile = async (formData: FormData) => {
  const csrfToken = await getCsrfToken();

  const response = await axios.patch("/api/user/updateprofile", formData, {
    withCredentials: true, // Include httpOnly cookies
    headers: {
      "Content-Type": "multipart/form-data",
      ...(csrfToken && { "X-CSRF-Token": csrfToken }),
    },
  });

  return response.data;
};
```

## Backend Handling (Expected)

### 1. Parse Multipart Form Data

```javascript
// Example using Express + multer
const multer = require("multer");
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("File must be an image"), false);
    }
  },
});

router.patch(
  "/v1/user/updateprofile",
  authenticate, // Middleware untuk cek access_token dari cookie
  csrfProtection, // Middleware untuk cek CSRF token
  upload.single("image"), // Handle single file upload
  async (req, res) => {
    // req.body contains: username, email, password
    // req.file contains: image file (if uploaded)
  }
);
```

### 2. Validation Rules

```javascript
// Validation rules
const validationRules = {
  username: {
    optional: true,
    type: "string",
    minLength: 3,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9_]+$/, // Alphanumeric and underscore only
  },
  email: {
    optional: true,
    type: "string",
    format: "email",
    maxLength: 255,
  },
  password: {
    optional: true,
    type: "string",
    minLength: 6,
    maxLength: 100,
  },
  image: {
    optional: true,
    type: "file",
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  },
};

// Check at least one field is provided
const hasChanges =
  req.body.username ||
  req.body.email ||
  req.body.password ||
  req.file;

if (!hasChanges) {
  return res.status(400).json({
    message: "At least one field must be provided",
    statusCode: 400,
  });
}
```

### 3. Update User Profile

```javascript
// Example update logic
const updateData = {};

if (req.body.username) {
  // Check if username already exists
  const existingUser = await User.findOne({ username: req.body.username });
  if (existingUser && existingUser.id !== req.user.id) {
    return res.status(409).json({
      message: "Username already exists",
      statusCode: 409,
    });
  }
  updateData.username = req.body.username;
}

if (req.body.email) {
  // Check if email already exists
  const existingUser = await User.findOne({ email: req.body.email });
  if (existingUser && existingUser.id !== req.user.id) {
    return res.status(409).json({
      message: "Email already exists",
      statusCode: 409,
    });
  }
  updateData.email = req.body.email;
}

if (req.body.password) {
  // Hash password
  updateData.password = await bcrypt.hash(req.body.password, 10);
}

if (req.file) {
  // Upload image to cloud storage (e.g., Cloudinary)
  const imageUrl = await uploadToCloudinary(req.file);
  updateData["profile.image"] = imageUrl;
}

// Update user
await User.findByIdAndUpdate(req.user.id, updateData);

// Return updated user
const updatedUser = await User.findById(req.user.id);
res.json({
  message: "Profile updated successfully",
  user: updatedUser,
});
```

## Response Format

### Success (200)
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": "fa431f62-61e0-4073-9c1a-457f190025a4",
    "username": "newusername",
    "email": "newemail@example.com",
    "profile": {
      "image": "https://res.cloudinary.com/.../newimage.png"
    }
  }
}
```

### Error (400) - No fields provided
```json
{
  "message": "At least one field must be provided",
  "statusCode": 400
}
```

### Error (409) - Username/Email already exists
```json
{
  "message": "Username already exists",
  "statusCode": 409
}
```

### Error (401) - Unauthorized
```json
{
  "message": "Unauthorized",
  "statusCode": 401
}
```

## Validation Rules Summary

1. **Username** (optional):
   - Type: string
   - Min length: 3 characters
   - Max length: 50 characters
   - Pattern: Alphanumeric and underscore only
   - Must be unique

2. **Email** (optional):
   - Type: string
   - Format: Valid email format
   - Max length: 255 characters
   - Must be unique

3. **Password** (optional):
   - Type: string
   - Min length: 6 characters
   - Max length: 100 characters
   - Should be hashed before storing

4. **Image** (optional):
   - Type: file
   - Max size: 5MB
   - Allowed types: image/jpeg, image/png, image/gif, image/webp
   - Should be uploaded to cloud storage

5. **General**:
   - At least one field must be provided
   - All fields are optional individually
   - Authentication required (httpOnly cookie)
   - CSRF token required

