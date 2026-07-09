import { z } from "zod";

// 文法事項の木構造

export type GrammarNode = {
    id: string,
    label: string,
    children?: GrammarNode[],
}

// LLM出力

export const GeneratedProblemSchema = z.object({
    japanese: z.string(),
    answer: z.string(),
    grammarPoint: z.string(),
})

export type GeneratedProblem = z.infer<typeof GeneratedProblemSchema>

export const GeneratedProblemArraySchema = z.array(GeneratedProblemSchema)

// アプリ内

export type Problem = GeneratedProblem & {
    id: string,
    grammarPoint: string,
    // 出題対象リーフのid。文法文脈を修正リクエストへ渡すために保持する。
    // 手動追加された問題では未設定になる。
    grammarPointId?: string,
}

// 修正機能

// 修正候補1件
export const ReviseCandidateSchema = z.object({
    japanese: z.string(),
    answer: z.string(),
})
export type ReviseCandidate = z.infer<typeof ReviseCandidateSchema>

// 会話1ターン分。クライアントでのチャット表示にも用いる。
export const ReviseTurnSchema = z.object({
    prompt: z.string(),
    message: z.string(),
    candidates: z.array(ReviseCandidateSchema),
})
export type ReviseTurn = z.infer<typeof ReviseTurnSchema>

// LLMの修正レスポンス
export const ReviseResponseSchema = z.object({
    message: z.string(),
    candidates: z.array(ReviseCandidateSchema),
})
export type ReviseResponse = z.infer<typeof ReviseResponseSchema>

export const ReviseRequestSchema = z.object({
    // 現在の問題文（過去に置換済みならその内容）
    japanese: z.string(),
    answer: z.string(),
    // 今回のユーザ指示
    prompt: z.string().min(1),
    // 文法文脈の注入用。手動追加の問題では未設定。
    grammarPointId: z.string().optional(),
    // 過去ターン。初回は空配列。
    history: z.array(ReviseTurnSchema).default([]),
})

export type ReviseRequest = z.infer<typeof ReviseRequestSchema>

// リクエスト

// 難易度: easy=典型的・教科書的 / difficult=実用的
export const DifficultySchema = z.enum(["easy", "difficult"])
export type Difficulty = z.infer<typeof DifficultySchema>

export const GenerateRequestSchema = z.object({
    grammarPointId: z.string(),
    count: z.number().int().min(1).max(10),
    difficulty: DifficultySchema.default("difficult"),
})

export type GenerateRequest = z.infer<typeof GenerateRequestSchema>