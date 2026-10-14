import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

describe('FEAT-013: Panel lateral colapsable/replegable en versión de escritorio', () => {
  const pagePath = path.resolve('src/app/page.tsx');
  const viewerPath = path.resolve('src/components/map/StreetViewer.tsx');
  const pageContent = fs.readFileSync(pagePath, 'utf-8');
  const viewerContent = fs.readFileSync(viewerPath, 'utf-8');

  it('AC-001: Implementa estado desktopCollapsed y clases CSS de colapso en escritorio', () => {
    assert.ok(
      pageContent.includes('const [desktopCollapsed, setDesktopCollapsed] = useState(false);'),
      'Debe declarar estado desktopCollapsed inicializado en false'
    );
    assert.ok(
      pageContent.includes('desktopPanelClass'),
      'Debe definir clases responsivas desktopPanelClass'
    );
    assert.ok(
      pageContent.includes('md:w-0') && pageContent.includes('md:overflow-hidden'),
      'Debe contraer el ancho a 0 y ocultar overflow en desktop al colapsar'
    );
    assert.ok(
      pageContent.includes('md:w-[420px]'),
      'Debe expandir el ancho original en desktop al estar visible'
    );
    assert.ok(
      pageContent.includes('aria-label="Colapsar panel lateral"'),
      'Debe proveer botón accesible con aria-label para colapsar panel'
    );
  });

  it('AC-002: Dispone de botón flotante de reapertura sobre el visor en escritorio', () => {
    assert.ok(
      pageContent.includes('desktopCollapsed &&'),
      'Debe condicionar el botón flotante a desktopCollapsed === true'
    );
    assert.ok(
      pageContent.includes('hidden md:inline-flex'),
      'El botón flotante debe ser visible exclusivamente en resolución de escritorio'
    );
    assert.ok(
      pageContent.includes('top-4 left-4') && pageContent.includes('z-[1000]'),
      'El botón flotante debe posicionarse en top-4 left-4 con z-index superior a Leaflet'
    );
    assert.ok(
      pageContent.includes('aria-label="Expandir panel lateral"'),
      'Debe proveer botón accesible con aria-label para expandir panel'
    );
  });

  it('AC-003: Reabre automáticamente el panel al seleccionar una arteria en el mapa', () => {
    // Verificar que handleSelectStreet contenga setDesktopCollapsed(false)
    const selectStreetRegex = /handleSelectStreet[\s\S]*?setDesktopCollapsed\(false\)/;
    assert.ok(
      selectStreetRegex.test(pageContent),
      'handleSelectStreet debe llamar setDesktopCollapsed(false) para mostrar la ficha de detalle'
    );
  });

  it('AC-004: Preserva el estado de búsqueda, filtros y catálogo sin mutación colateral', () => {
    // desktopCollapsed es ortogonal a query, filters y page
    assert.ok(
      pageContent.includes('const [query, setQuery] = useState'),
      'Estado de query debe mantenerse independiente'
    );
    assert.ok(
      pageContent.includes('const [filters, setFilters] = useState'),
      'Estado de filtros debe mantenerse independiente'
    );
    assert.ok(
      pageContent.includes('const [page, setPage] = useState'),
      'Estado de paginación debe mantenerse independiente'
    );

    // Verificar que los botones de colapso/expansión solo alternen setDesktopCollapsed sin alterar query ni page
    const collapseButtons = pageContent.match(/onClick=\{\(\) => setDesktopCollapsed\([^)]+\)\}/g);
    assert.ok(collapseButtons && collapseButtons.length >= 2, 'Debe haber al menos 2 botones que llamen a setDesktopCollapsed');
    for (const btn of collapseButtons) {
      assert.ok(!btn.includes('setPage'), 'El botón no debe alterar la página');
      assert.ok(!btn.includes('setQuery'), 'El botón no debe alterar la query');
    }
  });

  it('AC-005: Mantiene total independencia del visor y bottom sheet móvil', () => {
    assert.ok(
      pageContent.includes('const [mobileSheetState, setMobileSheetState] = useState'),
      'El estado de mobileSheetState debe mantenerse intacto'
    );
    // El botón de colapso y el botón flotante usan md: y no interfieren en mobile
    assert.ok(
      pageContent.includes('hidden md:flex') || pageContent.includes('hidden md:inline-flex'),
      'Los controles de escritorio deben ocultarse en resoluciones móviles'
    );
  });

  it('T-003: StreetViewer implementa ResizeObserver para sincronizar dimensiones de Leaflet', () => {
    assert.ok(
      viewerContent.includes('ResizeObserver'),
      'StreetViewer debe implementar ResizeObserver para redibujado de Leaflet'
    );
    assert.ok(
      viewerContent.includes('invalidateSize()'),
      'ResizeObserver debe invocar invalidateSize() ante cambios del contenedor'
    );
    assert.ok(
      viewerContent.includes('resizeObserver.disconnect()'),
      'Debe limpiar y desconectar el ResizeObserver al desmontar'
    );
  });
});
