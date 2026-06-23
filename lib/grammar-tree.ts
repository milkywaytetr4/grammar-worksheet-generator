import { GrammarNode } from "./types"

export const grammarTree: GrammarNode[] = [
    {
        id: "infinitive",
        label: "不定詞",
        children: [
        { id: "to-inf-noun",       label: "名詞的用法" },
        { id: "to-inf-adjective",  label: "形容詞的用法" },
        { id: "to-inf-adverb",     label: "副詞的用法" },
        { id: "tough-construction", label: "tough構文" },
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

