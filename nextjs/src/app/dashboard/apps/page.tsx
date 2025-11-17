import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function AppCatalogPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/signin");
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">App Catalog</h1>
          <p className="text-sm text-muted-foreground">
            Browse and deploy applications to your infrastructure
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
        <div className="flex flex-col items-center gap-1 text-center">
          <h3 className="text-2xl font-bold tracking-tight">
            Coming Soon
          </h3>
          <p className="text-sm text-muted-foreground">
            The application catalog is under development.
          </p>
        </div>
      </div>
    </div>
  );
}
