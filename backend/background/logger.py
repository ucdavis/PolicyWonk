"""
Logging and monitoring utilities for the background process.
"""

import logging
import os
import resource
import sentry_sdk

from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Sentry will integrate with logger by default, but only warnings and above. this is a good default
sentry_sdk.init(
    dsn=os.getenv('SENTRY_DSN'),  # Load DSN from environment variable
    traces_sample_rate=1.0,
    profiles_sample_rate=1.0,
    # Optionally set the environment
    environment=os.getenv('ENVIRONMENT', 'development')
)


def get_log_level_from_str(log_level_str: str = "INFO") -> int:
    """Translate strings to log level."""
    log_level_dict = {
        "CRITICAL": logging.CRITICAL,
        "ERROR": logging.ERROR,
        "WARNING": logging.WARNING,
        "INFO": logging.INFO,
        "DEBUG": logging.DEBUG,
        "NOTSET": logging.NOTSET,
    }

    return log_level_dict.get(log_level_str.upper(), logging.INFO)


def setup_logger(
    name: str = __name__,
    log_level: int = get_log_level_from_str(),
    logfile_name: str | None = None,
) -> logging.LoggerAdapter:
    """Setup a logger with the given name and log level."""

    logger = logging.getLogger(name)

    # If the logger already has handlers, assume it was already configured and return it.
    if logger.handlers:
        return logger

    logger.setLevel(log_level)

    formatter = logging.Formatter(
        "%(asctime)s %(filename)20s%(lineno)4s : %(message)s",
        datefmt="%m/%d/%Y %I:%M:%S %p",
    )

    handler = logging.StreamHandler()
    handler.setLevel(log_level)
    handler.setFormatter(formatter)

    logger.addHandler(handler)

    if logfile_name:
        is_containerized = os.path.exists("/.dockerenv")
        file_name_template = (
            "/var/log/{name}.log" if is_containerized else "./log/{name}.log"
        )
        file_handler = logging.FileHandler(
            file_name_template.format(name=logfile_name))
        logger.addHandler(file_handler)

    return logger


def log_memory_usage(logger: logging.Logger):
    """Log the memory usage of the current process."""
    memory_usage = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
    logger.info(f"Memory Usage: {memory_usage} KB")
