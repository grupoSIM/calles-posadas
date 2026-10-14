import { getCicloviasGeoJson } from '@/lib/db/streets';

export async function GET(request: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get('id');
    const tipoParam = searchParams.get('tipo');
    const qParam = searchParams.get('q');

    const params: { id?: number; tipo?: string; q?: string } = {};
    if (idParam) {
      const idNum = parseInt(idParam, 10);
      if (!isNaN(idNum)) {
        params.id = idNum;
      }
    }
    if (tipoParam) {
      params.tipo = tipoParam;
    }
    if (qParam) {
      params.q = qParam;
    }

    const geojson = getCicloviasGeoJson(params);

    return Response.json(geojson, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      },
    });
  } catch (error) {
    return Response.json(
      { error: 'Error interno al consultar el GeoJSON de ciclovías.', details: (error as Error).message },
      { status: 500 }
    );
  }
}
