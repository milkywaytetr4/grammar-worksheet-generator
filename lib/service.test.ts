import { describe, expect, it } from "vitest"
import { buildPrompt } from "./service"
import { collectLeavesWithPath } from "./grammar-tree"

describe("buildPrompt", () => {
    it("ルートからのパスをプロンプトに埋め込む", () => {
        const leaves = collectLeavesWithPath("article-a-brief")
        const prompt = buildPrompt(leaves, 3)

        expect(prompt).toContain("冠詞 > 不定冠詞 a / an > 「ちょっと」")
        expect(prompt).toContain("(id: article-a-brief)")
        expect(prompt).toContain("3問")
    })

    it("パス上のリーフの解説と例を含める", () => {
        const leaves = collectLeavesWithPath("article-a-brief")
        const prompt = buildPrompt(leaves, 1)

        expect(prompt).toContain("『ちょっと/少し』")
        expect(prompt).toContain("take a look at the report")
    })

    it("パス上の親ノードの解説を上位文脈として含める", () => {
        const leaves = collectLeavesWithPath("article-a-brief")
        const prompt = buildPrompt(leaves, 1)

        // article-indefinite の解説が上位文脈として現れる
        expect(prompt).toContain("上位文脈 (不定冠詞 a / an)")
        expect(prompt).toContain("one に由来")
    })

    it("解説のないリーフでもパスは描画される", () => {
        const leaves = collectLeavesWithPath("tough-construction")
        const prompt = buildPrompt(leaves, 2)

        expect(prompt).toContain("不定詞 > tough構文")
        expect(prompt).toContain("(id: tough-construction)")
    })
})
