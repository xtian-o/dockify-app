import { redirect } from "next/navigation";
import { signOut } from "next-auth/react";
import { auth } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex items-center justify-center p-8">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">🎉 Welcome to Dashboard!</h1>
          <p className="text-lg text-gray-300">
            You've successfully authenticated with Email + OTP
          </p>
        </div>

        {/* User Info Card */}
        <div className="bg-gray-800/50 backdrop-blur rounded-lg p-8 border border-gray-700 space-y-6">
          <h2 className="text-2xl font-semibold mb-4">Your Profile</h2>

          <div className="space-y-4">
            {/* User ID */}
            <div className="flex justify-between items-center border-b border-gray-700 pb-3">
              <span className="text-gray-400">User ID:</span>
              <span className="font-mono text-sm text-cyan-400">
                {session.user.id}
              </span>
            </div>

            {/* Email */}
            <div className="flex justify-between items-center border-b border-gray-700 pb-3">
              <span className="text-gray-400">Email:</span>
              <span className="font-medium">{session.user.email}</span>
            </div>

            {/* Name */}
            {session.user.name && (
              <div className="flex justify-between items-center border-b border-gray-700 pb-3">
                <span className="text-gray-400">Name:</span>
                <span className="font-medium">{session.user.name}</span>
              </div>
            )}

            {/* Status */}
            <div className="flex justify-between items-center border-b border-gray-700 pb-3">
              <span className="text-gray-400">Account Status:</span>
              <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                {session.user.status}
              </span>
            </div>

            {/* Email Verified */}
            <div className="flex justify-between items-center border-b border-gray-700 pb-3">
              <span className="text-gray-400">Email Verified:</span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  session.user.emailVerified
                    ? "bg-green-500/20 text-green-400"
                    : "bg-yellow-500/20 text-yellow-400"
                }`}
              >
                {session.user.emailVerified ? "✓ Verified" : "Pending"}
              </span>
            </div>
          </div>

          {/* Sign Out Button */}
          <div className="pt-6">
            <form
              action={async () => {
                "use server";
                await import("@/lib/auth").then((mod) => mod.signOut());
              }}
            >
              <button
                type="submit"
                className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-semibold"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>

        {/* Success Message */}
        <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-6 text-center">
          <p className="text-green-400 font-medium">
            🔒 Authentication is working perfectly!
          </p>
          <p className="text-sm text-gray-400 mt-2">
            You can now integrate protected routes and user-specific features.
          </p>
        </div>
      </div>
    </div>
  );
}
