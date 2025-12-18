#!/usr/bin/env python3

"""
Quick Playwright smoke test.

Launches Google Chrome (via Playwright), navigates to a URL, and prints a bit of
page text to confirm everything is working.
"""

from __future__ import annotations

import argparse
import sys

from playwright.sync_api import Error, sync_playwright


DEFAULT_URL = "https://example.com"


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Playwright smoke test (Chrome).")
    parser.add_argument("--url", default=DEFAULT_URL, help=f"URL to visit (default: {DEFAULT_URL})")
    parser.add_argument(
        "--channel",
        default="chrome",
        help='Browser channel to use (default: "chrome"). Set to "" to use bundled Playwright Chromium.',
    )
    parser.add_argument("--headless", action="store_true", help="Run headless (default: false).")
    parser.add_argument(
        "--wait-ms",
        type=int,
        default=5000,
        help="Milliseconds to keep the browser open before closing (default: 5000).",
    )
    return parser.parse_args()


def main() -> int:
    args = _parse_args()
    channel = (args.channel or "").strip() or None

    with sync_playwright() as p:
        launch_kwargs: dict[str, object] = {"headless": bool(args.headless)}
        if channel is not None:
            launch_kwargs["channel"] = channel

        try:
            browser = p.chromium.launch(**launch_kwargs)
        except Error as e:
            if channel is None:
                raise
            print(
                f'Failed to launch Chromium with channel="{channel}". Falling back to bundled Playwright Chromium.',
                file=sys.stderr,
            )
            print(f"Underlying error: {e}", file=sys.stderr)
            launch_kwargs.pop("channel", None)
            browser = p.chromium.launch(**launch_kwargs)

        page = browser.new_page()
        page.goto(args.url, wait_until="domcontentloaded")

        title = page.title()
        try:
            h1_text = page.locator("h1").first.inner_text(timeout=2000).strip()
        except Error:
            h1_text = ""

        print(f"URL: {page.url}")
        print(f"Title: {title}")
        print(f"H1: {h1_text or '<not found>'}")

        if int(args.wait_ms) > 0:
            page.wait_for_timeout(int(args.wait_ms))

        browser.close()

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

