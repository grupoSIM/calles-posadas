import { searchStreets } from '@/lib/db/streets';

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const q = url.searchParams.get('q') || undefined;
    const roadType = url.searchParams.get('road_type') || undefined;
    const hasCyclewayParam = url.searchParams.get('has_cycleway');
    const barrioIdParam = url.searchParams.get('barrio_id');
    const chacraParam = url.searchParams.get('chacra');
    const pageParam = url.searchParams.get('page');
    const limitParam = url.searchParams.get('limit');

    const page = pageParam ? parseInt(pageParam, 10) : 1;
    const limit = limitParam ? parseInt(limitParam, 10) : 20;

    if (isNaN(page) || page < 1) {
      return Response.json(
        { error: 'El parámetro page debe ser un número entero mayor o igual a 1.' },
        { status: 400 }
      );
    }

    if (isNaN(limit) || limit < 1 || limit > 100) {
      return Response.json(
        { error: 'El parámetro limit debe ser un número entero entre 1 y 100.' },
        { status: 400 }
      );
    }

    let hasCycleway: boolean | undefined = undefined;
    if (hasCyclewayParam === 'true') hasCycleway = true;
    else if (hasCyclewayParam === 'false') hasCycleway = false;

    const barrioId = barrioIdParam ? parseInt(barrioIdParam, 10) : undefined;
    const chacra = chacraParam ? parseInt(chacraParam, 10) : undefined;

    const result = searchStreets({
      q,
      roadType,
      hasCycleway,
      barrioId: !isNaN(barrioId as number) ? barrioId : undefined,
      chacra: !isNaN(chacra as number) ? chacra : undefined,
      page,
      limit
    });

    return Response.json(result, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60, s-maxage=300'
      }
    });
  } catch (error) {
    return Response.json(
      { error: 'Error interno al procesar la búsqueda de calles.', details: (error as Error).message },
      { status: 500 }
    );
  }
}
