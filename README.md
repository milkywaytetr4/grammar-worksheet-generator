## Grammar Worksheet Generator

高校英語の文法事項を選んで、和文英訳問題のプリントを自動生成するツールです。生成にはOpenAI APIを利用しています。

### 主な機能

- 不定詞・動名詞・分詞などの文法事項を木構造から選択して出題
- 問題文（日本語）と模範解答をOpenAI APIで自動生成
- 生成した問題のタイトル・指示文・本文を画面上で編集
- 印刷用レイアウトでのプレビュー・印刷

### セットアップ

```bash
npm install
```

`.env.example`を参考に`.env.local`を作成し、OpenAI APIキーを設定してください。

```bash
cp .env.example .env.local
```

```
OPENAI_API_KEY=sk-...
```

### 開発サーバーの起動

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) を開いて動作を確認してください。

### 注意事項

問題生成のたびにOpenAI APIを呼び出すため、利用状況に応じて課金が発生します。APIキーは第三者と共有しないでください。

### 使用技術

- [Next.js](https://nextjs.org)
- [OpenAI API](https://platform.openai.com/docs)
- [Zod](https://zod.dev)
