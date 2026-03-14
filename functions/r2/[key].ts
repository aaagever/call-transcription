interface Env {
  TRANSCRIPTION_UPLOADS: R2Bucket;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const bucket = context.env.TRANSCRIPTION_UPLOADS;
  if (!bucket) {
    return new Response("R2 bucket not configured", { status: 500 });
  }

  const key = context.params.key as string;
  const object = await bucket.get(key);

  if (!object) {
    return new Response("File not found", { status: 404 });
  }

  return new Response(object.body, {
    headers: {
      "Content-Type": object.httpMetadata?.contentType || "application/octet-stream",
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
};
