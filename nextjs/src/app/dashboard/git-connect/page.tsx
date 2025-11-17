import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function GitConnectPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/signin");
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Git Connect</h1>
          <p className="text-sm text-muted-foreground">
            Connect your Git repositories to deploy applications
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
        <div className="flex flex-col items-center gap-1 text-center">
          <h3 className="text-2xl font-bold tracking-tight">
            Coming Soon
          </h3>
          <p className="text-sm text-muted-foreground">
            Git repository connection is under development.
          </p>
        </div>
      </div>
    </div>
  );
}
