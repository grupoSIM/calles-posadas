import { getBarriosGeoJson } from '@/lib/db/streets';

export async function GET(request: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get('id');
    const qParam = searchParams.get('q');
    const delegacionParam = searchParams.get('delegacion');
    const seccionParam = searchParams.get('seccion');

    const params: { id?: number; q?: string; delegacion?: string; seccion?: string } = {};
    if (idParam) {
      const idNum = parseInt(idParam, 10);
      if (!isNaN(idNum)) {
        params.id = idNum;
      }
    }
    if (qParam) {
      params.q = qParam;
    }
    if (delegacionParam) {
      params.delegacion = delegacionParam;
    }
    if (seccionParam) {
      params.seccion = seccionParam;
    }

    const geojson = getBarriosGeoJson(params);

    return Response.json(geojson, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=600, s-maxage=86400',
      },
    });
  } catch (error) {
    return Response.json(
      { error: 'Error interno al consultar el GeoJSON de barrios.', details: (error as Error).message },
      { status: 500 }
    );
  }
}
