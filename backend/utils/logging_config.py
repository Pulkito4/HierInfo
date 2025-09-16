"""Logging configuration for the pipeline."""
import logging
import sys
from datetime import datetime
import os
from typing import Optional

def setup_logging(
    log_file: Optional[str] = None,
    log_level: str = "INFO",
    include_console: bool = True
) -> logging.Logger:
    """
    Set up centralized logging configuration.
    
    Args:
        log_file: Path to log file (defaults to pipeline_YYYYMMDD.log)
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR)
        include_console: Whether to include console output
        
    Returns:
        Configured logger
    """
    # Create logs directory if it doesn't exist
    log_dir = "logs"
    os.makedirs(log_dir, exist_ok=True)
    
    # Default log file with timestamp
    if log_file is None:
        timestamp = datetime.now().strftime("%Y%m%d")
        log_file = os.path.join(log_dir, f"pipeline_{timestamp}.log")
    
    # Configure logging
    log_format = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    
    # Remove existing handlers to avoid duplicates
    root_logger = logging.getLogger()
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    
    # Set up handlers
    handlers = []
    
    # File handler
    file_handler = logging.FileHandler(log_file, mode='a', encoding='utf-8')
    file_handler.setFormatter(logging.Formatter(log_format))
    handlers.append(file_handler)
    
    # Console handler
    if include_console:
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(logging.Formatter(log_format))
        handlers.append(console_handler)
    
    # Configure root logger
    logging.basicConfig(
        level=getattr(logging, log_level.upper()),
        format=log_format,
        handlers=handlers,
        force=True
    )
    
    logger = logging.getLogger(__name__)
    logger.info(f"Logging configured. Log file: {log_file}")
    
    return logging.getLogger()

def get_logger(name: str) -> logging.Logger:
    """Get a logger with the specified name."""
    return logging.getLogger(name)

class PipelineLogger:
    """Enhanced logger for pipeline operations with structured logging."""
    
    def __init__(self, name: str, pipeline_id: Optional[str] = None):
        self.logger = logging.getLogger(name)
        self.pipeline_id = pipeline_id or datetime.now().strftime("%Y%m%d_%H%M%S")
        
    def _log_with_context(self, level: str, message: str, **kwargs):
        """Log with pipeline context."""
        context = f"[Pipeline: {self.pipeline_id}]"
        if kwargs:
            context += f" {kwargs}"
        
        full_message = f"{context} {message}"
        getattr(self.logger, level.lower())(full_message)
    
    def info(self, message: str, **kwargs):
        """Log info message with context."""
        self._log_with_context("INFO", message, **kwargs)
    
    def warning(self, message: str, **kwargs):
        """Log warning message with context."""
        self._log_with_context("WARNING", message, **kwargs)
    
    def error(self, message: str, **kwargs):
        """Log error message with context."""
        self._log_with_context("ERROR", message, **kwargs)
    
    def debug(self, message: str, **kwargs):
        """Log debug message with context."""
        self._log_with_context("DEBUG", message, **kwargs)
    
    def step(self, step_name: str, status: str = "started", **kwargs):
        """Log pipeline step with structured format."""
        self.info(f"STEP: {step_name} - {status.upper()}", **kwargs)