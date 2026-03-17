const fs = require('fs');
const path = require('path');

const targetPath = path.join(
  process.cwd(),
  'node_modules',
  'next',
  'dist',
  'export',
  'index.js'
);

if (!fs.existsSync(targetPath)) {
  console.warn(`[patch-next-export-worker] Arquivo não encontrado: ${targetPath}`);
  process.exit(0);
}

const source = fs.readFileSync(targetPath, 'utf8');

if (source.includes('function sanitizeForWorkerPayload(value, seen = new WeakMap())')) {
  console.log('[patch-next-export-worker] Patch já aplicado.');
  process.exit(0);
}

const exportErrorNeedle = `class ExportError extends Error {
    constructor(...args){
        super(...args), this.code = 'NEXT_EXPORT_ERROR';
    }
}
`;

const exportErrorPatch = `class ExportError extends Error {
    constructor(...args){
        super(...args), this.code = 'NEXT_EXPORT_ERROR';
    }
}
function sanitizeForWorkerPayload(value, seen = new WeakMap()) {
    if (value == null) return value;
    if (typeof value === 'function') return undefined;
    if (typeof value !== 'object') return value;
    if (seen.has(value)) return seen.get(value);
    if (Array.isArray(value)) {
        const clonedArray = value.map((item)=>sanitizeForWorkerPayload(item, seen));
        seen.set(value, clonedArray);
        return clonedArray;
    }
    const clonedObject = {};
    seen.set(value, clonedObject);
    for (const [key, nestedValue] of Object.entries(value)){
        const sanitizedValue = sanitizeForWorkerPayload(nestedValue, seen);
        if (sanitizedValue !== undefined) {
            clonedObject[key] = sanitizedValue;
        }
    }
    return clonedObject;
}
`;

const workerPayloadNeedle = `        const serializableNextConfig = {
            enablePrerenderSourceMaps: nextConfig.enablePrerenderSourceMaps,
            cacheHandlers: nextConfig.cacheHandlers,
            trailingSlash: nextConfig.trailingSlash,
            httpAgentOptions: nextConfig.httpAgentOptions,
            staticPageGenerationTimeout: nextConfig.staticPageGenerationTimeout,
            experimental: {
                hideLogsAfterAbort: nextConfig.experimental.hideLogsAfterAbort,
                optimizeCss: nextConfig.experimental.optimizeCss,
                disableOptimizedLoading: nextConfig.experimental.disableOptimizedLoading,
                prerenderEarlyExit: nextConfig.experimental.prerenderEarlyExit,
                sri: nextConfig.experimental.sri,
                staticGenerationMaxConcurrency: nextConfig.experimental.staticGenerationMaxConcurrency,
                staticGenerationRetryCount: nextConfig.experimental.staticGenerationRetryCount
            }
        };
        return (await Promise.all(batches.map(async (batch)=>worker.exportPages({
                  buildId,
                  exportPaths: batch,
                  parentSpanId: span.getId(),
                  pagesDataDir,
                    renderOpts,
                    options,
                    dir,
                    distDir,
                    outDir,
                  nextConfig: serializableNextConfig,
                    cacheHandler: nextConfig.cacheHandler,
                    cacheMaxMemorySize: nextConfig.cacheMaxMemorySize,
                    fetchCache: true,
                  fetchCacheKeyPrefix: nextConfig.experimental.fetchCacheKeyPrefix,
                  renderResumeDataCachesByPage
              })))).flat();`;

const workerPayloadNeedleNew = `        return (await Promise.all(batches.map(async (batch)=>worker.exportPages({
                buildId,
                exportPaths: batch,
                parentSpanId: span.getId(),
                pagesDataDir,
                renderOpts,
                options,
                dir,
                distDir,
                outDir,
                nextConfig,
                cacheHandler: nextConfig.cacheHandler,
                cacheMaxMemorySize: nextConfig.cacheMaxMemorySize,
                fetchCache: true,
                fetchCacheKeyPrefix: nextConfig.experimental.fetchCacheKeyPrefix,
                renderResumeDataCachesByPage
            })))).flat();`;

const workerPayloadPatchNew = `        const serializableNextConfig = sanitizeForWorkerPayload(nextConfig);
        const serializableRenderOpts = sanitizeForWorkerPayload(renderOpts);
        const serializableOptions = sanitizeForWorkerPayload(options);
        return (await Promise.all(batches.map(async (batch)=>worker.exportPages({
                buildId,
                exportPaths: batch,
                parentSpanId: span.getId(),
                pagesDataDir,
                renderOpts: serializableRenderOpts,
                options: serializableOptions,
                dir,
                distDir,
                outDir,
                nextConfig: serializableNextConfig,
                cacheHandler: nextConfig.cacheHandler,
                cacheMaxMemorySize: nextConfig.cacheMaxMemorySize,
                fetchCache: true,
                fetchCacheKeyPrefix: nextConfig.experimental.fetchCacheKeyPrefix,
                renderResumeDataCachesByPage
            })))).flat();`;

const workerPayloadPatch = `        const serializableNextConfig = sanitizeForWorkerPayload({
            enablePrerenderSourceMaps: nextConfig.enablePrerenderSourceMaps,
            cacheHandlers: nextConfig.cacheHandlers,
            trailingSlash: nextConfig.trailingSlash,
            httpAgentOptions: nextConfig.httpAgentOptions,
            staticPageGenerationTimeout: nextConfig.staticPageGenerationTimeout,
            experimental: {
                hideLogsAfterAbort: nextConfig.experimental.hideLogsAfterAbort,
                optimizeCss: nextConfig.experimental.optimizeCss,
                disableOptimizedLoading: nextConfig.experimental.disableOptimizedLoading,
                prerenderEarlyExit: nextConfig.experimental.prerenderEarlyExit,
                sri: nextConfig.experimental.sri,
                staticGenerationMaxConcurrency: nextConfig.experimental.staticGenerationMaxConcurrency,
                staticGenerationRetryCount: nextConfig.experimental.staticGenerationRetryCount
            }
        });
        const serializableRenderOpts = sanitizeForWorkerPayload(renderOpts);
        const serializableOptions = sanitizeForWorkerPayload(options);
        return (await Promise.all(batches.map(async (batch)=>worker.exportPages({
                  buildId,
                  exportPaths: batch,
                  parentSpanId: span.getId(),
                  pagesDataDir,
                    renderOpts: serializableRenderOpts,
                    options: serializableOptions,
                    dir,
                    distDir,
                    outDir,
                  nextConfig: serializableNextConfig,
                    cacheHandler: nextConfig.cacheHandler,
                    cacheMaxMemorySize: nextConfig.cacheMaxMemorySize,
                    fetchCache: true,
                  fetchCacheKeyPrefix: nextConfig.experimental.fetchCacheKeyPrefix,
                  renderResumeDataCachesByPage
              })))).flat();`;

let patched = source;

if (patched.includes(exportErrorNeedle)) {
  patched = patched.replace(exportErrorNeedle, exportErrorPatch);
} else {
  console.warn('[patch-next-export-worker] Bloco ExportError não encontrado; patch de helper ignorado.');
}

if (patched.includes(workerPayloadNeedle)) {
  patched = patched.replace(workerPayloadNeedle, workerPayloadPatch);
} else if (patched.includes(workerPayloadNeedleNew)) {
  patched = patched.replace(workerPayloadNeedleNew, workerPayloadPatchNew);
} else {
  console.warn('[patch-next-export-worker] Bloco de payload do worker não encontrado; nada para aplicar nesta versão do Next.js.');
  process.exit(0);
}

fs.writeFileSync(targetPath, patched);
console.log('[patch-next-export-worker] Patch aplicado com sucesso.');
