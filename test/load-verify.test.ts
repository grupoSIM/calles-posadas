import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { verifyData } from '../scripts/verify-data.js';

describe('T-004: Verificación de carga y consultas en base de datos', () => {
  const dbPath = path.resolve(process.cwd(), 'data', 'calles.db');

  test('La base de datos contiene datos íntegros y responde a consultas FTS5 y R*Tree en < 10ms', () => {
    const result = verifyData(dbPath);
    assert.equal(result.success, true);
    assert.ok(result.details.totalCalles > 2500, 'Debe haber más de 2500 calles');
    assert.ok(result.details.totalBarrios > 150, 'Debe haber más de 150 barrios');
    assert.ok(result.details.totalConCiclovia > 0, 'Debe haber calles con ciclovías detectadas');
    assert.ok(result.details.ftsTimeMs < 10, 'FTS5 debe responder en menos de 10ms');
    assert.ok(result.details.rtreeTimeMs < 10, 'R*Tree debe responder en menos de 10ms');
  });
});
