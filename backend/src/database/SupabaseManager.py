import pandas as pd
import numpy as np
from supabase import create_client, Client
from typing import List, Dict

from src import config as cfg
from utils import get_logger

logger = get_logger(__name__)


class SupabaseManager:
    """Manages all interactions with the Supabase database."""

    def __init__(self):
        """Initializes the Supabase client using the SERVICE_ROLE_KEY."""
        if not cfg.SUPABASE_URL or not cfg.SUPABASE_SERVICE_KEY:
            logger.critical("❌ Supabase URL or SERVICE_ROLE_KEY not found in config.")
            raise ValueError("Supabase credentials are not set in the environment.")
        try:
            self.client: Client = create_client(
                cfg.SUPABASE_URL, cfg.SUPABASE_SERVICE_KEY
            )
            logger.info("✅ Supabase client initialized successfully.")
        except Exception as e:
            logger.critical(f"❌ Failed to initialize Supabase client: {e}")
            raise

    def fetch_category_map(self) -> dict:
        """Fetches all categories from the database and returns a name-to-ID dictionary."""
        logger.info("Fetching category map from the database...")
        try:
            response = self.client.table("categories").select("id, name").execute()
            if response.data:
                category_map = {item["name"]: item["id"] for item in response.data}
                logger.info(f"✅ Loaded {len(category_map)} categories into memory.")
                return category_map
            else:
                logger.warning(
                    "⚠️ The 'categories' table is empty. No categories to map."
                )
                return {}
        except Exception as e:
            logger.error(f"❌ Failed to fetch category map: {e}")
            return {}

    def _clean_dataframe_for_upsert(self, df: pd.DataFrame) -> pd.DataFrame:
        """(Internal) Cleans a DataFrame before inserting into Supabase."""
        df_clean = df.copy()
        
        # Convert datetime to ISO string
        for col in df_clean.columns:
            if pd.api.types.is_datetime64_any_dtype(df_clean[col]):
                df_clean[col] = df_clean[col].apply(lambda x: x.isoformat() if not pd.isnull(x) else None)
        
        # Replace NaN with None
        df_clean = df_clean.where(pd.notnull(df_clean), None)
        
        # Convert array-like objects to lists
        for col in df_clean.columns:
            df_clean[col] = df_clean[col].apply(
                lambda x: x.tolist() if hasattr(x, "tolist") else (list(x) if isinstance(x, (np.ndarray, list)) else x)
            )
            
        return df_clean

    def store_data(self, df: pd.DataFrame, category_map: dict):
        """Stores all processed data using vectorized operations."""
        if df.empty:
            logger.warning("DataFrame is empty. Nothing to store.")
            return

        logger.info(f"🚀 Starting data storage for {len(df)} articles.")

        # --- Prepare Article Records ---
        article_cols = [
            "url",
            "title",
            "source",
            "published_at",
            "image_url",
            "summary",
            "keywords",
            "trending_score",
            "is_critical",
        ]

        df_for_insert = df.copy()
        df_for_insert.rename(columns={"source_name": "source"}, inplace=True)
        available_cols = [c for c in article_cols if c in df_for_insert.columns]

        if len(available_cols) != len(article_cols):
            missing = set(article_cols) - set(available_cols)
            logger.warning(
                f"Some expected article columns are missing and will be skipped: {sorted(missing)}"
            )

        cleaned_articles_df = self._clean_dataframe_for_upsert(df_for_insert[available_cols])
        article_records = cleaned_articles_df.to_dict(orient="records")

        # --- Prepare Embedding Records ---
        embedding_records = []
        if "embedding" in df.columns and not df["embedding"].isnull().all():
            emb_df = df[["url", "embedding"]].copy()
            emb_df = self._clean_dataframe_for_upsert(emb_df)
            embedding_records = emb_df.to_dict(orient="records")

        # --- Prepare Category Records ---
        category_link_records = []
        if (
            "categories" in df.columns
            and df["categories"]
            .apply(lambda v: isinstance(v, (list, tuple)) and len(v) > 0)
            .any()
        ):
            cat_df = (
                df[["url", "categories"]]
                .explode("categories")
                .dropna(subset=["categories"])
            )
            cat_df["category_id"] = cat_df["categories"].map(category_map)
            category_link_records = cat_df.dropna(subset=["category_id"])[
                ["url", "category_id"]
            ].to_dict(orient="records")

        # --- Execute RPC Transaction ---
        try:
            logger.info("Executing upsert_articles_transaction RPC...")
            payload = {
                "articles": article_records,
                "embeddings": embedding_records,
                "categories": category_link_records,
            }
            response = self.client.rpc("upsert_articles_transaction", payload).execute()
            logger.info(f"✅ Successfully completed transaction for {len(article_records)} articles.")
        except Exception as e:
            logger.error(f"❌ Error during RPC transaction: {e}")
            raise

    def _execute_upsert(self, table_name: str, records: List[Dict], record_type: str):
        """(Internal) Helper function to execute and log an upsert operation."""
        if not records:
            return
        try:
            logger.info(f"Inserting {len(records)} {record_type}...")
            self.client.table(table_name).upsert(records).execute()
            logger.info(f"✅ {record_type.capitalize()} inserted.")
        except Exception as e:
            logger.error(f"❌ Error inserting {record_type}: {e}")

    def refresh_materialized_feeds(self):
        """
        Triggers the PostgreSQL functions to refresh the trending and critical caches.
        This should be called at the end of a successful pipeline run.
        """
        logger.info("Triggering database functions to refresh materialized feeds...")
        try:
            # Call the two PostgreSQL functions using rpc()
            self.client.rpc("refresh_trending_cache").execute()
            self.client.rpc("refresh_critical_cache").execute()
            logger.info("✅ Successfully triggered feed cache refresh.")
        except Exception as e:
            logger.error(f"❌ Failed to trigger feed cache refresh: {e}")

    def log_pipeline_run(
        self, status: str, records_added: int = 0, error_message: str = None
    ):
        """Logs a summary of the pipeline execution to the api_logs table."""
        log_entry = {
            "source": "daily_pipeline_run",
            "status": status,
            "records_added": records_added,
            "error_message": error_message,
        }
        try:
            logger.info(f"Logging pipeline run to Supabase: status={status}")
            self.client.table("api_logs").insert(log_entry).execute()
        except Exception as e:
            logger.error(f"❌ Failed to log pipeline run to Supabase: {e}")
