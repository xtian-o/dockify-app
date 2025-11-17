"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { FaFingerprint, FaGithub, FaGoogle } from "react-icons/fa";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { formatName } from "@/lib/format-name";

export default function GetStartedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const error = searchParams.get("error");

  // Form fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [email, setEmail] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  // Use ref to track if error toast has been shown (survives re-renders)
  const errorToastShown = useRef(false);

  // Focus states
  const [firstNameFocused, setFirstNameFocused] = useState(false);
  const [middleNameFocused, setMiddleNameFocused] = useState(false);
  const [lastNameFocused, setLastNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);

  // Validation
  const isEmailValid = email.includes("@") && email.includes(".");
  const isOtpComplete = otp.length === 6;
  const isFormValid =
    firstName.trim() !== "" &&
    lastName.trim() !== "" &&
    isEmailValid &&
    termsAccepted;

  // Restore state from sessionStorage (if redirected back from OTP verification)
  useEffect(() => {
    const savedEmail = sessionStorage.getItem("signup_email_temp");
    const savedCodeSent = sessionStorage.getItem("signup_code_sent");

    if (savedEmail && savedCodeSent === "true") {
      setEmail(savedEmail);
      setCodeSent(true);
      // Clear sessionStorage after restoring
      sessionStorage.removeItem("signup_email_temp");
      sessionStorage.removeItem("signup_code_sent");
    }
  }, []);

  // Show error from URL params - PROFESSIONAL APPROACH
  useEffect(() => {
    if (!error || errorToastShown.current) return;

    console.log("[Get Started] Error detected:", error);
    console.log("[Get Started] About to show toast...");
    errorToastShown.current = true;

    // Show appropriate error toast
    let errorMessage = "Authentication Error";
    let errorDescription = "Something went wrong. Please try again.";

    switch (error) {
      case "Configuration":
        errorMessage = "Configuration Error";
        errorDescription = "Please check your authentication setup.";
        break;
      case "AccessDenied":
        errorMessage = "Access Denied";
        errorDescription = "Your account may be suspended or locked.";
        break;
      case "Verification":
        errorMessage = "Invalid verification code";
        errorDescription = "The code you entered is incorrect or expired. Please try again or request a new code.";
        setOtp(""); // Clear OTP input on error
        break;
    }

    // Show toast BEFORE clearing URL
    const toastId = toast.error(errorMessage, {
      description: errorDescription,
      duration: 10000,
    });

    console.log("[Get Started] Toast shown with ID:", toastId);

    // Clear error from URL AFTER toast is shown (with delay)
    setTimeout(() => {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("error");
      window.history.replaceState({}, "", newUrl.pathname + newUrl.search);
      console.log("[Get Started] URL cleaned");
    }, 500);
  }, [error]);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    try {
      // Check if user already exists (prevent duplicate sign-ups)
      const checkResponse = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const { exists } = await checkResponse.json();

      if (exists) {
        toast.error("Account already exists", {
          description: "An account with this email already exists. Please sign in instead.",
        });
        setLoading(false);
        return;
      }

      // User doesn't exist, proceed with sign-up
      // Save name to localStorage for later (after OTP verification)
      const fullName = [firstName, middleName, lastName]
        .filter(Boolean)
        .join(" ");
      localStorage.setItem("signup_name", fullName);
      localStorage.setItem("signup_email", email);

      // Use Auth.js signIn with email provider
      const result = await signIn("resend", {
        email,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Failed to send code", {
          description: result.error,
        });
        console.error("signIn error:", result.error);
      } else {
        setCodeSent(true);
        toast.success("Verification code sent!", {
          description: `Check your email at ${email}`,
        });
      }
    } catch (error) {
      console.error("Send code error:", error);
      toast.error("Error", {
        description: "Failed to send verification code.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOtpComplete) return;

    setLoading(true);
    try {
      // First check if a valid token exists for this email AND OTP
      const checkResponse = await fetch("/api/auth/check-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const { hasValidToken } = await checkResponse.json();

      if (!hasValidToken) {
        // No valid token found - either wrong code, expired, or never sent
        toast.error("Invalid or expired code", {
          description: "The verification code you entered is incorrect or has expired. Please try again or request a new code.",
          duration: 8000,
        });
        setOtp("");
        setLoading(false);
        return;
      }

      // Token is valid, now verify with Auth.js
      // Save state to sessionStorage so we can restore after redirect
      sessionStorage.setItem("signup_email_temp", email);
      sessionStorage.setItem("signup_code_sent", "true");

      // Call Auth.js callback (will redirect with error or success)
      const verifyUrl = `/api/auth/callback/resend?token=${otp}&email=${encodeURIComponent(email)}&callbackUrl=${encodeURIComponent(callbackUrl)}`;
      window.location.href = verifyUrl;
    } catch (error) {
      console.error("Verification error:", error);
      toast.error("Verification failed", {
        description: "Please check your code and try again.",
        duration: 8000,
      });
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    setOtp("");
    try {
      const result = await signIn("resend", {
        email,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Failed to resend code", {
          description: result.error,
        });
      } else {
        toast.success("New code sent!", {
          description: `Check your email at ${email}`,
        });
      }
    } catch (error) {
      console.error("Resend code error:", error);
      toast.error("Error", {
        description: "Failed to resend verification code.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-14rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-8">
        {/* Header */}
        <div className="flex flex-col items-center space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Get Started</h1>
          <p className="text-sm text-muted-foreground">
            Create your account to continue
          </p>
        </div>

        {/* Sign Up Form */}
        <div className="rounded-lg border p-8 shadow-sm">
          <form
            onSubmit={codeSent ? handleVerifyOTP : handleSendCode}
            className="space-y-6"
          >
            {/* Name Fields - Only show before code sent */}
            {!codeSent && (
              <div className="grid grid-cols-3 gap-3">
                {/* First Name */}
                <div className="relative">
                  <motion.label
                    htmlFor="firstName"
                    className={`absolute left-3 px-1 text-sm font-medium pointer-events-none origin-left z-10 ${
                      firstNameFocused || firstName.length > 0 ? "bg-background" : ""
                    }`}
                    initial={{
                      top: "50%",
                      fontSize: "0.875rem",
                      y: "-50%",
                    }}
                    animate={{
                      top:
                        firstNameFocused || firstName.length > 0
                          ? "-0.5rem"
                          : "50%",
                      fontSize:
                        firstNameFocused || firstName.length > 0
                          ? "0.75rem"
                          : "0.875rem",
                      y: firstNameFocused || firstName.length > 0 ? 0 : "-50%",
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    First Name
                  </motion.label>
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    placeholder={
                      firstNameFocused || firstName.length > 0 ? "John" : ""
                    }
                    required
                    autoComplete="given-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    onFocus={() => setFirstNameFocused(true)}
                    onBlur={() => {
                      setFirstName(formatName(firstName));
                      setFirstNameFocused(false);
                    }}
                    className="h-10"
                  />
                </div>

                {/* Middle Name (Optional) */}
                <div className="relative">
                  <motion.label
                    htmlFor="middleName"
                    className={`absolute left-3 px-1 text-sm font-medium pointer-events-none origin-left z-10 ${
                      middleNameFocused || middleName.length > 0 ? "bg-background" : ""
                    }`}
                    initial={{
                      top: "50%",
                      fontSize: "0.875rem",
                      y: "-50%",
                    }}
                    animate={{
                      top:
                        middleNameFocused || middleName.length > 0
                          ? "-0.5rem"
                          : "50%",
                      fontSize:
                        middleNameFocused || middleName.length > 0
                          ? "0.75rem"
                          : "0.875rem",
                      y:
                        middleNameFocused || middleName.length > 0 ? 0 : "-50%",
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    Middle <span className="text-muted-foreground">(opt)</span>
                  </motion.label>
                  <Input
                    id="middleName"
                    name="middleName"
                    type="text"
                    placeholder={
                      middleNameFocused || middleName.length > 0 ? "M." : ""
                    }
                    autoComplete="additional-name"
                    value={middleName}
                    onChange={(e) => setMiddleName(e.target.value)}
                    onFocus={() => setMiddleNameFocused(true)}
                    onBlur={() => {
                      setMiddleName(formatName(middleName));
                      setMiddleNameFocused(false);
                    }}
                    className="h-10"
                  />
                </div>

                {/* Last Name */}
                <div className="relative">
                  <motion.label
                    htmlFor="lastName"
                    className={`absolute left-3 px-1 text-sm font-medium pointer-events-none origin-left z-10 ${
                      lastNameFocused || lastName.length > 0 ? "bg-background" : ""
                    }`}
                    initial={{
                      top: "50%",
                      fontSize: "0.875rem",
                      y: "-50%",
                    }}
                    animate={{
                      top:
                        lastNameFocused || lastName.length > 0
                          ? "-0.5rem"
                          : "50%",
                      fontSize:
                        lastNameFocused || lastName.length > 0
                          ? "0.75rem"
                          : "0.875rem",
                      y: lastNameFocused || lastName.length > 0 ? 0 : "-50%",
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    Last Name
                  </motion.label>
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    placeholder={
                      lastNameFocused || lastName.length > 0 ? "Doe" : ""
                    }
                    required
                    autoComplete="family-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    onFocus={() => setLastNameFocused(true)}
                    onBlur={() => {
                      setLastName(formatName(lastName));
                      setLastNameFocused(false);
                    }}
                    className="h-10"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <div className="relative">
                <motion.label
                  htmlFor="email"
                  className={`absolute left-3 px-1 text-sm font-medium pointer-events-none origin-left z-10 ${
                    emailFocused || email.length > 0 ? "bg-background" : ""
                  }`}
                  initial={{
                    top: "50%",
                    fontSize: "0.875rem",
                    y: "-50%",
                  }}
                  animate={{
                    top: emailFocused || email.length > 0 ? "-0.5rem" : "50%",
                    fontSize:
                      emailFocused || email.length > 0 ? "0.75rem" : "0.875rem",
                    y: emailFocused || email.length > 0 ? 0 : "-50%",
                  }}
                  transition={{ duration: 0.2 }}
                >
                  Email address
                </motion.label>
                <div className="flex gap-2">
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder={
                      emailFocused || email.length > 0 ? "you@example.com" : ""
                    }
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    disabled={codeSent}
                    className={codeSent ? "h-10 opacity-50" : "h-10"}
                  />
                  {!codeSent && (
                    <Button
                      type="submit"
                      className="h-10 shrink-0"
                      disabled={!isFormValid || loading}
                    >
                      {loading ? "Sending..." : "Send Code"}
                    </Button>
                  )}
                  {codeSent && (
                    <Button
                      type="button"
                      disabled
                      variant="outline"
                      className="h-10 shrink-0 border-green-500 text-green-500"
                    >
                      Code Sent ✓
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Terms & Privacy - Show before code sent */}
            {!codeSent && (
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  required
                  className="mt-0.5"
                  checked={termsAccepted}
                  onCheckedChange={(checked) =>
                    setTermsAccepted(checked === true)
                  }
                />
                <Label
                  htmlFor="terms"
                  className="text-sm font-normal leading-relaxed cursor-pointer"
                >
                  I agree to the{" "}
                  <span className="text-primary">Terms of Service</span> and{" "}
                  <span className="text-primary">Privacy Policy</span>
                </Label>
              </div>
            )}

            {/* OTP Input - Shows only after code is sent */}
            {codeSent && (
              <div className="space-y-2">
                <div className="relative rounded-md border px-3 pb-3 pt-4">
                  <label
                    htmlFor="otp"
                    className="absolute left-3 -top-2 px-1 text-xs font-medium bg-background z-10"
                  >
                    Verification Code
                  </label>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={otp}
                      onChange={(value) => setOtp(value)}
                      pattern="^[0-9]+$"
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Enter the 6-digit code sent to {email}
                  </p>
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={loading}
                    className="text-xs text-primary hover:underline disabled:opacity-50"
                  >
                    Resend code
                  </button>
                </div>
              </div>
            )}

            {/* Create Account Button - Shows only when OTP is complete */}
            {codeSent && (
              <Button
                type="submit"
                className="h-8 w-full"
                disabled={!isOtpComplete || loading}
              >
                {loading ? "Verifying..." : "Create Account"}
              </Button>
            )}
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          {/* Social Sign Up - DISABLED (design preserved) */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              type="button"
              className="h-10 w-full"
              disabled
              title="GitHub sign-up coming soon"
            >
              <FaGithub className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              type="button"
              className="h-10 w-full"
              disabled
              title="Google sign-up coming soon"
            >
              <FaGoogle className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              type="button"
              className="h-10 w-full"
              disabled
              title="Passkey registration coming soon"
            >
              <FaFingerprint className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Sign In Link */}
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="font-medium text-primary hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
