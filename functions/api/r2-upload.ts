interface Env {
  TRANSCRIPTION_UPLOADS: R2Bucket;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const bucket = context.env.TRANSCRIPTION_UPLOADS;
  if (!bucket) {
    return new Response("R2 bucket not configured", { status: 500 });
  }

  const formData = await context.request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return new Response("No file provided", { status: 400 });
  }

  const fileBuffer = await file.arrayBuffer();
  const ext = file.name.includes(".") ? `.${file.name.split(".").pop()}` : "";
  const key = `${crypto.randomUUID()}${ext}`;

  await bucket.put(key, fileBuffer, {
    httpMetadata: { contentType: file.type || "application/octet-stream" },
  });

  const url = new URL(context.request.url);
  const publicUrl = `${url.origin}/r2/${key}`;

  return new Response(JSON.stringify({ url: publicUrl }), {
    headers: { "Content-Type": "application/json" },
  });
};
