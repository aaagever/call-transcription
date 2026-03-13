interface Env {}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const apiKey = context.request.headers.get("X-Api-Key");
  if (!apiKey) {
    return new Response("Missing API key", { status: 401 });
  }

  const formData = await context.request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return new Response("No file provided", { status: 400 });
  }

  const fileBuffer = await file.arrayBuffer();

  const res = await fetch("https://api.assemblyai.com/v2/upload", {
    method: "POST",
    headers: {
      Authorization: apiKey,
      "Content-Type": "application/octet-stream",
    },
    body: fileBuffer,
  });

  const data = await res.text();
  return new Response(data, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
};
