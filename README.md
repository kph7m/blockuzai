# blockuzai 🎯
AIだけでブロック崩しできるかな

**Live Demo**: https://blockuzai.web.app

## 🚀 セットアップ

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev

# 本番ビルド（静的エクスポート）
npm run build
```

## 🎮 遊び方

1. 開発サーバーを起動して `http://localhost:3000` にアクセス
2. ゲームスタートボタンをタップ/クリック（またはスペースキー）
3. **PC**: ← → キーまたは画面をクリック/ドラッグしてパドルを動かす
4. **スマホ**: 画面をタップ、スワイプ、ドラッグしてパドルを動かす
   - パドル付近または画面下部をドラッグすると滑らかに操作可能
   - 画面上部をタップするとその位置にジャンプ移動
5. 全てのブロックを壊してクリアを目指そう！

## 機能

- ✨ カラフルなブロック
- 🎨 グラデーション背景
- 📱 スマホ対応（タッチ操作・レスポンシブデザイン）
- 🖱️ 画面のどこでもクリック/タップでパドルを移動
- 👆 ドラッグ/スワイプ操作対応（スムーズなパドル制御）
- 🎮 マルチモード入力（キーボード、マウス、タッチの併用可能）

## 技術スタック

- Next.js 14 (SSG)
- React 18
- TypeScript

## 🚢 デプロイ

このプロジェクトは、`main` ブランチにマージされると自動的にFirebase Hostingにデプロイされます。

### Firebase Hostingの設定

1. Firebaseプロジェクトのサービスアカウントキーを取得
2. GitHubリポジトリの Settings > Secrets and variables > Actions に移動
3. `FIREBASE_SERVICE_ACCOUNT_BLOCKUZAI` という名前で新しいシークレットを追加
4. サービスアカウントのJSONキーの内容を貼り付ける

デプロイワークフローは `.github/workflows/firebase-hosting-merge.yml` で定義されています。
