interface Env {}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const apiKey = context.request.headers.get("X-Api-Key");
  if (!apiKey) {
    return new Response("Missing API key", { status: 401 });
  }

  const id = context.params.id as string;

  const res = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, {
    headers: {
      Authorization: apiKey,
    },
  });

  const data = await res.text();
  return new Response(data, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
};
