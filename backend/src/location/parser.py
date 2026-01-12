"""Natural language location command parser.

Phase 5.2: Detect "go to X", "visit X", "head to X" commands in player input.
"""

import re
from difflib import SequenceMatcher


class LocationCommandParser:
    """Parse natural language location change commands.

    Detects patterns like:
    - "go to dormitory"
    - "visit the library"
    - "head to great hall"
    - "travel to the dormitory"

    Uses fuzzy matching for typo tolerance (e.g., "dormitry" -> "dormitory").
    """

    # Command patterns (case-insensitive)
    COMMAND_PATTERNS = [
        r"\b(go|visit|head|travel|walk|move)\s+(?:to\s+)?(?:the\s+)?(\w+(?:\s+\w+)?)",
    ]

    def __init__(self, locations: list[str], fuzzy_threshold: float = 0.75):
        """Initialize parser with known locations.

        Args:
            locations: List of valid location IDs (e.g., ["library", "dormitory", "great_hall"])
            fuzzy_threshold: Minimum similarity ratio for fuzzy matching (0.0-1.0)
        """
        self.locations = locations
        self.fuzzy_threshold = fuzzy_threshold

        # Build lookup dict for both ID and display-friendly versions
        # e.g., "great_hall" -> "great_hall", "great hall" -> "great_hall"
        self._location_lookup: dict[str, str] = {}
        for loc in locations:
            self._location_lookup[loc.lower()] = loc
            # Also map underscore-free version
            self._location_lookup[loc.lower().replace("_", " ")] = loc

    def parse(self, input_text: str) -> str | None:
        """Detect location change command in input.

        Args:
            input_text: Player's natural language input

        Returns:
            Location ID if detected, None otherwise
        """
        if not input_text:
            return None

        lower_input = input_text.lower().strip()

        # Pattern 1: Explicit command ("go to X", "visit X", etc.)
        for pattern in self.COMMAND_PATTERNS:
            match = re.search(pattern, lower_input, re.IGNORECASE)
            if match:
                target = match.group(2).strip()
                location = self._fuzzy_match(target)
                if location:
                    return location

        # Pattern 2: Direct location name in input (fallback)
        for loc_key, loc_id in self._location_lookup.items():
            if loc_key in lower_input:
                # Check if it's in a command context (not just mentioned)
                if self._is_command_context(lower_input, loc_key):
                    return loc_id

        return None

    def _fuzzy_match(self, target: str) -> str | None:
        """Fuzzy match target against known locations.

        Args:
            target: Location name to match (e.g., "dormitry", "great hall")

        Returns:
            Matched location ID or None
        """
        target_lower = target.lower().strip()

        # Exact match first
        if target_lower in self._location_lookup:
            return self._location_lookup[target_lower]

        # Fuzzy match
        best_match: str | None = None
        best_ratio = 0.0

        for loc_key, loc_id in self._location_lookup.items():
            ratio = SequenceMatcher(None, target_lower, loc_key).ratio()
            if ratio > best_ratio and ratio >= self.fuzzy_threshold:
                best_ratio = ratio
                best_match = loc_id

        return best_match

    def _is_command_context(self, input_text: str, location: str) -> bool:
        """Check if location mention is in a command context.

        Prevents false positives like "I found evidence in the library"
        from being interpreted as "go to library".

        Args:
            input_text: Full input text
            location: Location name found

        Returns:
            True if likely a navigation command
        """
        # Command keywords that suggest navigation intent
        command_keywords = [
            "go",
            "visit",
            "head",
            "travel",
            "walk",
            "move",
            "leave",
            "return",
            "back",
            "to",
        ]

        # Check if any command keyword appears before the location
        loc_index = input_text.find(location)
        if loc_index > 0:
            before = input_text[:loc_index].lower()
            for keyword in command_keywords:
                if keyword in before:
                    return True

        return False
