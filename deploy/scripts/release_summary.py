#!/usr/bin/env python3
"""Publish explicit stage outcomes; skipped production is not a release success."""

import os
from pathlib import Path
import sys


def main():
    stages = [
        ("Build and checks", os.environ["BUILD_RESULT"]),
        ("Test deployment and verification", os.environ["TEST_RESULT"]),
        ("Test acceptance", os.environ["ACCEPTANCE_RESULT"]),
        ("Production deployment and verification", os.environ["PROD_RESULT"]),
    ]
    succeeded = all(result == "Succeeded" for _, result in stages)
    title = "Production deployed and verified" if succeeded else "Production release incomplete"
    summary = Path(os.environ["AGENT_TEMPDIRECTORY"]) / "release-summary.md"
    summary.write_text(
        f"# {title}\n\n"
        f"Commit: `{os.environ['BUILD_SOURCEVERSION']}`\n\n"
        f"Image: `{os.environ['RELEASE_IMAGE']}`\n\n"
        "| Stage | Result |\n| --- | --- |\n"
        + "".join(f"| {stage} | {result} |\n" for stage, result in stages)
        + "\nCheck the stage timeline for approval, failure, and verification details.\n"
    )
    print(f"##vso[task.uploadsummary]{summary}", flush=True)
    if not succeeded:
        print("##vso[task.logissue type=error]Production release did not complete every required stage.")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
