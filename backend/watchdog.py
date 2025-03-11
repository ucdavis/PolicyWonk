"""
Indexer
"""

import asyncio

from background.logger import setup_logger

logger = setup_logger()

command = ["python", "-m", "background.update"]


async def main():
    # Just run the update script in a loop, restarting if it fails
    while True:
        try:
            logger.info("Starting PolicyWonk ingest process: %s",
                        ' '.join(command))
            process = await asyncio.create_subprocess_exec(*command)
            await process.wait()
        except Exception as e:
            logger.exception("Process failed with error: %s", e)

        logger.info("Restarting process in 5 seconds...")
        await asyncio.sleep(5)

if __name__ == "__main__":
    asyncio.run(main())
