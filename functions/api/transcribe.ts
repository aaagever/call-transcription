interface Env {}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const apiKey = context.request.headers.get("X-Api-Key");
  if (!apiKey) {
    return new Response("Missing API key", { status: 401 });
  }

  const body = await context.request.text();

  const res = await fetch("https://api.assemblyai.com/v2/transcript", {
    method: "POST",
    headers: {
      Authorization: apiKey,
      "Content-Type": "application/json",
    },
    body,
  });

  const data = await res.text();
  return new Response(data, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
};
