from datetime import datetime, timedelta, timezone
import json
from pathlib import Path
import sys
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import verify


class WebVerificationTests(unittest.TestCase):
    revision = "a" * 40

    def test_healthy_revision_and_login_provider(self):
        with patch.object(verify, "get", side_effect=[
            json.dumps({"status": "healthy", "revision": self.revision}),
            "<title>PolicyWonk | Login</title>",
            '{"boxyhq-saml": {}}',
        ]):
            verify.verify_web("https://example.test", self.revision)

    def test_old_revision_is_rejected_even_when_healthy(self):
        with patch.object(verify, "get", return_value=json.dumps({
            "status": "healthy", "revision": "b" * 40,
        })), self.assertRaises(ValueError):
            verify.verify_web("https://example.test", self.revision)

    def test_login_redirect_is_not_a_health_response(self):
        with patch.object(verify, "get", return_value="<html>Login</html>"), self.assertRaises(ValueError):
            verify.verify_web("https://example.test", self.revision)

    def test_missing_saml_provider_is_rejected(self):
        with patch.object(verify, "get", side_effect=[
            json.dumps({"status": "healthy", "revision": self.revision}),
            "PolicyWonk", "{}",
        ]), self.assertRaises(ValueError):
            verify.verify_web("https://example.test", self.revision)


class WorkerVerificationTests(unittest.TestCase):
    def setUp(self):
        self.now = datetime.now(timezone.utc)
        self.revision = "a" * 40
        self.image = f"registry.example/worker:{self.revision}"
        self.container = {
            "image": self.image,
            "instanceView": {"currentState": {
                "state": "Running", "startTime": (self.now - timedelta(minutes=2)).isoformat(),
            }},
        }

    def marker(self, time=None, revision=None):
        return f"POLICYWONK_READY revision={revision or self.revision} at={(time or self.now).isoformat()}"

    def ready(self, logs):
        return verify.worker_ready(self.container, logs, self.image, self.revision, self.now)

    def test_fresh_marker_from_current_instance(self):
        self.assertTrue(self.ready(self.marker()))

    def test_running_alone_is_not_readiness(self):
        self.assertFalse(self.ready("Starting Indexing Loop"))

    def test_a_crash_after_readiness_is_rejected(self):
        self.assertFalse(self.ready(self.marker() + "\nTraceback (most recent call last):"))
        self.assertFalse(self.ready(self.marker() + "\nRestarting process in 5 seconds..."))

    def test_old_instance_and_stale_markers_are_rejected(self):
        self.assertFalse(self.ready(self.marker(self.now - timedelta(minutes=3))))
        self.container["instanceView"]["currentState"]["startTime"] = (self.now - timedelta(hours=1)).isoformat()
        self.assertFalse(self.ready(self.marker(self.now - timedelta(minutes=6))))

    def test_wrong_revision_is_rejected(self):
        self.assertFalse(self.ready(self.marker(revision="b" * 40)))

    def test_wrong_image_is_rejected(self):
        self.container["image"] = "registry.example/worker:old"
        self.assertFalse(self.ready(self.marker()))

    def test_stopped_worker_is_rejected(self):
        self.container["instanceView"]["currentState"]["state"] = "Terminated"
        self.assertFalse(self.ready(self.marker()))


if __name__ == "__main__":
    unittest.main()
