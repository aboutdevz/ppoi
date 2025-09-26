import { NextRequest } from "next/server";

// Redirect API calls to the Cloudflare Worker API
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const searchParams = url.searchParams;

  const apiUrl =
    process.env.NODE_ENV === "production"
      ? "https://ppoi-api.poipoi.click/v1/explore"
      : "http://localhost:8787/v1/explore";

  const workerUrl = new URL(apiUrl);
  workerUrl.search = searchParams.toString();

  try {
    const response = await fetch(workerUrl.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    return Response.json(data, {
      status: response.status,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  } catch (error) {
    console.error("Error proxying to worker API:", error);
    return Response.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
