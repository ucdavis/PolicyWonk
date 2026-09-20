import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest


class ReleaseSummaryTests(unittest.TestCase):
    def run_summary(self, production):
        with tempfile.TemporaryDirectory() as directory:
            result = subprocess.run([
                sys.executable, str(Path(__file__).resolve().parents[1] / "scripts/release_summary.py"),
            ], env={**os.environ,
                "AGENT_TEMPDIRECTORY": directory,
                "BUILD_SOURCEVERSION": "a" * 40,
                "RELEASE_IMAGE": "registry.example/web:revision",
                "BUILD_RESULT": "Succeeded", "TEST_RESULT": "Succeeded",
                "ACCEPTANCE_RESULT": "Succeeded", "PROD_RESULT": production,
            }, capture_output=True, text=True)
            return result, (Path(directory) / "release-summary.md").read_text()

    def test_skipped_production_is_not_a_successful_release(self):
        result, summary = self.run_summary("Skipped")
        self.assertEqual(result.returncode, 1)
        self.assertIn("Production release incomplete", summary)
        self.assertIn("Skipped", summary)

    def test_verified_production_is_successful(self):
        result, summary = self.run_summary("Succeeded")
        self.assertEqual(result.returncode, 0)
        self.assertIn("Production deployed and verified", summary)


if __name__ == "__main__":
    unittest.main()
