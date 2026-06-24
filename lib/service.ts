import OpenAI from "openai";
import {zodResponseFormat} from "openai/helpers/zod";
import { z } from "zod";
import { GenerateRequest, Problem } from "./types";
import { grammarTree, findNodeById, collectLeaves } from "./grammar-tree";
import type { GrammarNode } from "./types";

let _client: OpenAI | null = null
function getClient(): OpenAI {
    if (!_client) {
        _client = new OpenAI()
    }
    return _client
}

function buildResponseSchema(leaves: GrammarNode[]) {
    const labels = leaves.map((l) => l.label) as [string, ...string[]]

    const problemSchema = z.object({
        japanese: z.string(),
        answer: z.string(),
        grammarPoint: z.enum(labels),
    })

    return z.object({
        problems: z.array(problemSchema),
    })
}

function buildPrompt(leaves: GrammarNode[], count: number): string {
    const pointsList = leaves.map((l) => l.label).join(", ")
    return [
        "あなたは高校生向け英語教材の作成者です。",
        "以下の文法事項について、和文英訳の問題を作成してください。",
        "",
        `【文法事項】${pointsList}`,
        `【問題数】${count}問`,
        "",
        "要件:",
        "- 各文法事項からできるだけ均等に出題すること",
        "- japaneseには自然な日本語の文を書くこと",
        "- answerにはjapaneseに対応する英文を1つ書くこと",
        "- 実用的な英文を心がけること: 例えば主語をIやHe以外の法人格や一般名詞にも散らす、ビジネス的な文脈、格言のような言い回しなど",
        "-語彙レベルは高校生が理解できる範囲にすること",
    ].join("\n")
}

export async function generateProblems(
    req: GenerateRequest
): Promise<Problem[]> {
    const node = findNodeById(req.grammarPointId)
    if (!node) {
        throw new Error(`Grammar point not found: ${req.grammarPointId}`)
    }

    const leaves = collectLeaves(node)
    const schema = buildResponseSchema(leaves)

    const response = await getClient().chat.completions.parse({
        model: "gpt-4.1",
        temperature: 0.7,
        messages: [
            { role: "system", content: buildPrompt(leaves, req.count) },
        ],
        response_format: zodResponseFormat(schema, "problem_response"),
    })

    const parsed = response.choices[0].message.parsed
    if (!parsed) {
        throw new Error("Failed to parse response")
    }

    return parsed.problems.map((p) => ({
        ...p,
        id: crypto.randomUUID(),
    }))
}