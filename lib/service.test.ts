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

    it("難易度 easy では教科書的な指示に切り替わる", () => {
        const leaves = collectLeavesWithPath("article-a-brief")
        const easy = buildPrompt(leaves, 1, "easy")
        const difficult = buildPrompt(leaves, 1, "difficult")

        expect(easy).toContain("教科書的で典型的な例文")
        expect(easy).not.toContain("実用的な英文を心がけること")
        expect(difficult).toContain("実用的な英文を心がけること")
        expect(difficult).not.toContain("教科書的で典型的な例文")
    })

    it("難易度の既定は difficult", () => {
        const leaves = collectLeavesWithPath("article-a-brief")
        expect(buildPrompt(leaves, 1)).toContain("実用的な英文を心がけること")
    })

    it("解説のないリーフでもパスは描画される", () => {
        const leaves = collectLeavesWithPath("tough-construction")
        const prompt = buildPrompt(leaves, 2)

        expect(prompt).toContain("不定詞 > tough構文")
        expect(prompt).toContain("(id: tough-construction)")
    })

    it("新設した冠詞リーフのパスと解説を含める", () => {
        const perUnit = buildPrompt(collectLeavesWithPath("article-the-per-unit"), 1)
        expect(perUnit).toContain("冠詞 > 定冠詞 the > 「〜単位で」の the")
        expect(perUnit).toContain("by the day")

        const media = buildPrompt(collectLeavesWithPath("article-the-media"), 1)
        expect(media).toContain("媒体・情報源の the")
        expect(media).toContain("on the phone")
    })

    it("関係詞では中間ノードの解説も上位文脈として集約される", () => {
        const leaves = collectLeavesWithPath("rel-pronoun-object")
        const prompt = buildPrompt(leaves, 1)

        expect(prompt).toContain("関係詞 > 関係代名詞 > 目的格 (省略可)")
        // 親 rel-pronoun の解説が上位文脈として現れる
        expect(prompt).toContain("上位文脈 (関係代名詞)")
        // リーフ自身の解説
        expect(prompt).toContain("目的格は省略できる")
    })
})
