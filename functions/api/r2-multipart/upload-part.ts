interface Env {
  TRANSCRIPTION_UPLOADS: R2Bucket;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const bucket = context.env.TRANSCRIPTION_UPLOADS;
  if (!bucket) {
    return new Response("R2 bucket not configured", { status: 500 });
  }

  const formData = await context.request.formData();
  const chunk = formData.get("chunk") as File | null;
  const key = formData.get("key") as string;
  const uploadId = formData.get("uploadId") as string;
  const partNumber = parseInt(formData.get("partNumber") as string, 10);

  if (!chunk || !key || !uploadId || !partNumber) {
    return new Response("Missing required fields", { status: 400 });
  }

  const multipart = bucket.resumeMultipartUpload(key, uploadId);
  const part = await multipart.uploadPart(partNumber, await chunk.arrayBuffer());

  return new Response(
    JSON.stringify({ etag: part.etag }),
    { headers: { "Content-Type": "application/json" } }
  );
};
