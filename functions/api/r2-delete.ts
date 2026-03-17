interface Env {
  TRANSCRIPTION_UPLOADS: R2Bucket;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const bucket = context.env.TRANSCRIPTION_UPLOADS;
  if (!bucket) {
    return new Response("R2 bucket not configured", { status: 500 });
  }

  const { key } = (await context.request.json()) as { key: string };
  if (!key) {
    return new Response("Missing key", { status: 400 });
  }

  await bucket.delete(key);

  return new Response(JSON.stringify({ deleted: true }), {
    headers: { "Content-Type": "application/json" },
  });
};
