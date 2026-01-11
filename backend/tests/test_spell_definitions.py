"""Tests for spell definitions module."""

from src.spells.definitions import (
    SPELL_DEFINITIONS,
    get_spell,
    is_restricted_spell,
    list_all_spells,
    list_safe_spells,
)


class TestSpellDefinitions:
    """Tests for SPELL_DEFINITIONS constant."""

    def test_has_seven_spells(self) -> None:
        """SPELL_DEFINITIONS contains exactly 7 spells."""
        assert len(SPELL_DEFINITIONS) == 7

    def test_has_revelio(self) -> None:
        """Contains Revelio spell."""
        assert "revelio" in SPELL_DEFINITIONS
        spell = SPELL_DEFINITIONS["revelio"]
        assert spell["name"] == "Revelio"
        assert spell["safety_level"] == "safe"
        assert spell["category"] == "detection"

    def test_has_homenum_revelio(self) -> None:
        """Contains Homenum Revelio spell."""
        assert "homenum_revelio" in SPELL_DEFINITIONS
        spell = SPELL_DEFINITIONS["homenum_revelio"]
        assert spell["name"] == "Homenum Revelio"
        assert spell["safety_level"] == "safe"
        assert spell["category"] == "detection"

    def test_has_specialis_revelio(self) -> None:
        """Contains Specialis Revelio spell."""
        assert "specialis_revelio" in SPELL_DEFINITIONS
        spell = SPELL_DEFINITIONS["specialis_revelio"]
        assert spell["name"] == "Specialis Revelio"
        assert spell["safety_level"] == "safe"
        assert spell["category"] == "analysis"

    def test_has_lumos(self) -> None:
        """Contains Lumos spell."""
        assert "lumos" in SPELL_DEFINITIONS
        spell = SPELL_DEFINITIONS["lumos"]
        assert spell["name"] == "Lumos"
        assert spell["safety_level"] == "safe"
        assert spell["category"] == "detection"

    def test_has_prior_incantato(self) -> None:
        """Contains Prior Incantato spell."""
        assert "prior_incantato" in SPELL_DEFINITIONS
        spell = SPELL_DEFINITIONS["prior_incantato"]
        assert spell["name"] == "Prior Incantato"
        assert spell["safety_level"] == "safe"
        assert spell["category"] == "analysis"

    def test_has_reparo(self) -> None:
        """Contains Reparo spell."""
        assert "reparo" in SPELL_DEFINITIONS
        spell = SPELL_DEFINITIONS["reparo"]
        assert spell["name"] == "Reparo"
        assert spell["safety_level"] == "safe"
        assert spell["category"] == "restoration"

    def test_has_legilimency(self) -> None:
        """Contains Legilimency spell (restricted)."""
        assert "legilimency" in SPELL_DEFINITIONS
        spell = SPELL_DEFINITIONS["legilimency"]
        assert spell["name"] == "Legilimency"
        assert spell["safety_level"] == "restricted"
        assert spell["category"] == "mental"

    def test_all_spells_have_required_fields(self) -> None:
        """All spells have required fields."""
        required_fields = ["name", "description", "safety_level", "category"]

        for spell_id, spell in SPELL_DEFINITIONS.items():
            for field in required_fields:
                assert field in spell, f"Spell {spell_id} missing field {field}"
                assert spell[field], f"Spell {spell_id} has empty {field}"

    def test_safety_levels_valid(self) -> None:
        """All spells have valid safety levels."""
        valid_levels = {"safe", "restricted"}

        for spell_id, spell in SPELL_DEFINITIONS.items():
            assert spell["safety_level"] in valid_levels, (
                f"Spell {spell_id} has invalid safety_level: {spell['safety_level']}"
            )

    def test_categories_valid(self) -> None:
        """All spells have valid categories."""
        valid_categories = {"detection", "analysis", "restoration", "mental"}

        for spell_id, spell in SPELL_DEFINITIONS.items():
            assert spell["category"] in valid_categories, (
                f"Spell {spell_id} has invalid category: {spell['category']}"
            )


class TestGetSpell:
    """Tests for get_spell function."""

    def test_get_existing_spell(self) -> None:
        """Get existing spell returns spell dict."""
        spell = get_spell("revelio")
        assert spell is not None
        assert spell["name"] == "Revelio"

    def test_get_nonexistent_spell(self) -> None:
        """Get nonexistent spell returns None."""
        spell = get_spell("expelliarmus")
        assert spell is None

    def test_case_insensitive(self) -> None:
        """Get spell is case insensitive."""
        spell_lower = get_spell("revelio")
        spell_upper = get_spell("REVELIO")
        spell_mixed = get_spell("ReVeLiO")

        assert spell_lower is not None
        assert spell_upper is not None
        assert spell_mixed is not None
        assert spell_lower["name"] == spell_upper["name"] == spell_mixed["name"]

    def test_get_restricted_spell(self) -> None:
        """Get restricted spell returns correct data."""
        spell = get_spell("legilimency")
        assert spell is not None
        assert spell["safety_level"] == "restricted"


class TestIsRestrictedSpell:
    """Tests for is_restricted_spell function."""

    def test_legilimency_is_restricted(self) -> None:
        """Legilimency is restricted."""
        assert is_restricted_spell("legilimency") is True

    def test_revelio_not_restricted(self) -> None:
        """Revelio is not restricted."""
        assert is_restricted_spell("revelio") is False

    def test_all_safe_spells_not_restricted(self) -> None:
        """All safe spells are not restricted."""
        safe_spells = [
            "revelio",
            "homenum_revelio",
            "specialis_revelio",
            "lumos",
            "prior_incantato",
            "reparo",
        ]

        for spell_id in safe_spells:
            assert is_restricted_spell(spell_id) is False, f"{spell_id} should not be restricted"

    def test_unknown_spell_not_restricted(self) -> None:
        """Unknown spell returns False (not restricted)."""
        assert is_restricted_spell("unknown_spell") is False


class TestListSpells:
    """Tests for list spell functions."""

    def test_list_safe_spells(self) -> None:
        """List safe spells returns 6 spells."""
        safe = list_safe_spells()
        assert len(safe) == 6
        assert "legilimency" not in safe
        assert "revelio" in safe

    def test_list_all_spells(self) -> None:
        """List all spells returns 7 spells."""
        all_spells = list_all_spells()
        assert len(all_spells) == 7
        assert "legilimency" in all_spells
        assert "revelio" in all_spells
