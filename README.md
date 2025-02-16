# Issue to PR

このプロジェクトは、GitHub の issue を使用して簡単に API エンドポイントを生成するためのツールです。

## 概要

- issueにエンドポイントの要件を簡単に定義し `api-generate` ラベルを付けると、自動的に API エンドポイントの実装を行います
- LangChain と Claude 3.5 を利用しています。

## 使い方

1. issue を作成する際に "API Template" テンプレートを選択
2. 以下の情報を入力:
   - エンドポイント（例: `POST /users/:userId/profile`）
   - リクエストパラメータ
   - レスポンスフィールド
   - その他の補足情報（認証要件など）
3. `api-generate` ラベルが付与されると、Github Action が発火し、APIの実装が開始され、プルリクエストまで自動作成されます。

## 特徴

- Prisma スキーマとの連携
- 自動的な Pull Request 生成
- エンドポイントの実装を効率化
- LangChain による AI ワークフローの最適化
- Claude 3.5 による高精度なコード生成

## 技術スタック

- **AI/ML**
  - LangChain: AI ワークフローの構築
  - モデル：claude3.5 sonnet

- **データベース**
  - Prisma: データベーススキーマ管理
- **その他**
  - GitHub API: Issue と PR の管理

