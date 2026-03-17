interface Env {
  RUNPOD_ENDPOINT_ID: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const apiKey = context.request.headers.get("X-Api-Key");
  if (!apiKey) {
    return new Response("Missing API key", { status: 401 });
  }

  const endpointId = context.env.RUNPOD_ENDPOINT_ID;
  if (!endpointId) {
    return new Response(
      JSON.stringify({ error: "RunPod endpoint not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const body = await context.request.text();

  const res = await fetch(
    `https://api.runpod.ai/v2/${endpointId}/run`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body,
    }
  );

  const data = await res.text();
  return new Response(data, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
};
