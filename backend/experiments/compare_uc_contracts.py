"""Compare live discovery with a trusted Git revision, without database writes.

Run from backend with PYTHONPATH=. and SENTRY_DSN=''. The baseline revision's
adapter is executed locally; only pass a revision whose code you trust.
"""
import argparse
import asyncio
from datetime import datetime, timezone
import json
import logging
from pathlib import Path
import subprocess
import sys
import time
from types import ModuleType

from background.sources import collective_bargaining as candidate
from db.models import Source


def compare(baseline: dict, current: dict) -> dict:
    old_docs, new_docs = baseline["documents"], current["documents"]
    old_urls = {doc["url"] for doc in old_docs}
    new_by_url = {doc["url"]: doc for doc in new_docs}
    new_urls = set(new_by_url)
    metadata_losses = set()
    title_changes = set()
    for doc in old_docs:
        new = new_by_url.get(doc["url"])
        if new is None:
            continue
        if doc["title"] != new["title"]:
            title_changes.add(doc["url"])
        for field in ("keywords", "subject_areas"):
            if not set(doc["metadata"][field]).issubset(new["metadata"][field]):
                metadata_losses.add(doc["url"])
        if not set(doc["metadata"]["responsible_office"].split("; ")).issubset(
            new["metadata"]["responsible_office"].split("; ")
        ):
            metadata_losses.add(doc["url"])
    return {
        "baseline_records": len(old_docs),
        "baseline_unique_urls": len(old_urls),
        "candidate_records": len(new_docs),
        "candidate_unique_urls": len(new_urls),
        "baseline_seconds": baseline["seconds"],
        "candidate_seconds": current["seconds"],
        "added_urls": sorted(new_urls - old_urls),
        "lost_urls": sorted(old_urls - new_urls),
        "metadata_losses": sorted(metadata_losses),
        "title_changes": sorted(title_changes),
        "coverage_preserved": bool(old_urls) and not (
            old_urls - new_urls or metadata_losses or title_changes
        ),
    }


class Errors(logging.Handler):
    """The old adapter swallows page errors; do not accept a partial baseline."""

    def __init__(self):
        super().__init__(logging.ERROR)
        self.messages = []

    def emit(self, record):
        self.messages.append(record.getMessage())


async def collect(module) -> dict:
    started = time.monotonic()
    source = Source(name="UC Contracts",
                    url=candidate.BARGAINING_UNITS_URL, type="UCCONTRACTS")
    documents = [
        {"url": doc.url, "title": doc.title, "metadata": doc.metadata}
        async for doc in module.UcnetCollectiveBargainingStream(source)
    ]
    return {"seconds": round(time.monotonic() - started, 2), "documents": documents}


async def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--baseline-ref", required=True,
                        help="Trusted Git revision containing the old adapter")
    parser.add_argument("--output", type=Path,
                        required=True, help="JSON evidence file")
    args = parser.parse_args()
    repo = Path(__file__).resolve().parents[2]
    revision = subprocess.check_output(
        ["git", "rev-parse", "--verify", f"{args.baseline_ref}^{{commit}}"], cwd=repo, text=True
    ).strip()
    source = subprocess.check_output([
        "git", "show", f"{revision}:backend/background/sources/collective_bargaining.py"
    ], cwd=repo, text=True)
    baseline_module = ModuleType("ucnet_baseline")
    sys.modules[baseline_module.__name__] = baseline_module
    exec(compile(source, f"{revision}:collective_bargaining.py",
         "exec"), baseline_module.__dict__)
    errors = Errors()
    baseline_module.logger.addHandler(errors)
    try:
        baseline = await collect(baseline_module)
    finally:
        baseline_module.logger.removeHandler(errors)
    if errors.messages:
        raise RuntimeError(
            f"Baseline had page errors; comparison is inconclusive: {errors.messages}")
    current = await collect(candidate)
    result = compare(baseline, current)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps({
        "checked_at": datetime.now(timezone.utc).isoformat(),
        "baseline_revision": revision,
        "comparison": result,
        "baseline": baseline,
        "candidate": current,
    }, indent=2) + "\n")
    print(json.dumps(result, indent=2))
    if not result["coverage_preserved"]:
        raise SystemExit(1)


if __name__ == "__main__":
    asyncio.run(main())
