import OpenAI from "openai";
import {zodResponseFormat} from "openai/helpers/zod";
import { z } from "zod";
import { GenerateRequest, Problem } from "./types";
import { collectLeavesWithPath } from "./grammar-tree";
import type { LeafWithPath } from "./grammar-tree";
import { grammarNotes } from "./grammar-notes";

let _client: OpenAI | null = null
function getClient(): OpenAI {
    if (!_client) {
        _client = new OpenAI()
    }
    return _client
}

function buildResponseSchema(leaves: LeafWithPath[]) {
    const ids = leaves.map((l) => l.leaf.id) as [string, ...string[]]

    const problemSchema = z.object({
        japanese: z.string(),
        answer: z.string(),
        // 出題対象のリーフid。表示用ラベルへはservice側で変換する。
        grammarPoint: z.enum(ids),
    })

    return z.object({
        problems: z.array(problemSchema),
    })
}

// 1つのリーフを、ルートからのパスと解説付きで描画する

function renderLeaf(entry: LeafWithPath): string {
    const { leaf, path } = entry
    const pathLabel = path.map((n) => n.label).join(" > ")

    const lines: string[] = [`■ ${pathLabel}  (id: ${leaf.id})`]

    // パス上の全ノードの解説を、上位→下位の順に集約する
    for (const node of path) {
        const note = grammarNotes[node.id]
        if (!note) {
            continue
        }
        const prefix = node.id === leaf.id ? "解説" : `上位文脈 (${node.label})`
        lines.push(`  ${prefix}: ${note.description}`)
        if (note.examples?.length) {
            lines.push(`  この用法が現れる表現の例: ${note.examples.join(", ")}`)
        }
    }

    return lines.join("\n")
}

export function buildPrompt(leaves: LeafWithPath[], count: number): string {
    const pointsBlock = leaves.map(renderLeaf).join("\n\n")

    return [
        "あなたは高校生向け英語教材の作成者です。",
        "以下の文法事項について、和文英訳の問題を作成してください。",
        "各文法事項は「ルートのカテゴリ > 中カテゴリ > 具体的な用法」というパスで示します。",
        "パス全体と解説を踏まえ、その用法がまさに問われる問題を作ってください。",
        "",
        "【文法事項】",
        pointsBlock,
        "",
        `【問題数】${count}問`,
        "",
        "要件:",
        "- 各文法事項からできるだけ均等に出題すること",
        "- grammarPointには、その問題が対象とする文法事項のidを指定すること",
        "- japaneseには自然な日本語の文を書くこと",
        "- answerにはjapaneseに対応する英文を1つ書くこと",
        "- 実用的な英文を心がけること: 例えば主語をIやHe以外の法人格や一般名詞にも散らす、ビジネス的な文脈、アカデミック的な文脈、短めの関係詞節を足すなど",
        "- 語彙レベルは高校生が理解できる範囲にすること",
    ].join("\n")
}

export async function generateProblems(
    req: GenerateRequest
): Promise<Problem[]> {
    const leaves = collectLeavesWithPath(req.grammarPointId)
    if (leaves.length === 0) {
        throw new Error(`Grammar point not found: ${req.grammarPointId}`)
    }

    const schema = buildResponseSchema(leaves)

    // id -> 表示用ラベル。バッジには短いリーフラベルを出す。
    const idToLabel = new Map(leaves.map((l) => [l.leaf.id, l.leaf.label]))

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
        grammarPoint: idToLabel.get(p.grammarPoint) ?? p.grammarPoint,
        id: crypto.randomUUID(),
    }))
}
