interface Env {
  RUNPOD_ENDPOINT_ID: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const apiKey = context.request.headers.get("X-Api-Key");
  if (!apiKey) {
    return new Response("Missing API key", { status: 401 });
  }

  const endpointId = context.env.RUNPOD_ENDPOINT_ID;
  if (!endpointId) {
    return new Response("RunPod endpoint not configured", { status: 500 });
  }

  const id = context.params.id as string;

  const res = await fetch(
    `https://api.runpod.ai/v2/${endpointId}/status/${id}`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    }
  );

  const data = await res.text();
  return new Response(data, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
};
