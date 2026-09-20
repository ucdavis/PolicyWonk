#!/usr/bin/env python3
"""Read-only deployment verification. Uses only the Python standard library."""

import argparse
from datetime import datetime, timezone
import json
import re
import subprocess
import time
import urllib.request


def get(url):
    with urllib.request.urlopen(url, timeout=10) as response:
        return response.read().decode()


def verify_web(url, revision):
    health = json.loads(get(f"{url.rstrip('/')}/api/health"))
    if health.get("status") != "healthy" or health.get("revision") != revision:
        raise ValueError("The expected revision is not healthy yet")
    login = get(f"{url.rstrip('/')}/auth/login")
    if "PolicyWonk" not in login:
        raise ValueError("The login page did not render")
    providers = json.loads(get(f"{url.rstrip('/')}/api/auth/providers"))
    if "boxyhq-saml" not in providers:
        raise ValueError("The SAML provider is unavailable")


def az(*args):
    result = subprocess.run(
        ["az", *args, "--only-show-errors"], capture_output=True, text=True,
        timeout=45, check=False,
    )
    if result.returncode:
        # Do not copy Azure errors or container logs, which can contain secrets.
        raise ValueError("Azure inspection failed")
    return result.stdout


def worker_ready(container, logs, image, revision, now):
    if container.get("image") != image:
        return False
    state = container.get("instanceView", {}).get("currentState", {})
    if state.get("state") != "Running" or not state.get("startTime"):
        return False
    started = datetime.fromisoformat(state["startTime"].replace("Z", "+00:00"))
    markers = list(re.finditer(
        r"POLICYWONK_READY revision=([0-9a-f]{40}) at=(\S+)", logs
    ))
    for marker in reversed(markers):
        marker_revision, timestamp = marker.groups()
        if marker_revision != revision:
            continue
        tail = logs[marker.end():]
        if any(message in tail for message in [
            "Traceback (most recent call last)", "Restarting process",
            "Starting PolicyWonk ingest process",
        ]):
            return False
        ready = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
        if ready >= started and 0 <= (now - ready).total_seconds() <= 300:
            return True
    return False


def verify_worker(resource_group, name, image, revision):
    containers = json.loads(az(
        "container", "show", "-g", resource_group, "-n", name,
        "--query", "containers[].{image:image,instanceView:instanceView}", "-o", "json",
    ))
    logs = az("container", "logs", "-g", resource_group, "-n", name)
    if len(containers) != 1 or not worker_ready(
        containers[0], logs, image, revision, datetime.now(timezone.utc)
    ):
        raise ValueError("The expected worker has not reported fresh dependency readiness")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("component", choices=["web", "worker"])
    parser.add_argument("--revision", required=True)
    parser.add_argument("--url")
    parser.add_argument("--resource-group")
    parser.add_argument("--name")
    parser.add_argument("--image")
    parser.add_argument("--timeout", type=int, default=600)
    args = parser.parse_args()
    if not re.fullmatch(r"[0-9a-f]{40}", args.revision):
        parser.error("--revision must be a full commit SHA")
    if args.component == "web" and not args.url:
        parser.error("web verification requires --url")
    if args.component == "worker" and not all(
        [args.resource_group, args.name, args.image]
    ):
        parser.error("worker verification requires --resource-group, --name and --image")

    deadline = time.monotonic() + args.timeout
    while True:
        try:
            if args.component == "web":
                verify_web(args.url, args.revision)
            else:
                verify_worker(args.resource_group, args.name, args.image, args.revision)
            print(f"Verified {args.component} revision {args.revision}")
            return
        except (ValueError, OSError, subprocess.TimeoutExpired):
            if time.monotonic() >= deadline:
                raise SystemExit(f"{args.component} verification timed out; deployment is not verified")
            print(f"Waiting for {args.component} readiness...", flush=True)
            time.sleep(10)


if __name__ == "__main__":
    main()
