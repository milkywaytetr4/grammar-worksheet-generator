import OpenAI from "openai";
import {zodResponseFormat} from "openai/helpers/zod";
import { z } from "zod";
import { GenerateRequest, Problem, ReviseRequest, ReviseResponse } from "./types";
import type { Difficulty } from "./types";
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

// 難易度ごとの、英文の作り方に関する要件
function difficultyRequirement(difficulty: Difficulty): string {
    if (difficulty === "easy") {
        return "- 教科書的で典型的な例文にすること: その文法事項が最も素直に現れる形を優先し、主語・語彙・文脈は基本的なものにとどめ、余計な修飾や凝った言い回しは避けること"
    }
    return "- 実用的な英文を心がけること: 例えば主語をIやHe以外の法人格や一般名詞にも散らす、ビジネス的な文脈、アカデミック的な文脈、短めの関係詞節を足すなど"
}

export function buildPrompt(
    leaves: LeafWithPath[],
    count: number,
    difficulty: Difficulty = "difficult"
): string {
    const pointsBlock = leaves.map(renderLeaf).join("\n\n")

    return [
        "あなたは高校生向け英語教材の作成者です。",
        "以下の文法事項について、和文英訳の問題を作成してください。",
        "各文法事項は「ルートのカテゴリ > 中カテゴリ > 具体的な用法」というパスで示します。",
        "パス全体と解説を踏まえ、その用法がまさに問われる問題を作ってください。",
        "直訳的で構わないので、その日本語を元に英作文したときに、求めている文法事項が自然と入るような形にしてください。",
        "全体的に見て、生成された文の主語が偏らないようにしてください",
        "{簡単な主語}{be動詞}{文法事項を含む目的語}の形が多くならないようにして下さい",
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
        difficultyRequirement(difficulty),
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
        model: "gpt-5.4-mini",
        reasoning_effort: "medium",
        messages: [
            { role: "system", content: buildPrompt(leaves, req.count, req.difficulty) },
        ],
        response_format: zodResponseFormat(schema, "problem_response"),
    })

    const parsed = response.choices[0].message.parsed
    if (!parsed) {
        throw new Error("Failed to parse response")
    }

    return parsed.problems.map((p) => ({
        ...p,
        // ラベルへ変換して表示に使う一方、修正時の文法文脈のためidも保持する。
        grammarPoint: idToLabel.get(p.grammarPoint) ?? p.grammarPoint,
        grammarPointId: p.grammarPoint,
        id: crypto.randomUUID(),
    }))
}

// 修正機能

const REVISE_CANDIDATE_COUNT = 3

const reviseResponseSchema = z.object({
    // 修正内容を説明する一言（例:「顧客満足度をより平易な表現にしました」）
    message: z.string(),
    candidates: z
        .array(
            z.object({
                japanese: z.string(),
                answer: z.string(),
            })
        )
        .length(REVISE_CANDIDATE_COUNT),
})

// 修正リクエストのsystemプロンプト。文法文脈があれば解説を注入する。
export function buildReviseSystemPrompt(grammarPointId?: string): string {
    const lines: string[] = [
        "あなたは高校生向け英語教材の作成者です。",
        "既存の和文英訳問題（日本語文とその英訳）に対して、ユーザの指示に従った修正案を提案してください。",
        "",
        "要件:",
        `- 修正案は${REVISE_CANDIDATE_COUNT}つ提示すること`,
        "- 各案は japanese（日本語文）と answer（対応する英文）の組であること",
        "- japanese と answer は必ず内容が対応していること",
        "- ユーザの指示が英文のみ、または日本語文のみに関わる場合でも、両者の対応を保つこと",
        "- messageには、どのような修正を行ったかを説明する日本語の短い一文を書くこと",
        "- 語彙レベルは高校生が理解できる範囲にすること",
    ]

    if (grammarPointId) {
        const leaves = collectLeavesWithPath(grammarPointId)
        if (leaves.length > 0) {
            lines.push(
                "",
                "この問題が対象とする文法事項は次のとおりです。修正後もこの文法事項が問える形を保ってください。",
                "",
                "【文法事項】",
                leaves.map(renderLeaf).join("\n\n")
            )
        }
    }

    return lines.join("\n")
}

// 現在の問題文と今回の指示を伝える最後のuserメッセージ
function buildReviseUserMessage(japanese: string, answer: string, prompt: string): string {
    return [
        "現在の問題:",
        `日本語: ${japanese}`,
        `英文: ${answer}`,
        "",
        `指示: ${prompt}`,
    ].join("\n")
}

export async function reviseProblem(req: ReviseRequest): Promise<ReviseResponse> {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: "system", content: buildReviseSystemPrompt(req.grammarPointId) },
    ]

    // 過去ターンを会話として展開する。これにより前ターンの候補への言及
    //（例:「Cを平易にして」）を解決できる。
    for (const turn of req.history) {
        messages.push({ role: "user", content: turn.prompt })
        messages.push({
            role: "assistant",
            content: JSON.stringify({
                message: turn.message,
                candidates: turn.candidates,
            }),
        })
    }

    messages.push({
        role: "user",
        content: buildReviseUserMessage(req.japanese, req.answer, req.prompt),
    })

    const response = await getClient().chat.completions.parse({
        model: "gpt-5.4-mini",
        reasoning_effort: "medium",
        messages,
        response_format: zodResponseFormat(reviseResponseSchema, "revise_response"),
    })

    const parsed = response.choices[0].message.parsed
    if (!parsed) {
        throw new Error("Failed to parse response")
    }

    return parsed
}
