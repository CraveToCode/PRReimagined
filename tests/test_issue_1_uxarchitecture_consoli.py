import os
import tempfile
import unittest
from src.features.issue_1_uxarchitecture_consoli.service import ReviewService

class TestReviewLenses(unittest.TestCase):
    def setUp(self):
        self.temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".json")
        self.temp_file.close()
        self.service = ReviewService(filepath=self.temp_file.name)

    def tearDown(self):
        if os.path.exists(self.temp_file.name):
            os.remove(self.temp_file.name)

    def test_default_session_creation(self):
        session = self.service.load_session()
        self.assertEqual(len(session.lenses), 3)
        self.assertEqual(session.total_xp, 0)
        self.assertEqual(session.lenses[0].id, "lens1")
        self.assertEqual(session.lenses[0].name, "Spec & Core Architecture")
        self.assertEqual(len(session.files), 3)

    def test_toggle_item_xp_calculation(self):
        self.service.load_session()
        
        # Toggle item 1 of lens 1 (50 XP)
        new_state, xp_diff = self.service.toggle_item("l1_item1")
        self.assertTrue(new_state)
        self.assertEqual(xp_diff, 50)
        
        session = self.service.load_session()
        self.assertEqual(session.total_xp, 50)
        self.assertTrue(session.lenses[0].items[0].completed)

        # Toggle it off
        new_state, xp_diff = self.service.toggle_item("l1_item1")
        self.assertFalse(new_state)
        self.assertEqual(xp_diff, -50)
        
        session = self.service.load_session()
        self.assertEqual(session.total_xp, 0)
        self.assertFalse(session.lenses[0].items[0].completed)

    def test_toggle_file_status(self):
        self.service.load_session()
        
        # Toggle file
        new_state = self.service.toggle_file("src/main.py")
        self.assertTrue(new_state)
        
        session = self.service.load_session()
        self.assertTrue(session.files[1].reviewed)

        # Toggle file back
        new_state = self.service.toggle_file("src/main.py")
        self.assertFalse(new_state)
        
        session = self.service.load_session()
        self.assertFalse(session.files[1].reviewed)

    def test_invalid_item_or_file(self):
        self.service.load_session()
        with self.assertRaises(ValueError):
            self.service.toggle_item("non_existent_item")
        with self.assertRaises(ValueError):
            self.service.toggle_file("non_existent_file.py")

if __name__ == "__main__":
    unittest.main()
