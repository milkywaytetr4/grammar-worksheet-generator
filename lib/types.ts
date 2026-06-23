import { z } from "zod";

export const ProblemSchema = z.object({
    japanese: z.string(),
    answer: z.string(),
    grammarPoint: z.string(),
})

export type GeneratedProblem = z.infer<typeof ProblemSchema>

export type Problem = GeneratedProblem & {
    id: string,
}

export const ProblemArraySchema = z.array(ProblemSchema)