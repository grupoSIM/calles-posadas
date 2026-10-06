import { listBarrios } from '@/lib/db/streets';

export async function GET(_request: Request): Promise<Response> {
  try {
    const barrios = listBarrios();

    return Response.json(
      {
        total: barrios.length,
        data: barrios
      },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=600, s-maxage=86400'
        }
      }
    );
  } catch (error) {
    return Response.json(
      { error: 'Error interno al consultar el catálogo de barrios.', details: (error as Error).message },
      { status: 500 }
    );
  }
}
