/**
 * Firebase Cloud Functions (2nd Gen)
 * Firestore onWrite トリガーによる BigQuery `discovery_poc.domain_nodes` への自動同期
 * 
 * 対象 Firestore コレクション:
 * 1. `spatial_nodes/{nodeId}` (ルート空間ノードコレクション)
 * 2. `users/{userId}/saved_nodes/{nodeId}` (ユーザー保存ノードサブコレクション)
 */

import { onDocumentWritten } from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import { BigQuery } from "@google-cloud/bigquery";

// BigQuery クライアントの遅延初期化
let bqClient: BigQuery | null = null;
function getBigQuery(): BigQuery {
  if (!bqClient) {
    bqClient = new BigQuery({
      projectId: process.env.GCP_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT,
    });
  }
  return bqClient;
}

const DATASET_ID = process.env.BQ_DATASET_ID || "discovery_poc";
const TABLE_ID = process.env.BQ_TABLE_ID || "domain_nodes";

/**
 * 12領域のドメイン名バリデーション & 正規化
 * economy/art/sns/people/audio/documents/law/architecture/nature/sketch/records/media
 */
const DOMAIN_MAP: Record<string, string> = {
  // 英語キー
  "economy": "economy",
  "art": "art",
  "sns": "sns",
  "people": "people",
  "audio": "audio",
  "documents": "documents",
  "law": "law",
  "architecture": "architecture",
  "nature": "nature",
  "sketch": "sketch",
  "records": "records",
  "media": "media",
  // 日本語 12領域名称のフォールバックマッピング
  "経済": "economy",
  "芸術": "art",
  "身体": "people",
  "言語": "documents",
  "文書": "documents",
  "制度": "law",
  "建築": "architecture",
  "生態": "nature",
  "スケッチ": "sketch",
  "記録": "records",
  "技術": "media",
  "心理": "sns",
  "歴史": "records",
  "宗教": "law"
};

function normalizeDomain(input: any): string {
  if (!input || typeof input !== "string") return "records";
  const lower = input.trim().toLowerCase();
  return DOMAIN_MAP[lower] || DOMAIN_MAP[input.trim()] || "records";
}

function extractTags(input: any): string[] {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input.map(t => String(t).trim()).filter(Boolean);
  }
  if (typeof input === "string") {
    return input.split(/[,、\s]+/).map(t => t.trim()).filter(Boolean);
  }
  return [];
}

/**
 * Firestore ドキュメント変更を BigQuery に反映するコアロジック
 */
async function syncNodeChangeToBigQuery(
  nodeId: string,
  afterData: Record<string, any> | undefined
) {
  const bq = getBigQuery();
  const tableRef = `\`${DATASET_ID}.${TABLE_ID}\``;

  // 1. 削除イベント (afterData が undefined)
  if (!afterData) {
    logger.info(`Node ${nodeId} deleted from Firestore. Removing from BigQuery...`);
    const deleteSql = `DELETE FROM ${tableRef} WHERE node_id = @nodeId`;
    await bq.query({
      query: deleteSql,
      params: { nodeId },
    });
    logger.info(`Node ${nodeId} successfully deleted from ${tableRef}.`);
    return;
  }

  // 2. 作成または更新イベント (MERGE 文による冪等な Upsert)
  const domain = normalizeDomain(afterData.domain || afterData.sector || afterData.category);
  const title = String(afterData.title || afterData.code || nodeId).trim();
  const tags = extractTags(afterData.tags);
  const sourceUri = String(afterData.source_uri || afterData.source || `firestore://${nodeId}`);

  // created_at のパース (Firestore Timestamp または文字列/現在日時)
  let createdAtIso: string;
  if (afterData.created_at?.toDate && typeof afterData.created_at.toDate === "function") {
    createdAtIso = afterData.created_at.toDate().toISOString();
  } else if (afterData.createdAt?.toDate && typeof afterData.createdAt.toDate === "function") {
    createdAtIso = afterData.createdAt.toDate().toISOString();
  } else if (typeof afterData.created_at === "string") {
    createdAtIso = new Date(afterData.created_at).toISOString();
  } else if (typeof afterData.createdAt === "string") {
    createdAtIso = new Date(afterData.createdAt).toISOString();
  } else {
    createdAtIso = new Date().toISOString();
  }

  logger.info(`Syncing node ${nodeId} (domain: ${domain}, title: "${title}", tags: [${tags.join(", ")}]) to BigQuery...`);

  const mergeSql = `
    MERGE ${tableRef} T
    USING (
      SELECT 
        @nodeId AS node_id,
        @domain AS domain,
        @title AS title,
        @tags AS tags,
        @sourceUri AS source_uri,
        TIMESTAMP(@createdAtIso) AS created_at
    ) S
    ON T.node_id = S.node_id
    WHEN MATCHED THEN
      UPDATE SET 
        title = S.title,
        domain = S.domain,
        tags = S.tags,
        source_uri = S.source_uri
    WHEN NOT MATCHED THEN
      INSERT (node_id, domain, title, tags, source_uri, created_at)
      VALUES (S.node_id, S.domain, S.title, S.tags, S.source_uri, S.created_at)
  `;

  await bq.query({
    query: mergeSql,
    params: {
      nodeId,
      domain,
      title,
      tags,
      sourceUri,
      createdAtIso,
    },
  });

  logger.info(`Node ${nodeId} successfully merged into BigQuery ${tableRef}.`);
}

/**
 * 1. ルートコレクション `spatial_nodes/{nodeId}` の変更トリガー
 */
export const syncSpatialNodeToBigQuery = onDocumentWritten(
  {
    document: "spatial_nodes/{nodeId}",
    region: "asia-northeast1", // ユーザー環境に合わせて設定可能
    memory: "256MiB",
    timeoutSeconds: 60,
  },
  async (event) => {
    const nodeId = event.params.nodeId;
    const afterData = event.data?.after?.data();
    try {
      await syncNodeChangeToBigQuery(nodeId, afterData);
    } catch (error: any) {
      logger.error(`Failed to sync spatial_node ${nodeId} to BigQuery:`, error);
      throw error; // Cloud Functions の自動リトライをトリガー
    }
  }
);

/**
 * 2. ユーザー別サブコレクション `users/{userId}/saved_nodes/{nodeId}` の変更トリガー
 */
export const syncUserSavedNodeToBigQuery = onDocumentWritten(
  {
    document: "users/{userId}/saved_nodes/{nodeId}",
    region: "asia-northeast1",
    memory: "256MiB",
    timeoutSeconds: 60,
  },
  async (event) => {
    const nodeId = event.params.nodeId;
    const afterData = event.data?.after?.data();
    try {
      await syncNodeChangeToBigQuery(nodeId, afterData);
    } catch (error: any) {
      logger.error(`Failed to sync user saved_node ${nodeId} to BigQuery:`, error);
      throw error;
    }
  }
);
