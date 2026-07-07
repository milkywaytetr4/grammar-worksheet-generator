import { describe, expect, it } from "vitest"
import { collectLeavesWithPath } from "./grammar-tree"

describe("collectLeavesWithPath", () => {
    it("リーフidを渡すと、ルートからそのリーフまでのパスを返す", () => {
        const result = collectLeavesWithPath("article-a-brief")

        expect(result).toHaveLength(1)
        const { leaf, path } = result[0]
        expect(leaf.id).toBe("article-a-brief")
        expect(path.map((n) => n.id)).toEqual([
            "article",
            "article-indefinite",
            "article-a-brief",
        ])
        expect(path.map((n) => n.label)).toEqual([
            "冠詞",
            "不定冠詞 a / an",
            "「ちょっと」",
        ])
    })

    it("中間ノードを渡すと、配下の全リーフをルートからのパス付きで返す", () => {
        const result = collectLeavesWithPath("article-indefinite")

        // 不定冠詞 a / an 配下のリーフ全て
        expect(result.map((r) => r.leaf.id).sort()).toEqual([
            "article-a-brief",
            "article-a-certain",
            "article-a-one",
            "article-a-one-of-many",
            "article-a-per",
        ])
        // どのパスもルート(冠詞)から始まる
        for (const { path } of result) {
            expect(path[0].id).toBe("article")
            expect(path[1].id).toBe("article-indefinite")
            expect(path[path.length - 1].children).toBeUndefined()
        }
    })

    it("ルートカテゴリを渡すと、その全リーフをパス付きで返す", () => {
        const result = collectLeavesWithPath("infinitive")

        expect(result.length).toBeGreaterThan(0)
        for (const { path } of result) {
            expect(path[0].id).toBe("infinitive")
        }
        expect(result.map((r) => r.leaf.id)).toContain("tough-construction")
    })

    it("存在しないidには空配列を返す", () => {
        expect(collectLeavesWithPath("no-such-id")).toEqual([])
    })
})
