import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

describe('FEAT-025: Ficha interactiva enriquecida de barrio y métricas territoriales en visor', () => {
  const viewerPath = path.resolve('src/components/map/StreetViewer.tsx');
  const pagePath = path.resolve('src/app/page.tsx');
  const clientViewerPath = path.resolve('src/components/map/StreetViewerClient.tsx');

  const viewerContent = fs.readFileSync(viewerPath, 'utf-8');
  const pageContent = fs.readFileSync(pagePath, 'utf-8');
  const clientViewerContent = fs.readFileSync(clientViewerPath, 'utf-8');

  it('AC-001: Maquetación y visualización de metadatos enriquecidos en tarjeta de barrio', () => {
    assert.ok(
      viewerContent.includes('posadas-barrio-popup'),
      'Debe contener contenedor con clase posadas-barrio-popup'
    );
    assert.ok(
      viewerContent.includes('🏛️') && viewerContent.includes('Delegación:'),
      'Debe renderizar badge de delegación municipal con icono cívico'
    );
    assert.ok(
      viewerContent.includes('📐') && viewerContent.includes('Catastro:'),
      'Debe renderizar badge de sección catastral'
    );
    assert.ok(
      viewerContent.includes('📜') && viewerContent.includes('props.referencia_ordenanza'),
      'Debe renderizar badge normativo de ordenanza del Digesto'
    );
    assert.ok(
      viewerContent.includes('props.articulo_ordenanza'),
      'Debe renderizar artículo específico de la ordenanza'
    );
    assert.ok(
      viewerContent.includes('🗺️') && viewerContent.includes('Superficie:'),
      'Debe renderizar superficie calculada'
    );
    assert.ok(
      viewerContent.includes('ha') && viewerContent.includes('km²'),
      'Debe formatear superficie en hectáreas y kilómetros cuadrados'
    );
  });

  it('AC-002: Interacción y vinculación con catálogo de calles desde la tarjeta', () => {
    assert.ok(
      viewerContent.includes('btn-filter-barrio'),
      'Debe contener botón de filtrado de calles con clase btn-filter-barrio'
    );
    assert.ok(
      viewerContent.includes('Ver calles en este barrio'),
      'Debe contener el texto de acción cívica "Ver calles en este barrio"'
    );
    assert.ok(
      viewerContent.includes('onSelectBarrio?: (barrio: { id: number; name: string }) => void;'),
      'StreetViewerProps debe definir callback onSelectBarrio'
    );
    assert.ok(
      viewerContent.includes('onSelectBarrioRef.current'),
      'Debe gestionar callback mediante ref para invocarlo desde evento Leaflet'
    );
    assert.ok(
      viewerContent.includes('popupopen') && viewerContent.includes('.btn-filter-barrio'),
      'Debe registrar listener de clic en el botón sobre popupopen de Leaflet'
    );
    assert.ok(
      pageContent.includes('handleSelectBarrio'),
      'HomePage debe declarar callback handleSelectBarrio'
    );
    assert.ok(
      pageContent.includes('barrioId: barrio.id.toString()'),
      'handleSelectBarrio debe actualizar el filtro barrioId con el id del barrio'
    );
    assert.ok(
      pageContent.includes('onSelectBarrio={handleSelectBarrio}'),
      'HomePage debe conectar onSelectBarrio al componente StreetViewerClient'
    );
    assert.ok(
      pageContent.includes('params.get(\'barrio_id\')'),
      'HomePage debe admitir inicialización por query param barrio_id'
    );
  });

  it('AC-003: Compatibilidad y propagación de props en StreetViewerClient', () => {
    assert.ok(
      clientViewerContent.includes('<StreetViewerDynamic {...props} />'),
      'StreetViewerClient debe propagar props íntegramente hacia StreetViewerDynamic'
    );
  });
});
