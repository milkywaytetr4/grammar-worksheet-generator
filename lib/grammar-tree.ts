import { GrammarNode } from "./types"

export const grammarTree: GrammarNode[] = [
    {
        id: "infinitive",
        label: "不定詞",
        children: [
            { id: "to-inf-noun", label: "名詞的用法" },
            { id: "to-inf-adjective", label: "形容詞的用法" },
            { id: "to-inf-adverb", label: "副詞的用法" },
            { id: "tough-construction", label: "tough構文" },
            { id: "to-inf-wh", label: "疑問詞 + to不定詞" },
            { id: "to-inf-too-enough", label: "too〜to / enough to" },
            { id: "to-inf-subject", label: "意味上の主語 (for/of)" },
            { id: "bare-infinitive", label: "原形不定詞 (知覚・使役)" },
        ],
    },
    {
        id: "gerund",
        label: "動名詞",
        children: [
            { id: "gerund-basic", label: "主語・補語・目的語" },
            { id: "gerund-verb", label: "動名詞を目的語にとる動詞" },
            { id: "gerund-prep", label: "前置詞 + 動名詞" },
            { id: "gerund-idiom", label: "慣用表現" },
        ],
    },
    {
        id: "participle",
        label: "分詞",
        children: [
            { id: "participle-adj", label: "形容詞的用法" },
            { id: "participle-construction", label: "分詞構文" },
            {
                id: "participle-construction-independent",
                label: "独立分詞構文",
                children: [
                    { id: "participle-construction-independent-subject", label: "意味上の主語を明示する形" },
                    { id: "participle-construction-independent-idiom", label: "慣用表現 (generally speaking など)" },
                ],
            },
            { id: "participle-with", label: "付帯状況の with" },
        ],
    },
    {
        id: "relative",
        label: "関係詞",
        children: [
            {
                id: "rel-pronoun",
                label: "関係代名詞",
                children: [
                    { id: "rel-pronoun-subject", label: "主格" },
                    { id: "rel-pronoun-object", label: "目的格 (省略可)" },
                    { id: "rel-pronoun-possessive", label: "所有格 whose" },
                    { id: "rel-pronoun-prep", label: "前置詞 + 関係代名詞" },
                    { id: "rel-pronoun-prep-advanced", label: "前置詞 + 関係代名詞の発展型 (some of whom など)" },
                    { id: "rel-pronoun-chain", label: "連鎖関係代名詞" },
                ],
            },
            {
                id: "rel-what",
                label: "関係代名詞 what",
                children: [
                    { id: "rel-what-basic", label: "the thing which" },
                    { id: "rel-what-idiom", label: "what の慣用表現" },
                ],
            },
            {
                id: "rel-adjective",
                label: "関係形容詞",
                children: [
                    { id: "rel-adjective-which", label: "関係形容詞のwhich" },
                    { id: "rel-adjective-what", label: "関係形容詞のwhat (すべての〜)" },
                ],
            },
            {
                id: "rel-adverb",
                label: "関係副詞",
                children: [
                    { id: "rel-adverb-basic", label: "when / where / why / how" },
                    { id: "rel-adverb-noantecedent", label: "先行詞の省略 (名詞節)" },
                ],
            },
            {
                id: "rel-nonrestrictive",
                label: "非制限用法",
                children: [
                    { id: "rel-nonrestrictive-basic", label: "基本 (補足説明)" },
                    { id: "rel-nonrestrictive-sentence", label: "文の全体・一部が先行詞" },
                    { id: "rel-nonrestrictive-proper", label: "固有名詞が先行詞" },
                ],
            },
            {
                id: "rel-compound",
                label: "複合関係詞",
                children: [
                    { id: "rel-compound-noun", label: "名詞節" },
                    { id: "rel-compound-adverb", label: "譲歩の副詞節" },
                ],
            },
        ],
    },
    {
        id: "subjunctive",
        label: "仮定法",
        children: [
            { id: "subj-past", label: "仮定法過去" },
            { id: "subj-pastperfect", label: "仮定法過去完了" },
            { id: "subj-wish", label: "I wish 〜" },
            { id: "subj-asif", label: "as if 〜" },
        ],
    },
    {
        id: "comparison",
        label: "比較",
        children: [
            { id: "comp-positive", label: "原級 (as 〜 as)" },
            { id: "comp-comparative", label: "比較級" },
            { id: "comp-superlative", label: "最上級" },
            { id: "comp-idiom", label: "比較の慣用表現" },
        ],
    },
    {
        id: "tense",
        label: "時制",
        children: [
            { id: "tense-present-perfect", label: "現在完了" },
            { id: "tense-past-perfect", label: "過去完了" },
            { id: "tense-future", label: "未来表現" },
        ],
    },
    {
        id: "passive",
        label: "受動態",
        children: [
            { id: "passive-basic", label: "基本の受動態" },
            { id: "passive-byless", label: "by を使わない受動態" },
        ],
    },
    {
        id: "article",
        label: "冠詞",
        children: [
            {
                id: "article-indefinite",
                label: "不定冠詞 a / an",
                children: [
                    { id: "article-a-one-of-many", label: "いくつかあるうちの1つ" },
                    { id: "article-a-certain", label: "「とある〜」" },
                    { id: "article-a-one", label: "「1」" },
                    { id: "article-a-brief", label: "「ちょっと」" },
                    { id: "article-a-per", label: "「〜につき」" },
                ],
            },
            {
                id: "article-definite",
                label: "定冠詞 the",
                children: [
                    { id: "article-the-unique", label: "「唯一」" },
                    { id: "article-the-contrast", label: "対比の the" },
                    { id: "article-the-nature", label: "環境the" },
                    { id: "article-the-plural", label: "複数名詞 + the" },
                    { id: "article-the-relative", label: "関係詞と冠詞" },
                    { id: "article-the-generic", label: "総称の the" },
                    { id: "article-the-tool", label: "the + 道具" },
                    { id: "article-the-adjective", label: "the + 形容詞" },
                    { id: "article-the-per-unit", label: "「〜単位で」の the" },
                    { id: "article-the-media", label: "媒体・情報源の the" },
                ],
            },
            {
                id: "article-zero",
                label: "無冠詞 / 不可算名詞",
                children: [
                    { id: "article-zero-by", label: "手段の by" },
                    { id: "article-zero-function", label: "「機能」を表すとき" },
                    { id: "article-zero-countable", label: "不可算 + 形容詞 → 可算化" },
                    { id: "article-zero-uncountable", label: "全体集合" },
                ],
            },
        ],
    },
]

// 指定IDのノードをツリーから検索

export function findNodeById(
    id: string,
    nodes: GrammarNode[] = grammarTree
): GrammarNode | undefined {
    for (const node of nodes) {
        if (node.id === id) {
            return node
        }
        if (node.children) {
            const found = findNodeById(id, node.children)
            if (found) {
                return found
            }
        }
    }
    return undefined
}

// ノード配下の全ノードを取得

export function collectLeaves(node: GrammarNode): GrammarNode[] {
    if (!node.children?.length) {
        return [node]
    }
    return node.children.flatMap(collectLeaves)
}

// リーフとそのパス (ルート→リーフ)

export type LeafWithPath = {
    leaf: GrammarNode
    // ルートからリーフまでのノード列。末尾がleaf自身。
    path: GrammarNode[]
}

// ルートから指定IDのノードまでの祖先チェーンを取得 (末尾が対象ノード)

function findAncestorPath(
    id: string,
    nodes: GrammarNode[] = grammarTree,
    trail: GrammarNode[] = []
): GrammarNode[] | undefined {
    for (const node of nodes) {
        const nextTrail = [...trail, node]
        if (node.id === id) {
            return nextTrail
        }
        if (node.children) {
            const found = findAncestorPath(id, node.children, nextTrail)
            if (found) {
                return found
            }
        }
    }
    return undefined
}

// 指定ノード配下の全リーフを、ルートからのパス付きで取得

export function collectLeavesWithPath(id: string): LeafWithPath[] {
    const base = findAncestorPath(id)
    if (!base) {
        return []
    }
    const node = base[base.length - 1]
    const prefix = base.slice(0, -1)

    const walk = (current: GrammarNode, ancestors: GrammarNode[]): LeafWithPath[] => {
        const path = [...ancestors, current]
        if (!current.children?.length) {
            return [{ leaf: current, path }]
        }
        return current.children.flatMap((child) => walk(child, path))
    }

    return walk(node, prefix)
}

