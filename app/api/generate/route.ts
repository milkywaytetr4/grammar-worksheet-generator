import { NextRequest, NextResponse } from "next/server"
import { GenerateRequestSchema } from "@/lib/types"
import { generateProblems } from "@/lib/service"

export async function POST(req: NextRequest) {
    // リクエストのバリデーション
    let body: unknown
    try {
        body = await req.json()
    } catch {
        return NextResponse.json(
            { error: "Invalid JSON" },
            { status: 400 }
        )
    }

    const parsed = GenerateRequestSchema.safeParse(body)
    if (!parsed.success) {
        return NextResponse.json(
            { error: "Invalid request body", details: parsed.error },
            { status: 400 }
        )
    }

    // service呼び出し

    try {
        const problems = await generateProblems(parsed.data)
        return NextResponse.json({ problems })
    } catch (e) {
        console.error("Generation failed:", e)
        return NextResponse.json(
            { error: "Generation failed" },
            { status: 500 }
        )
    }
}
