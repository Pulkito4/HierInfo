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
            self.client: Client = create_client(cfg.SUPABASE_URL, cfg.SUPABASE_SERVICE_KEY)
            logger.info("✅ Supabase client initialized successfully.")
        except Exception as e:
            logger.critical(f"❌ Failed to initialize Supabase client: {e}")
            raise

    def fetch_category_map(self) -> dict:
        """Fetches all categories from the database and returns a name-to-ID dictionary."""
        logger.info("Fetching category map from the database...")
        try:
            response = self.client.table('categories').select('id, name').execute()
            if response.data:
                category_map = {item['name']: item['id'] for item in response.data}
                logger.info(f"✅ Loaded {len(category_map)} categories into memory.")
                return category_map
            else:
                logger.warning("⚠️ The 'categories' table is empty. No categories to map.")
                return {}
        except Exception as e:
            logger.error(f"❌ Failed to fetch category map: {e}")
            return {}

    def _clean_records_for_upsert(self, records: List[Dict]) -> List[Dict]:
        """(Internal) Cleans a list of dictionaries before inserting into Supabase."""
        cleaned_records = []
        for record in records:
            cleaned_record = {}
            for key, value in record.items():
                # Normalize common types and avoid ambiguous truth checks
                if value is None:
                    cleaned_record[key] = None
                elif isinstance(value, (np.ndarray, list)):
                    # Convert any array-like to a plain list
                    cleaned_record[key] = value.tolist() if hasattr(value, 'tolist') else list(value)
                elif isinstance(value, pd.Timestamp):
                    cleaned_record[key] = value.isoformat()
                else:
                    # Fallback to pandas isna with guard for types that raise
                    try:
                        cleaned_record[key] = None if pd.isna(value) else value
                    except Exception:
                        cleaned_record[key] = value
            cleaned_records.append(cleaned_record)
        return cleaned_records

    def store_data(self, df: pd.DataFrame, category_map: dict):
        """Stores all processed data using vectorized operations."""
        if df.empty:
            logger.warning("DataFrame is empty. Nothing to store.")
            return

        logger.info(f"🚀 Starting data storage for {len(df)} articles.")

        # --- 1. Upsert Articles and get their IDs ---
        article_cols = ['url', 'title', 'source', 'published_at', 'image_url', 
                         'summary', 'keywords', 'trending_score', 'is_critical']
        # Use only available columns to avoid KeyErrors if schema changes upstream
        available_cols = [c for c in article_cols if c in df.columns]
        if len(available_cols) != len(article_cols):
            missing = set(article_cols) - set(available_cols)
            logger.warning(f"Some expected article columns are missing and will be skipped: {sorted(missing)}")
        
        article_records = self._clean_records_for_upsert(df[available_cols].to_dict(orient='records'))

        try:
            article_response = self.client.table('news_articles').upsert(
                article_records, on_conflict='url', returning='representation'
            ).execute()
            if not article_response.data:
                logger.error("Failed to insert articles. Halting storage process.")
                return
            inserted_articles = article_response.data
            logger.info(f"✅ Successfully upserted {len(inserted_articles)} articles.")
        except Exception as e:
            logger.error(f"❌ Error inserting articles: {e}")
            return

        # --- 2. Prepare DataFrames for Embeddings and Categories ---
        url_to_id_map = {article['url']: article['id'] for article in inserted_articles}
        df['_article_id'] = df['url'].map(url_to_id_map)
        work_df = df[df['_article_id'].notna()].copy()

        # --- 3. Build and Upsert Embedding Records ---
        if 'embedding' in work_df.columns and not work_df['embedding'].isnull().all():
            emb_df = work_df[['_article_id', 'embedding']].copy()
            emb_df.rename(columns={'_article_id': 'article_id'}, inplace=True)
            emb_df['embedding'] = emb_df['embedding'].apply(lambda x: x.tolist() if hasattr(x, 'tolist') else x)
            
            embedding_records = emb_df.to_dict(orient='records')
            self._execute_upsert('news_embeddings', embedding_records, 'embeddings')

        # --- 4. Build and Upsert Category Link Records ---
        if 'categories' in work_df.columns and work_df['categories'].apply(lambda v: isinstance(v, (list, tuple)) and len(v) > 0).any():
            cat_df = work_df[['_article_id', 'categories']].explode('categories').dropna(subset=['categories'])
            cat_df['category_id'] = cat_df['categories'].map(category_map)
            cat_df.rename(columns={'_article_id': 'article_id'}, inplace=True)
            
            category_link_records = cat_df.dropna(subset=['category_id'])[['article_id', 'category_id']].to_dict(orient='records')
            self._execute_upsert('article_categories', category_link_records, 'category links')

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

    def log_pipeline_run(self, status: str, records_added: int = 0, error_message: str = None):
        """Logs a summary of the pipeline execution to the api_logs table."""
        log_entry = {
            "source": "daily_pipeline_run",
            "status": status,
            "records_added": records_added,
            "error_message": error_message
        }
        try:
            logger.info(f"Logging pipeline run to Supabase: status={status}")
            self.client.table('api_logs').insert(log_entry).execute()
        except Exception as e:
            logger.error(f"❌ Failed to log pipeline run to Supabase: {e}")