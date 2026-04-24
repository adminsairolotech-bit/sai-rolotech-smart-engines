/**
 * FEAT-001: Login Page Component
 * HERMES UNBREAKABLE RULES V1.0
 *
 * Requirements Lock:
 * ✅ Email input field
 * ✅ Password input field
 * ✅ Login button
 * ✅ Error messages display
 * ✅ Basic validation (empty + email format)
 *
 * NOT INCLUDED (scope boundary):
 * ❌ Backend API
 * ❌ Database
 * ❌ Authentication system
 */

import { useState } from "react";

// =============================================================================
// STATE MANAGEMENT (MT-002)
// =============================================================================

interface LoginState {
  email: string;
  password: string;
  error: string;
}

export function Login() {
  const [email, setEmail] = useState<LoginState["email"]>("");
  const [password, setPassword] = useState<LoginState["password"]>("");
  const [error, setError] = useState<LoginState["error"]>("");

  // =============================================================================
  // VALIDATION LOGIC (MT-003)
  // =============================================================================

  /**
   * Validates user input before login attempt
   * @returns true if valid, false if error set
   */
  const validateInput = (): boolean => {
    // Validation 1: Empty fields check
    if (!email.trim() || !password.trim()) {
      setError("All fields are required");
      return false;
    }

    // Validation 2: Email format check
    if (!email.includes("@") || !email.includes(".")) {
      setError("Invalid email format");
      return false;
    }

    // Validation 3: Email minimum length
    if (email.length < 5) {
      setError("Email is too short");
      return false;
    }

    // Validation 4: Password minimum length
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }

    return true;
  };

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  /**
   * Handle login button click
   * MT-003 + MT-004: Validation + Error Display
   */
  const handleLogin = (): void => {
    // Clear previous error
    setError("");

    // Run validation
    if (!validateInput()) {
      console.log("[FEAT-001] Validation failed:", error);
      return;
    }

    // Success case - console log only (no API in scope)
    console.log("[FEAT-001] Login triggered successfully");
    console.log("[FEAT-001] Email:", email);

    // Clear form on success
    setEmail("");
    setPassword("");
  };

  /**
   * Clear error when user starts typing
   * MT-004: Error reset on valid input
   */
  const handleInputChange = (
    field: "email" | "password",
    value: string
  ): void => {
    // Clear error when user starts correcting
    if (error) {
      setError("");
    }

    // Update appropriate field
    if (field === "email") {
      setEmail(value);
    } else {
      setPassword(value);
    }
  };

  /**
   * Handle keyboard enter key
   */
  const handleKeyPress = (e: React.KeyboardEvent): void => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  // =============================================================================
  // RENDER - UI LAYOUT (MT-001)
  // =============================================================================

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        {/* Header */}
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            FEAT-001 | HERMES Validation Required
          </p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={(e) => e.preventDefault()}>
          {/* Email Input */}
          <div className="space-y-1">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter your email"
              className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              data-testid="email-input"
            />
          </div>

          {/* Password Input */}
          <div className="space-y-1">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter your password"
              className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              data-testid="password-input"
            />
          </div>

          {/* Error Display (MT-004) */}
          {error && (
            <div
              className="p-3 bg-red-50 border border-red-200 rounded-md"
              data-testid="error-message"
              role="alert"
            >
              <p className="text-sm text-red-600 flex items-center">
                <svg
                  className="w-4 h-4 mr-2 inline"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                {error}
              </p>
            </div>
          )}

          {/* Login Button */}
          <button
            type="button"
            onClick={handleLogin}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            data-testid="login-button"
          >
            Sign in
          </button>
        </form>

        {/* Footer Info */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">
            HERMES FEAT-001 | Validation: REQUIRED
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
