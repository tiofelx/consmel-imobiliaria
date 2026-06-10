import { put } from '@vercel/blob';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const EXTENSION_BY_MIME = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
};

function isJpeg(buffer) {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
}

function isPng(buffer) {
    return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
}

function isWebp(buffer) {
    return (
        buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
        buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
    );
}

function magicBytesMatchMime(buffer, mime) {
    if (mime === 'image/jpeg') return isJpeg(buffer);
    if (mime === 'image/png') return isPng(buffer);
    if (mime === 'image/webp') return isWebp(buffer);
    return false;
}

export class UploadValidationError extends Error {
    constructor(message, status = 400) {
        super(message);
        this.name = 'UploadValidationError';
        this.status = status;
    }
}

export async function uploadImageToBlob(file, { pathPrefix = 'properties' } = {}) {
    if (!file || typeof file.arrayBuffer !== 'function') {
        throw new UploadValidationError('Arquivo inválido.');
    }

    if (file.size > MAX_FILE_SIZE) {
        throw new UploadValidationError(`O arquivo ${file.name || 'enviado'} ultrapassa o limite de 5MB.`);
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        throw new UploadValidationError(
            `Tipo de arquivo não permitido para a imagem ${file.name || 'enviada'}. Apenas JPEG, PNG ou WEBP.`
        );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    if (!magicBytesMatchMime(buffer, file.type)) {
        throw new UploadValidationError(
            `O conteúdo do arquivo ${file.name || 'enviado'} não corresponde a uma imagem válida.`
        );
    }

    const extension = EXTENSION_BY_MIME[file.type];
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const blobPath = `${pathPrefix}/${uniqueSuffix}${extension}`;

    const blob = await put(blobPath, buffer, {
        access: 'public',
        contentType: file.type,
        addRandomSuffix: true,
    });

    return { url: blob.url };
}

export async function uploadImagesToBlob(files, options) {
    const results = [];
    for (const file of files) {
        const result = await uploadImageToBlob(file, options);
        results.push(result);
    }
    return results;
}
