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
            { id: "participle-with", label: "付帯状況の with" },
        ],
    },
    {
        id: "relative",
        label: "関係詞",
        children: [
            { id: "rel-pronoun", label: "関係代名詞" },
            { id: "rel-adverb", label: "関係副詞" },
            { id: "rel-what", label: "関係代名詞 what" },
            { id: "rel-nonrestrictive", label: "非制限用法" },
            { id: "rel-compound", label: "複合関係詞" },
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

