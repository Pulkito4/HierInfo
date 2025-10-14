"""
Logging Configuration for News Pipeline

Provides standardized logging configuration for production deployment.
Creates both console and file logging with proper formatting.
"""

import logging
import os
from datetime import datetime
from typing import Optional


def setup_logging(
    log_level: str = "INFO", log_file: Optional[str] = None, console_output: bool = True
) -> logging.Logger:
    """
    Set up standardized logging for the news pipeline.

    Args:
        log_level (str): Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_file (str, optional): Path to log file. If None, creates daily log file
        console_output (bool): Whether to output logs to console

    Returns:
        logging.Logger: Configured logger instance
    """

    # Create logger
    logger = logging.getLogger("news_pipeline")

    # If already configured, return existing logger as-is to avoid duplicate setup
    if logger.handlers:
        return logger

    logger.setLevel(getattr(logging, log_level.upper()))

    # Create formatter
    formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s"
    )

    # Console handler
    if console_output:
        console_handler = logging.StreamHandler()
        console_handler.setLevel(getattr(logging, log_level.upper()))
        console_handler.setFormatter(formatter)
        logger.addHandler(console_handler)

    # File handler
    if log_file is None:
        log_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "logs")
        os.makedirs(log_dir, exist_ok=True)
        # Include timestamp for unique filenames across runs
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        log_file = os.path.join(log_dir, f"pipeline_{timestamp}.log")

    if log_file:
        file_handler = logging.FileHandler(log_file, encoding="utf-8")
        file_handler.setLevel(getattr(logging, log_level.upper()))
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)

    logger.info(f"🔧 Logging configured - Level: {log_level}, File: {log_file}")
    return logger


def get_logger(name: str = "news_pipeline") -> logging.Logger:
    """
    Get the configured logger instance.

    Args:
        name (str): Logger name

    Returns:
        logging.Logger: Child logger under the 'news_pipeline' parent so all handlers apply uniformly
    """
    # Ensure all module loggers propagate to the single configured parent
    parent = logging.getLogger("news_pipeline")
    return parent.getChild(name)


# Default logger setup for imports
logger = setup_logging()
