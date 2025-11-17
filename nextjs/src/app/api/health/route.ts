// Health check endpoint for Kubernetes liveness/readiness probes

export async function GET() {
  return Response.json(
    {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
    { status: 200 }
  );
}
