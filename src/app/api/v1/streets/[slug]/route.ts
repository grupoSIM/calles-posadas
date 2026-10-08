import { getStreetBySlug } from '@/lib/db/streets';

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
): Promise<Response> {
  try {
    const { slug } = await context.params;

    if (!slug) {
      return Response.json(
        { error: 'Debe especificarse el slug de la arteria.' },
        { status: 400 }
      );
    }

    const street = getStreetBySlug(slug);
    if (!street) {
      return Response.json(
        { error: `No se encontró ninguna arteria con el slug "${slug}".` },
        { status: 404 }
      );
    }

    return Response.json(street, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300, s-maxage=3600'
      }
    });
  } catch (error) {
    return Response.json(
      { error: 'Error interno al consultar el detalle de la calle.', details: (error as Error).message },
      { status: 500 }
    );
  }
}
