import json
import os
from typing import List, Tuple
from .models import ReviewSession, ReviewLens, ChecklistItem, ReviewedFile

DEFAULT_SESSION_FILE = ".review_session.json"

class ReviewService:
    def __init__(self, filepath: str = DEFAULT_SESSION_FILE):
        self.filepath = filepath

    def create_default_session(self) -> ReviewSession:
        lenses = [
            ReviewLens(
                id="lens1",
                name="Spec & Core Architecture",
                description="JIRA acceptance criteria mapped directly to key architectural diffs",
                items=[
                    ChecklistItem("l1_item1", "Verify JIRA acceptance criteria mapped to key architectural diffs", 50),
                    ChecklistItem("l1_item2", "Check core data structures and design patterns", 50)
                ]
            ),
            ReviewLens(
                id="lens2",
                name="Blast Radius & Contracts",
                description="Deep-dive into call sites and cross-dependencies",
                items=[
                    ChecklistItem("l2_item1", "Audit call sites and cross-dependencies", 75),
                    ChecklistItem("l2_item2", "Verify API contracts and backward compatibility", 75)
                ]
            ),
            ReviewLens(
                id="lens3",
                name="Verification & Test Coverage",
                description="Audit assertions, test cases, and edge-case handling",
                items=[
                    ChecklistItem("l3_item1", "Audit assertions and edge-case handling", 100),
                    ChecklistItem("l3_item2", "Verify unit/integration test coverage", 100)
                ]
            )
        ]
        files = [
            ReviewedFile("src/core/base.py", False),
            ReviewedFile("src/main.py", False),
            ReviewedFile("README.md", False)
        ]
        return ReviewSession(lenses=lenses, files=files, total_xp=0)

    def load_session(self) -> ReviewSession:
        if not os.path.exists(self.filepath):
            session = self.create_default_session()
            self.save_session(session)
            return session
        
        with open(self.filepath, "r") as f:
            data = json.load(f)
        
        lenses = []
        for l_data in data.get("lenses", []):
            items = [ChecklistItem(**i) for i in l_data.get("items", [])]
            lenses.append(ReviewLens(id=l_data["id"], name=l_data["name"], description=l_data["description"], items=items))
        
        files = [ReviewedFile(**f) for f in data.get("files", [])]
        total_xp = data.get("total_xp", 0)
        return ReviewSession(lenses=lenses, files=files, total_xp=total_xp)

    def save_session(self, session: ReviewSession) -> None:
        data = {
            "lenses": [
                {
                    "id": l.id,
                    "name": l.name,
                    "description": l.description,
                    "items": [{"id": i.id, "description": i.description, "xp_reward": i.xp_reward, "completed": i.completed} for i in l.items]
                }
                for l in session.lenses
            ],
            "files": [{"path": f.path, "reviewed": f.reviewed} for f in session.files],
            "total_xp": session.total_xp
        }
        with open(self.filepath, "w") as f:
            json.dump(data, f, indent=2)

    def toggle_item(self, item_id: str) -> Tuple[bool, int]:
        session = self.load_session()
        found = False
        xp_diff = 0
        new_state = False
        for lens in session.lenses:
            for item in lens.items:
                if item.id == item_id:
                    item.completed = not item.completed
                    new_state = item.completed
                    xp_diff = item.xp_reward if item.completed else -item.xp_reward
                    found = True
                    break
            if found:
                break
        
        if found:
            session.total_xp += xp_diff
            self.save_session(session)
            return new_state, xp_diff
        raise ValueError(f"Item with ID '{item_id}' not found.")

    def toggle_file(self, file_path: str) -> bool:
        session = self.load_session()
        found = False
        new_state = False
        for f in session.files:
            if f.path == file_path:
                f.reviewed = not f.reviewed
                new_state = f.reviewed
                found = True
                break
        if found:
            self.save_session(session)
            return new_state
        raise ValueError(f"File with path '{file_path}' not found.")

    def reset_session(self) -> ReviewSession:
        session = self.create_default_session()
        self.save_session(session)
        return session
