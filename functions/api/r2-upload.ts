import { getPresignedUrl } from "../lib/presign";

interface Env {
  TRANSCRIPTION_UPLOADS: R2Bucket;
  R2_ACCOUNT_ID: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  R2_BUCKET_NAME: string;
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

  const url = await getPresignedUrl({
    accountId: context.env.R2_ACCOUNT_ID,
    accessKeyId: context.env.R2_ACCESS_KEY_ID,
    secretAccessKey: context.env.R2_SECRET_ACCESS_KEY,
    bucket: context.env.R2_BUCKET_NAME,
    key,
  });

  return new Response(JSON.stringify({ url, key }), {
    headers: { "Content-Type": "application/json" },
  });
};
