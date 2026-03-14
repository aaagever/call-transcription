interface Env {
  TRANSCRIPTION_UPLOADS: R2Bucket;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const bucket = context.env.TRANSCRIPTION_UPLOADS;
  if (!bucket) {
    return new Response("R2 bucket not configured", { status: 500 });
  }

  const { ext } = (await context.request.json()) as { ext: string };
  const key = `${crypto.randomUUID()}${ext || ""}`;

  const multipart = await bucket.createMultipartUpload(key);

  return new Response(
    JSON.stringify({ key, uploadId: multipart.uploadId }),
    { headers: { "Content-Type": "application/json" } }
  );
};
