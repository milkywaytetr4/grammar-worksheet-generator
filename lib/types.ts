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
}

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