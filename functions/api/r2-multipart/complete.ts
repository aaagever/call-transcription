interface Env {
  TRANSCRIPTION_UPLOADS: R2Bucket;
}

interface UploadedPart {
  partNumber: number;
  etag: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const bucket = context.env.TRANSCRIPTION_UPLOADS;
  if (!bucket) {
    return new Response("R2 bucket not configured", { status: 500 });
  }

  const { key, uploadId, parts } = (await context.request.json()) as {
    key: string;
    uploadId: string;
    parts: UploadedPart[];
  };

  const multipart = bucket.resumeMultipartUpload(key, uploadId);
  await multipart.complete(parts);

  const reqUrl = new URL(context.request.url);
  const publicUrl = `${reqUrl.origin}/r2/${key}`;

  return new Response(
    JSON.stringify({ url: publicUrl }),
    { headers: { "Content-Type": "application/json" } }
  );
};
