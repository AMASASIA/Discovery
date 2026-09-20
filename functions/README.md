# Cloud Functions for Discovery: Firestore to BigQuery Sync

Firestore のドキュメント作成・更新・削除を検知し、BigQuery の `discovery_poc.domain_nodes` テーブルへ自動同期（MERGE / DELETE）する Firebase Cloud Functions (2nd Gen) の実装です。

## 構成
- **対象 Firestore コレクション**:
  1. `spatial_nodes/{nodeId}`（Discovery OS のルート空間ノード）
  2. `users/{userId}/saved_nodes/{nodeId}`（ユーザーごとの保存空間ノード）
- **同期先**: BigQuery `discovery_poc.domain_nodes`
  - `node_id`: STRING
  - `domain`: STRING (12領域の英語表記に正規化)
  - `title`: STRING
  - `tags`: ARRAY<STRING>
  - `source_uri`: STRING
  - `created_at`: TIMESTAMP
- **冪等性**: BigQuery の `MERGE` 文を使用して Upsert を行い、重複行の発生を防ぎます。削除時は対象の `node_id` を自動的に `DELETE` します。

## デプロイ手順

1. **必要な GCP API の有効化**:
   ```bash
   gcloud services enable cloudfunctions.googleapis.com eventarc.googleapis.com bigquery.googleapis.com
   ```

2. **サービスアカウントの権限確認**:
   Cloud Functions の実行サービスアカウントに以下のロールが付与されていることを確認します：
   - `roles/bigquery.dataEditor` または `roles/bigquery.user`（`discovery_poc` に対する書き込み・MERGE 権限）
   - `roles/bigquery.jobUser`（クエリジョブ実行権限）

3. **デプロイ**:
   ```bash
   firebase deploy --only functions
   ```
