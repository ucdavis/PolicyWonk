import re
import unittest
from sample import PATTERNS

class PrivacyFilterTests(unittest.TestCase):
    def flagged(self, text):
        return any(re.search(pattern, text, re.I) for pattern in PATTERNS.values())

    def test_direct_identifiers_are_filtered(self):
        for text in ['Contact someone@example.invalid about leave',
                     'Call (555) 123-4567 regarding overtime',
                     'My employee ID: ABC123 needs a correction',
                     'my name is Jane and I need leave',
                     'Send this to 123 Example Street please']:
            with self.subTest(text=text):
                self.assertTrue(self.flagged(text))

    def test_policy_numbers_and_general_questions_survive(self):
        for text in ['What does PPM 380-16 say about travel?',
                     'Can a supervisor approve a flexible schedule?']:
            self.assertFalse(self.flagged(text))

    def test_names_need_manual_review(self):
        # This intentionally documents why passing regex screening is NOT approval.
        self.assertFalse(self.flagged('Jane Example requested family leave.'))

if __name__ == '__main__':
    unittest.main()
