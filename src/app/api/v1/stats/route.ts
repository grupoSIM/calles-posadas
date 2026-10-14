import { getStatsMetrics } from '@/lib/db/stats';

export async function GET(_request: Request): Promise<Response> {
  try {
    const stats = getStatsMetrics();

    return Response.json(
      {
        success: true,
        data: stats
      },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400'
        }
      }
    );
  } catch (error) {
    return Response.json(
      { error: 'Error interno al consultar las estadísticas de cobertura.', details: (error as Error).message },
      { status: 500 }
    );
  }
}
