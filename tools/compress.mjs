import { readdirSync, statSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, extname, relative } from 'node:path';
import { brotliCompressSync, gzipSync, constants as zlibConstants } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');

// Diretório de saída do build (pode ser sobrescrito via argv: `node compress.mjs <dir>`)
const outDir = resolve(projectRoot, process.argv[2] || 'dist/brunonyland.com');

// Extensões que valem comprimir (textos/binários comprimíveis)
const COMPRESSIBLE_EXT = new Set([
  '.html',
  '.js',
  '.mjs',
  '.cjs',
  '.css',
  '.json',
  '.svg',
  '.xml',
  '.txt',
  '.map',
  '.webmanifest',
  '.ico',
]);

// Arquivos que NÃO devem ser comprimidos (já binários/fontes otimizadas)
const SKIP_EXACT = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.avif',
  '.gif',
  '.mp4',
  '.webm',
  '.ogg',
  '.mp3',
  '.woff',
  '.woff2',
  '.ttf',
  '.otf',
  '.eot',
  '.gz',
  '.br',
  '.zip',
]);

const BROTLI_OPTS = {
  params: {
    [zlibConstants.BROTLI_PARAM_QUALITY]: zlibConstants.BROTLI_MAX_QUALITY, // 11
    [zlibConstants.BROTLI_PARAM_MODE]: zlibConstants.BROTLI_MODE_TEXT,
  },
};

const GZIP_OPTS = { level: zlibConstants.Z_MAX_LEVEL }; // 9

function walk(dir, files = []) {
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      walk(full, files);
    } else if (st.isFile()) {
      files.push(full);
    }
  }
  return files;
}

function shouldCompress(filePath) {
  const ext = extname(filePath).toLowerCase();
  if (SKIP_EXACT.has(ext)) return false;
  return COMPRESSIBLE_EXT.has(ext);
}

function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

let totalOriginal = 0;
let totalBr = 0;
let totalGz = 0;
let count = 0;

const files = walk(outDir);
for (const file of files) {
  if (!shouldCompress(file)) continue;
  const buf = readFileSync(file);
  const original = buf.length;

  const brBuf = brotliCompressSync(buf, BROTLI_OPTS);
  writeFileSync(`${file}.br`, brBuf);

  const gzBuf = gzipSync(buf, GZIP_OPTS);
  writeFileSync(`${file}.gz`, gzBuf);

  totalOriginal += original;
  totalBr += brBuf.length;
  totalGz += gzBuf.length;
  count++;
  const rel = relative(projectRoot, file);
  console.log(
    `${rel}  ${formatBytes(original)} → br ${formatBytes(brBuf.length)} | gz ${formatBytes(gzBuf.length)}`,
  );
}

if (count === 0) {
  console.warn(
    `[compress] Nenhum arquivo comprimível encontrado em ${relative(projectRoot, outDir)}`,
  );
} else {
  const brPct = ((1 - totalBr / totalOriginal) * 100).toFixed(1);
  const gzPct = ((1 - totalGz / totalOriginal) * 100).toFixed(1);
  console.log('─'.repeat(60));
  console.log(`[compress] ${count} arquivos comprimidos`);
  console.log(
    `[compress] Brotli: ${formatBytes(totalBr)} de ${formatBytes(totalOriginal)} (-${brPct}%)`,
  );
  console.log(
    `[compress] Gzip:   ${formatBytes(totalGz)} de ${formatBytes(totalOriginal)} (-${gzPct}%)`,
  );
}
