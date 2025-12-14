# blockuzai
AIだけでブロック崩しできるかな

ブロック崩しゲームをTypeScript + React + Viteで実装しています。

## 🎮 遊び方

1. スペースキーでゲームスタート
2. ← → キーでパドルを動かす
3. 全てのブロックを壊してクリアを目指そう！

## 機能

- ✨ カラフルなブロック
- 🎯 スコアシステム
- ❤️ ライフシステム（3回まで）
- 🎨 グラデーション背景

## 🛠️ 開発環境

### 必要な環境

- Node.js (v18以上推奨)
- npm

### インストール

```bash
npm install
```

### 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:5173` を開いてゲームをプレイできます。

### プロダクションビルド

```bash
npm run build
```

ビルドされたファイルは `dist/` ディレクトリに出力されます。

### ビルドのプレビュー

```bash
npm run preview
```

### TypeScriptの型チェック

```bash
npm run typecheck
```

### コードのLint

```bash
npm run lint
```

### コードのフォーマット

```bash
npm run format
```

## 📁 プロジェクト構成

```
blockuzai/
├── src/
│   ├── game/
│   │   ├── engine.ts      # ゲームロジック
│   │   └── types.ts       # 型定義
│   ├── components/
│   │   └── GameCanvas.tsx # ゲームキャンバスコンポーネント
│   ├── App.tsx           # メインアプリケーション
│   ├── App.css           # スタイル
│   └── main.tsx          # エントリーポイント
├── index.html            # HTMLテンプレート
├── vite.config.ts        # Vite設定
├── tsconfig.json         # TypeScript設定
└── package.json          # プロジェクト設定
```

## 🚀 技術スタック

- **TypeScript** - 型安全な開発
- **React** - UIライブラリ
- **Vite** - 高速なビルドツール
- **ESLint** - コード品質チェック
- **Prettier** - コードフォーマッター
