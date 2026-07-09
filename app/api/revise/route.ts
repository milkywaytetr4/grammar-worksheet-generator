import { NextRequest, NextResponse } from "next/server"
import { ReviseRequestSchema } from "@/lib/types"
import { reviseProblem } from "@/lib/service"

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

    const parsed = ReviseRequestSchema.safeParse(body)
    if (!parsed.success) {
        return NextResponse.json(
            { error: "Invalid request body", details: parsed.error },
            { status: 400 }
        )
    }

    // service呼び出し

    try {
        const result = await reviseProblem(parsed.data)
        return NextResponse.json(result)
    } catch (e) {
        console.error("Revision failed:", e)
        return NextResponse.json(
            { error: "Revision failed" },
            { status: 500 }
        )
    }
}
