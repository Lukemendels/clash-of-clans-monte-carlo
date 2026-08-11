import importlib.util
import unittest
from pathlib import Path

MODULE_PATH = Path(__file__).resolve().parents[1] / "server.py"
SPEC = importlib.util.spec_from_file_location("evidence_lab_server", MODULE_PATH)
server = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(server)


class EvidenceLabServerTests(unittest.TestCase):
    def test_parse_ratio(self):
        self.assertEqual(server.parse_ratio("60/1"), 60.0)
        self.assertAlmostEqual(server.parse_ratio("60000/1001"), 59.94005994)
        self.assertIsNone(server.parse_ratio("0/0"))
        self.assertIsNone(server.parse_ratio("N/A"))

    def test_safe_upload_name_strips_paths_and_unsafe_characters(self):
        self.assertEqual(server.safe_upload_name("../../Wizard Cannon.mp4"), "Wizard Cannon.mp4")
        self.assertEqual(server.safe_upload_name("clip%20name%3F.mp4"), "clip name_.mp4")

    def test_numeric_or_none_does_not_invent_values(self):
        self.assertEqual(server.numeric_or_none("1.25"), 1.25)
        self.assertIsNone(server.numeric_or_none("N/A"))
        self.assertIsNone(server.numeric_or_none(None))


if __name__ == "__main__":
    unittest.main()
