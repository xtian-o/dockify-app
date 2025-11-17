// Health check endpoint for Kubernetes liveness/readiness probes

export async function GET() {
  return Response.json(
    {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.GIT_COMMIT_SHA || 'unknown',
      automated: true, // Test automatizare CI/CD
    },
    { status: 200 }
  );
}
