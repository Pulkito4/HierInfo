"""
Cron job scheduler for the news processing pipeline.
This can be used for deployment on platforms that support scheduled jobs.
"""
import schedule
import time
import logging
import os
import sys
from datetime import datetime

# Add app directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'app'))

from main import NewsProcessingPipeline
from utils.logging_config import setup_logging

# Set up logging
setup_logging(log_file="logs/scheduler.log")
logger = logging.getLogger(__name__)

class PipelineScheduler:
    """Handles scheduled execution of the news processing pipeline."""
    
    def __init__(self):
        self.pipeline = None
        self.last_run = None
        
    def run_scheduled_job(self):
        """Execute the pipeline as a scheduled job."""
        try:
            logger.info("=== Starting Scheduled Pipeline Run ===")
            start_time = datetime.now()
            
            # Create new pipeline instance for each run
            self.pipeline = NewsProcessingPipeline()
            
            # Run the pipeline
            result = self.pipeline.run_pipeline(
                fetch_limit=int(os.getenv('FETCH_LIMIT', 1000)),
                categories=None  # Use default categories
            )
            
            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()
            
            logger.info(f"Pipeline completed in {duration:.2f} seconds")
            logger.info(f"Status: {result['status']}")
            logger.info(f"Stats: {result['stats']}")
            
            self.last_run = end_time
            
        except Exception as e:
            logger.error(f"Scheduled pipeline run failed: {e}", exc_info=True)
    
    def start_scheduler(self):
        """Start the scheduler with configured intervals."""
        # Schedule daily run at 6 AM UTC
        schedule.every().day.at("06:00").do(self.run_scheduled_job)
        
        # Alternative: Schedule every N hours
        # hours_interval = int(os.getenv('RUN_INTERVAL_HOURS', 24))
        # schedule.every(hours_interval).hours.do(self.run_scheduled_job)
        
        logger.info("Pipeline scheduler started. Next run scheduled for 06:00 UTC daily.")
        
        # Run once immediately on startup (optional)
        if os.getenv('RUN_ON_STARTUP', 'true').lower() == 'true':
            logger.info("Running pipeline immediately on startup...")
            self.run_scheduled_job()
        
        # Keep the scheduler running
        while True:
            try:
                schedule.run_pending()
                time.sleep(60)  # Check every minute
            except KeyboardInterrupt:
                logger.info("Scheduler stopped by user")
                break
            except Exception as e:
                logger.error(f"Scheduler error: {e}")
                time.sleep(300)  # Wait 5 minutes before retrying


def main():
    """Main entry point for the scheduler."""
    scheduler = PipelineScheduler()
    scheduler.start_scheduler()


if __name__ == "__main__":
    main()