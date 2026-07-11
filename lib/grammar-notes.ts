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
    "article-a-one-of-many": {
        description:
            "a は『いくつかあるうちの1つ』を表す。特定できない、代わりのきく1つという含み。a friend(友達の一人)であって my friend(特定の友達)ではない、という対比が典型。",
        examples: [
            "She is a friend of mine, not my only friend.",
            "A student came to ask about the exam.",
            "Could you pass me a pen?",
        ],
    },
    "article-a-certain": {
        description:
            "a は『とある〜』というぼんやりした一つを立ち上げる。逆に言えば、単に活動を述べたいだけなら目的語なしの動詞が自然で(drive / read)、drive a car や read a book のように a をつけると「どんな車/本?」という具体性を呼び込んで不自然になりうる。修飾語がつくと(a new car)その具体性が生きて読み手の興味を引く。",
        examples: [
            "She drives to work every day. (活動なら目的語なし)",
            "He showed up in a bright red car. (修飾語で具体性が生きる)",
            "A man was waiting outside the office.",
        ],
    },
    "article-a-one": {
        description:
            "a は数詞の one に近い『1』を表す。時間・重さなどの単位を1つ数えるときや、one を強調する慣用表現に現れる。",
        examples: [
            "a day / a minute / a kilogram",
            "Rome was not built in a day.",
            "not a single mistake",
            "There is only one solution, not a dozen.",
        ],
    },
    "article-a-brief": {
        description:
            "a には『ちょっと/少し』という含みがある。動作や状態を一区切りの量として名詞化するときに現れ、その一回性・短さを表す。at a distance(離れて)と in the distance(遠方で)のように the と含みが変わる点にも注意。",
        examples: [
            "take a look at the report",
            "have a shower before dinner",
            "make a brief stop at the next station",
            "watch the ship at a distance",
            "give the idea a try",
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
            "関係形容詞は、直後の名詞を内側から修飾しながら文をつなぐ。which / what が使える。",
    },
    "rel-adjective-which": {
        description:
            "関係形容詞の which。which は必ず非制限用法(コンマ付き)で、前の内容を受けて「その〜」と後ろの名詞を修飾する。「,前置詞+which+名詞」となることが多い。",
        examples: [
            "He may not come, in which case we will go without him.（主節の推量を表す表現を受けて、その場合は～となっていることに注意）",
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
    "article-definite": {
        description:
            "定冠詞 the は、話し手と聞き手の間でどれを指すか一つに定まる名詞に付く。状況・常識・文脈・唯一性などによって特定される。",
    },
    "article-the-unique": {
        description:
            "状況から自動的に指すものが決まるときの the。その場に1つしかない、あるいは文脈上ただ1つに定まるため聞き手も同じものを思い浮かべられる。序数や the last / the same など「一意に定まる語」もこの仲間。",
        examples: [
            "Can you shut the window?",
            "I'll be back by the end of the month",
            "Do you have the time?",
            "the first train / the same result",
        ],
    },
    "article-the-contrast": {
        description:
            "対比によって一意に定まる the。二項対立の一方を指すため、もう一方の存在を前提に「どちら」かが決まる。at night のように対比される概念が薄れた表現では無冠詞になる。",
        examples: [
            "the country and the city",
            "the right and the left",
            "the former / the latter",
            "in the morning / in the afternoon",
        ],
    },
    "article-the-nature": {
        description:
            "私たちを取り巻く環境として唯一の存在に付く the (the sun, the moon, the earth)。ただし物質・成分として一般に語るときは無冠詞になる (We couldn't survive without air and water)。sun も普段の会話では太陽系の恒星という唯一の存在を指す。",
        examples: [
            "the sun / the moon / the earth",
            "protect the environment",
            "What's the weather like today?",
            "We couldn't survive without air and water. (無冠詞との対比)",
        ],
    },
    "article-the-plural": {
        description:
            "複数名詞に付く the。メンバーが確定した「特定の集団(有限集合)」を指す。I like girls(女性一般が好き) と I like the girls(あの女の子たちが好き) の対比が典型。固有の集団名や『〜一家』にも使う。",
        examples: [
            "I like the girls in this class.",
            "the Beatles / the Seattle Mariners",
            "the Smiths (スミス一家・夫婦)",
        ],
    },
    "article-the-relative": {
        description:
            "関係詞で修飾されているからといって必ず the が付くわけではない。the が付くかは、その名詞が指す対象が一意に(有限集合として)定まるかで決まる。限定=the という短絡に注意。",
        examples: [
            "Japan is a country that lacks natural resources. (a のまま)",
            "the man who called you this morning (一意に定まる)",
        ],
    },
    "article-the-generic": {
        description:
            "種全体を代表させる総称の the。やや学問的・堅い響きで、発明品・動物・体の部分などを類として語るときに使う。",
        examples: [
            "The computer changed the way we work.",
            "The cat is a curious animal.",
            "The brain consumes a lot of energy.",
        ],
    },
    "article-the-tool": {
        description:
            "道具・楽器などを類として代表させる the。個々の一台ではなく、その道具一般を指す。",
        examples: [
            "The pen is mightier than the sword.",
            "She learned to play the piano.",
        ],
    },
    "article-the-adjective": {
        description:
            "the + 形容詞で「〜な人々」という複数普通名詞、または抽象概念を表す。集団を一意に括るため the が付く。",
        examples: [
            "support the elderly and the young",
            "help the poor",
            "the unknown / the unexpected",
        ],
    },
    "article-the-per-unit": {
        description:
            "『〜単位で』を表す the。by the + 単位名詞 の形で、量り売り・時間給など単位あたりの計算を示す。数えられる名詞なのに the を使う点に注意。",
        examples: [
            "be paid by the day",
            "be sold by the pound",
            "rent a car by the hour",
        ],
    },
    "article-the-media": {
        description:
            "媒体・情報源を指す慣用的な the。電話・インターネット・辞書・天気予報など、社会で共有された唯一の仕組みとして the を付ける。ほぼ定型表現として覚えるのがよい。",
        examples: [
            "talk on the phone",
            "look it up on the internet",
            "find the word in the dictionary",
            "according to the weather forecast",
        ],
    },
    "article-zero": {
        description:
            "無冠詞は、数えられない名詞や、種類・機能・手段など『実体としての1つ』を意識しない名詞に使う。物質・抽象・全体集合はイメージが1つに区切れないため冠詞が付かない。",
    },
    "article-zero-by": {
        description:
            "手段・方法を表す by の後は無冠詞。乗り物や連絡手段を『種類・手段』として抽象的に述べるため、具体的な1台を指す a/the を付けない。",
        examples: [
            "go to work by train",
            "send the file by email",
            "pay by card",
        ],
    },
    "article-zero-function": {
        description:
            "建物や場所を『本来の機能・目的』として使うときは無冠詞になる。建物そのもの(実体)ではなく、そこで行う活動を指すため。",
        examples: [
            "go to school / go to bed",
            "be in class",
            "be in hospital (英)",
        ],
    },
    "article-zero-countable": {
        description:
            "本来は不可算の名詞でも、形容詞などで種類・具体例が限定されると可算名詞化して a が付くことがある。『ある種の〜』という1つのまとまりとして立ち上がるため。",
        examples: [
            "a good education",
            "a fancy dinner",
            "a deep knowledge of history",
        ],
    },
    "article-zero-uncountable": {
        description:
            "全体をひとまとまりで捉える集合名詞・物質名詞は、輪郭が1つに区切れず無冠詞・不可算で扱う。個数を数えたいときは a piece of などを使う。",
        examples: [
            "baggage (米) / luggage (英)",
            "furniture / poetry",
            "a piece of advice",
        ],
    },
}
