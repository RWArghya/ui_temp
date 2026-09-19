# Backend API Requirements — Authentication, OTP & Identity

> **Module**: Auth (`internal/auth/` in backend)  
> **Route Group**: `/api/v1/auth` (Public rate-limited & Authenticated session)  
> **Client Source**: [`src/pages/Auth.jsx`](file:///c:/Users/MP2KK/ui_temp/src/pages/Auth.jsx) and [`src/store/auth.js`](file:///c:/Users/MP2KK/ui_temp/src/store/auth.js)  
> **Backend Architecture Reference**: [`H2S-Innovator-Dashboard-Backend.md §3 & §4`](file:///c:/Users/MP2KK/ui_temp/H2S-Innovator-Dashboard-Backend.md#3-http-layer--chi-with-public-vs-authenticated-route-groups)

---

## 1. Endpoints Overview

| Feature | UI Action | Endpoint | Method | Rate Limit | Request Body | Expected Response Shape |
|---|---|---|---|---|---|---|
| **Register User** | Signup form submit | `/api/v1/auth/register` | `POST` | 10/min (IP) | `{ name, email, countryCode, mobile, password }` | `{ success: true, userId: string, message: string }` |
| **Verify Signup OTP** | Enter 6-digit code after signup | `/api/v1/auth/signup/otp/verify` | `POST` | 10/min (IP) | `{ email: string, code: string }` | `{ success: true, token: string, refreshToken: string, user: <UserSummary> }` |
| **Resend Signup OTP** | Click "Resend code" | `/api/v1/auth/signup/otp/resend` | `POST` | 5/min (IP) | `{ email: string }` | `{ success: true, message: string }` |
| **Password Login** | Standard login submit | `/api/v1/auth/login` | `POST` | 10/min (IP) | `{ email: string, password: string }` | `{ success: true, token: string, refreshToken: string, user: <UserSummary> }` |
| **Request Login OTP** | "Log in with OTP instead" $\rightarrow$ submit email | `/api/v1/auth/login/otp/request` | `POST` | 5/min (IP) | `{ email: string }` | `{ success: true, message: string }` |
| **Verify Login OTP** | Enter 6-digit code for passwordless login | `/api/v1/auth/login/otp/verify` | `POST` | 10/min (IP) | `{ email: string, code: string }` | `{ success: true, token: string, refreshToken: string, user: <UserSummary> }` |
| **Token Refresh** | Background silent refresh | `/api/v1/auth/refresh` | `POST` | None | `{ refreshToken: string }` | `{ success: true, token: string, refreshToken: string }` |
| **Logout** | Profile dropdown $\rightarrow$ "Log out" | `/api/v1/auth/logout` | `POST` | Bearer Token | `{ refreshToken: string }` | `{ success: true, message: "Logged out" }` |
| **Forgot Password** | "Forgot password?" modal submit | `/api/v1/auth/password/forgot` | `POST` | 5/min (IP) | `{ email: string }` | `{ success: true, message: string }` |
| **Reset Password** | Reset link form submit | `/api/v1/auth/password/reset` | `POST` | 5/min (IP) | `{ token: string, newPassword: string }` | `{ success: true, message: "Password updated successfully" }` |
| **Initial Onboarding** | Track & intent picker on `/onboarding` | `/api/v1/auth/onboarding` | `POST` | Bearer Token | `{ landingView: string, intents: string[] }` | `{ success: true, user: <UserSummary> }` |

---

## 2. Detailed Request & Response Specifications

### 2.1 Register User
**`POST /api/v1/auth/register`**
* Creates an unverified user record and triggers an async email containing a 6-digit OTP code (valid for 10 minutes).
* **Request Body**:
  ```json
  {
    "name": "Aarav Sharma",
    "email": "aarav.sharma@example.com",
    "countryCode": "+91",
    "mobile": "9876543210",
    "password": "Password123"
  }
  ```
* **Response (201 Created)**:
  ```json
  {
    "success": true,
    "userId": "usr_7f8a9b1c-3d2e-4a5b-8c7d-9e0f1a2b3c4d",
    "message": "Verification code sent to aarav.sharma@example.com"
  }
  ```

---

### 2.2 Verify Signup OTP
**`POST /api/v1/auth/signup/otp/verify`**
* Validates the 6-digit code, marks the user `verified = true`, and issues authentication tokens.
* **Request Body**:
  ```json
  {
    "email": "aarav.sharma@example.com",
    "code": "492817"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "ref_9a8b7c6d5e4f3a2b1c0d",
    "user": {
      "id": "usr_7f8a9b1c-3d2e-4a5b-8c7d-9e0f1a2b3c4d",
      "name": "Aarav Sharma",
      "email": "aarav.sharma@example.com",
      "onboarded": false
    }
  }
  ```

---

### 2.3 Passwordless Login OTP Flow
Built into [`src/pages/Auth.jsx`](file:///c:/Users/MP2KK/ui_temp/src/pages/Auth.jsx) via "Log in with OTP instead".

#### Step A: Request OTP
**`POST /api/v1/auth/login/otp/request`**
* **Request Body**:
  ```json
  {
    "email": "aarav.sharma@example.com"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Login code sent to email"
  }
  ```

#### Step B: Verify OTP & Sign In
**`POST /api/v1/auth/login/otp/verify`**
* **Request Body**:
  ```json
  {
    "email": "aarav.sharma@example.com",
    "code": "839201"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "ref_1a2b3c4d5e6f7a8b9c0d",
    "user": {
      "id": "usr_7f8a9b1c-3d2e-4a5b-8c7d-9e0f1a2b3c4d",
      "name": "Aarav Sharma",
      "email": "aarav.sharma@example.com",
      "onboarded": true
    }
  }
  ```

---

### 2.4 Token Refresh & Rotation
**`POST /api/v1/auth/refresh`**
* Exchanges an opaque refresh token for a new 15-minute access token and a rotated refresh token.
* **Request Body**:
  ```json
  {
    "refreshToken": "ref_1a2b3c4d5e6f7a8b9c0d"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "ref_new_8f7e6d5c4b3a2a1"
  }
  ```

---

### 2.5 Password Recovery Flow

#### Step A: Request Reset Token
**`POST /api/v1/auth/password/forgot`**
* Generates a single-use reset token and enqueues the password reset email.
* **Request Body**:
  ```json
  {
    "email": "aarav.sharma@example.com"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "If an account exists with this email, a reset link has been sent."
  }
  ```

#### Step B: Submit New Password
**`POST /api/v1/auth/password/reset`**
* **Request Body**:
  ```json
  {
    "token": "rst_4b3a2c1d-0e9f-8a7b-6c5d-4e3f2a1b0c9d",
    "newPassword": "NewSecurePassword456"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Password updated successfully. Please log in with your new password."
  }
  ```
