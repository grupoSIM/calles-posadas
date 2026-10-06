import fs from 'node:fs';
import path from 'node:path';

const rawDir = path.resolve(process.cwd(), 'data', 'raw');
const fixturesDir = path.resolve(process.cwd(), 'data', 'fixtures');

if (!fs.existsSync(fixturesDir)) {
  fs.mkdirSync(fixturesDir, { recursive: true });
}

function createSample(filename: string, maxFeatures: number) {
  const rawPath = path.join(rawDir, filename);
  if (!fs.existsSync(rawPath)) return;

  const data = JSON.parse(fs.readFileSync(rawPath, 'utf-8'));
  const sample = {
    ...data,
    features: (data.features || []).slice(0, maxFeatures)
  };

  fs.writeFileSync(path.join(fixturesDir, filename), JSON.stringify(sample, null, 2), 'utf-8');
}

createSample('calles.json', 15);
createSample('barrios.json', 10);
createSample('bicisendas.json', 5);

console.log('Fixtures generadas exitosamente en data/fixtures/');
