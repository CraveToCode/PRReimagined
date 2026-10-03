from dataclasses import dataclass, field
from typing import List

@dataclass
class ChecklistItem:
    id: str
    description: str
    xp_reward: int
    completed: bool = False

@dataclass
class ReviewLens:
    id: str
    name: str
    description: str
    items: List[ChecklistItem] = field(default_factory=list)

@dataclass
class ReviewedFile:
    path: str
    reviewed: bool = False

@dataclass
class ReviewSession:
    lenses: List[ReviewLens] = field(default_factory=list)
    files: List[ReviewedFile] = field(default_factory=list)
    total_xp: int = 0
