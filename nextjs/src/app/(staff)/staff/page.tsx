import { MdAnalytics, MdPeople, MdSecurity, MdSettings } from "react-icons/md";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

/**
 * Staff Area Homepage
 *
 * Main dashboard for staff/admin users
 * Shows quick access to staff tools and management features
 */
export default async function StaffPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Staff Area</h1>
        <p className="text-muted-foreground">
          Admin tools and management dashboard
        </p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Users Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <MdPeople className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              Active platform users
            </p>
          </CardContent>
        </Card>

        {/* Sessions Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Sessions
            </CardTitle>
            <MdSecurity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">Currently logged in</p>
          </CardContent>
        </Card>

        {/* Analytics Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Analytics</CardTitle>
            <MdAnalytics className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">Coming soon</p>
          </CardContent>
        </Card>

        {/* System Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System</CardTitle>
            <MdSettings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Healthy</div>
            <p className="text-xs text-muted-foreground">
              All systems operational
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common staff tasks and management tools
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <a
            href="/staff/users"
            className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-accent"
          >
            <MdPeople className="h-6 w-6 text-primary" />
            <div>
              <p className="font-medium">User Management</p>
              <p className="text-sm text-muted-foreground">
                Manage users, roles, and permissions
              </p>
            </div>
          </a>

          <a
            href="/staff/analytics"
            className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-accent"
          >
            <MdAnalytics className="h-6 w-6 text-primary" />
            <div>
              <p className="font-medium">Analytics</p>
              <p className="text-sm text-muted-foreground">
                View platform analytics and insights
              </p>
            </div>
          </a>

          <a
            href="/staff/security"
            className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-accent"
          >
            <MdSecurity className="h-6 w-6 text-primary" />
            <div>
              <p className="font-medium">Security</p>
              <p className="text-sm text-muted-foreground">
                Monitor security and audit logs
              </p>
            </div>
          </a>

          <a
            href="/staff/settings"
            className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-accent"
          >
            <MdSettings className="h-6 w-6 text-primary" />
            <div>
              <p className="font-medium">System Settings</p>
              <p className="text-sm text-muted-foreground">
                Configure platform settings
              </p>
            </div>
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
