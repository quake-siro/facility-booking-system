# 施設予約システム

React + TypeScript + Node.js + Express + SQLiteを使用した施設予約システムです。

## 機能

- 🏢 施設一覧表示
- 📅 施設予約機能
- 📋 予約一覧表示
- ❌ 予約キャンセル機能
- 💰 料金計算機能
- 📱 レスポンシブデザイン

## 技術スタック

### フロントエンド
- React18- TypeScript
- CSS3Grid/Flexbox)

### バックエンド
- Node.js
- Express.js
- SQLite3
- CORS

## セットアップ

### 前提条件
- Node.js (v16上)
- npm

### インストール
1リポジトリをクローン
```bash
git clone <repository-url>
cd facility-booking-system
```

2存関係をインストール
```bash
npm run install-all
```

### 開発サーバー起動

```bash
npm run dev
```

これにより以下が起動します：
- フロントエンド: http://localhost:30
- バックエンド: http://localhost:500

## API エンドポイント

### 施設関連
- `GET /api/facilities` - 施設一覧取得
- `GET /api/facilities/:id` - 施設詳細取得

### 予約関連
- `GET /api/bookings` - 予約一覧取得
- `POST /api/bookings` - 予約作成
- `PUT /api/bookings/:id/cancel` - 予約キャンセル

## データベース構造

### facilities テーブル
- id (PRIMARY KEY)
- name (施設名)
- description (説明)
- capacity (定員)
- hourly_rate (時間料金)
- image_url (画像URL)
- created_at (作成日時)

### bookings テーブル
- id (PRIMARY KEY)
- facility_id (FOREIGN KEY)
- user_name (予約者名)
- user_email (メールアドレス)
- start_time (開始時間)
- end_time (終了時間)
- total_price (総料金)
- status (ステータス)
- created_at (作成日時)

## 使用方法1で http://localhost:3000 にアクセス2. 施設一覧から予約したい施設を選択
3. 予約フォームに必要事項を入力
4. 予約確定ボタンをクリック5. 予約一覧で予約状況を確認

## ライセンス

MIT License 