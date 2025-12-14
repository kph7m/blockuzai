# blockuzai
AIだけでブロック崩しできるかな

## 🎮 遊び方

1. スペースキーでゲームスタート
2. ← → キーでパドルを動かす
3. 全てのブロックを壊してクリアを目指そう！

## 機能

- ✨ カラフルなブロック
- 🎯 スコアシステム
- ❤️ ライフシステム（3回まで）
- 🎨 グラデーション背景

## 🛠️ 開発環境のセットアップ

### 前提条件

- Node.js 16.x 以降
- npm または yarn

### インストール

```bash
# 依存関係をインストール
npm install
```

### 開発サーバーの起動

```bash
# 開発サーバーを起動（ホットリロード有効）
npm run dev
```

ブラウザで `http://localhost:3000` が自動的に開きます。

### ビルド

```bash
# 本番用ビルドを作成
npm run build
```

ビルド成果物は `dist/` ディレクトリに出力されます。

### プレビュー

```bash
# 本番ビルドをローカルでプレビュー
npm run preview
```

### TypeScript 型チェック

```bash
# 型チェックを実行
npm run typecheck
```

### コード品質

```bash
# ESLint でコードをチェック
npm run lint

# Prettier でコードをフォーマット
npm run format
```

## 📁 プロジェクト構成

```
blockuzai/
├── src/
│   ├── main.ts       # エントリーポイント
│   ├── game.ts       # ゲームロジック
│   └── types.ts      # TypeScript 型定義
├── index.html        # HTML テンプレート
├── package.json      # プロジェクト設定
├── tsconfig.json     # TypeScript 設定
├── vite.config.ts    # Vite 設定
└── README.md         # このファイル
```

## 🚀 技術スタック

- **TypeScript** - 型安全な開発
- **Vite** - 高速なビルドツール
- **ESLint** - コード品質チェック
- **Prettier** - コードフォーマッター
