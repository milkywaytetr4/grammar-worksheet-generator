// 文法ノードの解説ストア
//
// ノードidをキーに、その用法の解説と代表的な英語表現を蓄積する。
// 全ノードに書く必要はなく、書いた分だけプロンプトが濃くなる。
// リーフだけでなく親ノードにも書ける。プロンプト生成時はルートから
// リーフまでのパス上の全ノードの解説が集約される。

export type GrammarNote = {
    // その用法・カテゴリが表す意味の説明
    description: string
    // この用法が自然に現れる代表的な英語表現・語句
    examples?: string[]
}

export const grammarNotes: Record<string, GrammarNote> = {
    "article-indefinite": {
        description:
            "不定冠詞 a / an は、数えられる名詞が「1つの実体」として立ち上がるときに付く。元々は one に由来し、『いくつかあるうちの1つ』『とある』『ちょっと』など、文脈により含みが変化する。",
    },
    "article-a-brief": {
        description:
            "a には『ちょっと/少し』という含みがある。動作や状態を一区切りの量として名詞化するときに現れ、その一回性・短さを表す。",
        examples: [
            "take a look at the report",
            "have a shower before dinner",
            "the mountains at a distance",
            "give the idea a try",
            "take a short walk",
        ],
    },
    "article-a-per": {
        description:
            "a は『〜につき』という単位・割合を表す。頻度や価格、速度などを単位あたりで示すときに使う。",
        examples: [
            "twice a week",
            "60 kilometers an hour",
            "five dollars a kilo",
        ],
    },
}
