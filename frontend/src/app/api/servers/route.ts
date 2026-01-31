import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const body = await req.json();

  const res = await fetch(`${BACKEND_URL}/servers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(authHeader && { Authorization: authHeader }),
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}


export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  
  try {
    const res = await fetch(`${BACKEND_URL}/servers`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader && { Authorization: authHeader }),
      },
    });
    
    if (!res.ok) {
      throw new Error(`Erreur HTTP ${res.status}`);
    }
    
    const data = await res.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Erreur interne du serveur" }, { status: 500 });
  }
}