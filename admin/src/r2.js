// Cloudflare R2 through its S3-compatible API. Converted media is uploaded under
// unique, immutable keys; the media library index is a JSON object in the same
// bucket (library.json), so no database is needed.
import { DeleteObjectsCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { createReadStream } from 'node:fs';

const LIBRARY_KEY = 'library.json';

export class R2 {
  constructor({ accountId, accessKeyId, secretAccessKey, bucket, publicUrl, jurisdiction }) {
    const host = jurisdiction ? `${accountId}.${jurisdiction}.r2.cloudflarestorage.com` : `${accountId}.r2.cloudflarestorage.com`;
    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${host}`,
      credentials: { accessKeyId, secretAccessKey },
      // Newer SDKs send CRC32 checksums by default, which R2 rejects.
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    });
    this.bucket = bucket;
    this.publicUrl = publicUrl;
  }

  url(key) {
    return `${this.publicUrl}/${key}`;
  }

  /** Uploads a local file (multipart for large files). */
  async uploadFile(key, filePath, contentType) {
    const upload = new Upload({
      client: this.client,
      params: {
        Bucket: this.bucket,
        Key: key,
        Body: createReadStream(filePath),
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000, immutable',
      },
      queueSize: 2,
      partSize: 8 * 1024 * 1024,
    });
    await upload.done();
    return this.url(key);
  }

  async deleteKeys(keys) {
    if (!keys.length) return;
    await this.client.send(
      new DeleteObjectsCommand({ Bucket: this.bucket, Delete: { Objects: keys.map((Key) => ({ Key })), Quiet: true } }),
    );
  }

  async readLibrary() {
    try {
      const res = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: LIBRARY_KEY }));
      const text = await res.Body.transformToString();
      const data = JSON.parse(text);
      return Array.isArray(data.items) ? data : { items: [] };
    } catch (err) {
      if (err?.name === 'NoSuchKey' || err?.$metadata?.httpStatusCode === 404) return { items: [] };
      throw err;
    }
  }

  async writeLibrary(library) {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: LIBRARY_KEY,
        Body: JSON.stringify(library, null, 1),
        ContentType: 'application/json',
        CacheControl: 'no-store',
      }),
    );
  }
}
