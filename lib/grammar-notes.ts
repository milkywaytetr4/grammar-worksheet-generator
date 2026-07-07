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
    "rel-pronoun": {
        description:
            "関係代名詞は、文をまるごと使って前の名詞(先行詞)を修飾するときのマーカー。それ自身が代名詞であり、導く文の中では主格・目的格・所有格のいずれかの名詞要素が1つ欠けている。",
    },
    "rel-pronoun-subject": {
        description:
            "主格の関係代名詞(who / which / that)。修飾する文の中で主語が欠けており、直後に動詞が続く。主格は省略できない。",
        examples: [
            "the engineer who designed this bridge",
            "a policy that protects small businesses",
            "documents which explain the process",
        ],
    },
    "rel-pronoun-object": {
        description:
            "目的格の関係代名詞(whom / which / that)。修飾する文の中で目的語が欠けている。目的格は省略できる。",
        examples: [
            "the report (that) the committee reviewed",
            "a colleague (whom) everyone respects",
            "the tools (which) we use every day",
        ],
    },
    "rel-pronoun-possessive": {
        description:
            "所有格の関係代名詞 whose。先行詞が後ろの名詞を所有する関係を表し、whose の直後には名詞が続く。",
        examples: [
            "a company whose products are sold worldwide",
            "the author whose novel won the prize",
        ],
    },
    "rel-pronoun-prep": {
        description:
            "前置詞と関係代名詞はまとめて先行詞の後ろに前置できる(the house in which she was born)。口語では前置詞を文末に残す形も使う。",
        examples: [
            "the period during which the city grew",
            "the principle on which the theory rests",
        ],
    },
    "rel-pronoun-chain": {
        description:
            "連鎖関係代名詞。I think / they say などの挿入をはさむ形で、関係代名詞はその奥の文の欠けた要素を指す(a man who I think is honest)。",
        examples: [
            "a candidate who we believe will succeed",
            "the plan which they say could work",
        ],
    },
    "rel-what": {
        description:
            "what は先行詞をその中に含む関係代名詞で、the thing(s) which に等しい。文全体が名詞節(主語・目的語・補語)になる。",
    },
    "rel-what-basic": {
        description:
            "what = the thing(s) which。先行詞を含むため、前に修飾する名詞を置かない。名詞節をつくる。",
        examples: [
            "What matters most is consistency.",
            "She finally got what she deserved.",
        ],
    },
    "rel-what-idiom": {
        description: "what を用いた慣用表現。",
        examples: [
            "what S used to be (かつての姿)",
            "what is called / what we call (いわゆる)",
            "what S is (今の姿)",
        ],
    },
    "rel-adjective": {
        description:
            "関係形容詞は、直後の名詞を内側から修飾しながら文をつなぐ。which / whose / what が使える。",
    },
    "rel-adjective-which": {
        description:
            "関係形容詞の which / whose。which は必ず非制限用法(コンマ付き)で、前の内容を受けて「その〜」と後ろの名詞を修飾する。",
        examples: [
            "The talks lasted three days, during which time no deal was reached.",
            "He was late again, which behavior annoyed his boss.",
        ],
    },
    "rel-adjective-what": {
        description:
            "関係形容詞の what は「すべての〜」「〜だけの…全部」の意で、直後の名詞を修飾する(what little money I had)。",
        examples: [
            "She shared what information she had.",
            "They spent what money remained on repairs.",
        ],
    },
    "rel-adverb": {
        description:
            "関係副詞(when / where / why / how)は先行詞(時・場所・理由・方法)を修飾し、後ろには欠けのない完全文が続く。「前置詞 + 関係代名詞」を関係副詞で書き換えられる関係にある。",
    },
    "rel-adverb-basic": {
        description:
            "when(時) / where(場所) / why(理由) / how(方法)。後ろは完全文。how は先行詞 the way と併用しない。",
        examples: [
            "the day when the factory opened",
            "the town where he grew up",
            "the reason why prices rose",
            "This is how the system works.",
        ],
    },
    "rel-adverb-noantecedent": {
        description:
            "関係副詞は先行詞(the place / the time など)を省略でき、その場合は全体が名詞節になる。",
        examples: [
            "This is where I work.",
            "Monday is when the results come out.",
        ],
    },
    "rel-nonrestrictive": {
        description:
            "非制限用法。コンマを置いて先行詞に補足説明を加える(限定はしない)。that は使えず、非制限では who / which を用いる。",
        examples: [
            "My uncle, who lives in Osaka, is a doctor.",
            "The proposal, which took months to draft, was rejected.",
        ],
    },
    "rel-compound": {
        description:
            "複合関係詞(whatever / whichever / whoever / whenever / wherever / however)。先行詞を含み、名詞節または譲歩の副詞節をつくる。",
    },
    "rel-compound-noun": {
        description:
            "複合関係詞が名詞節をつくる場合、anything that / anyone who などに言い換えられる。",
        examples: [
            "You may order whatever you like.",
            "Whoever finishes first wins the prize.",
        ],
    },
    "rel-compound-adverb": {
        description:
            "複合関係詞が譲歩の副詞節をつくる場合、no matter what / no matter how などに言い換えられる。",
        examples: [
            "Whatever happens, we will support you.",
            "However hard it looks, keep trying.",
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
