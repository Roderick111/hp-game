"""Tests for spell LLM context builder."""

import pytest

from src.context.spell_llm import (
    _build_legilimency_section,
    _build_unknown_spell_prompt,
    _get_occlumency_risk_guidance,
    _normalize_spell_name,
    build_spell_effect_prompt,
    build_spell_system_prompt,
    is_spell_input,
    parse_spell_from_input,
)


class TestBuildSpellSystemPrompt:
    """Tests for build_spell_system_prompt function."""

    def test_has_narrator_role(self) -> None:
        """System prompt defines spell narrator role."""
        prompt = build_spell_system_prompt()
        assert "narrator" in prompt.lower()
        assert "spell effects" in prompt.lower()

    def test_has_evidence_rules(self) -> None:
        """System prompt includes evidence rules."""
        prompt = build_spell_system_prompt()
        assert "[EVIDENCE: id]" in prompt
        assert "Never invent evidence" in prompt

    def test_has_legilimency_warning(self) -> None:
        """System prompt mentions Legilimency warnings."""
        prompt = build_spell_system_prompt()
        assert "Legilimency" in prompt
        assert "warning" in prompt.lower()


class TestBuildSpellEffectPrompt:
    """Tests for build_spell_effect_prompt function."""

    @pytest.fixture
    def location_context(self) -> dict:
        """Sample location context."""
        return {
            "description": "The dusty library stretches before you.",
            "spell_contexts": {
                "special_interactions": {
                    "revelio": {
                        "targets": ["desk", "shelves", "window"],
                        "reveals_evidence": ["hidden_note"],
                    },
                    "prior_incantato": {
                        "targets": ["wand", "victim_wand"],
                        "reveals_evidence": ["wand_signature"],
                    },
                },
            },
        }

    def test_includes_spell_name(self, location_context: dict) -> None:
        """Prompt includes spell name."""
        prompt = build_spell_effect_prompt(
            spell_name="revelio",
            target="desk",
            location_context=location_context,
        )

        assert "Revelio" in prompt
        assert "SPELL CAST" in prompt

    def test_includes_target(self, location_context: dict) -> None:
        """Prompt includes target."""
        prompt = build_spell_effect_prompt(
            spell_name="revelio",
            target="desk",
            location_context=location_context,
        )

        assert "desk" in prompt.lower()

    def test_includes_location_description(self, location_context: dict) -> None:
        """Prompt includes location description."""
        prompt = build_spell_effect_prompt(
            spell_name="revelio",
            target="desk",
            location_context=location_context,
        )

        assert "dusty library" in prompt.lower()

    def test_includes_valid_targets(self, location_context: dict) -> None:
        """Prompt includes valid targets for spell."""
        prompt = build_spell_effect_prompt(
            spell_name="revelio",
            target="desk",
            location_context=location_context,
        )

        assert "VALID TARGETS" in prompt
        assert "desk" in prompt
        assert "shelves" in prompt

    def test_includes_revealable_evidence(self, location_context: dict) -> None:
        """Prompt includes evidence that can be revealed."""
        prompt = build_spell_effect_prompt(
            spell_name="revelio",
            target="desk",
            location_context=location_context,
            player_context={"discovered_evidence": []},
        )

        assert "hidden_note" in prompt

    def test_excludes_discovered_evidence(self, location_context: dict) -> None:
        """Prompt excludes already discovered evidence."""
        prompt = build_spell_effect_prompt(
            spell_name="revelio",
            target="desk",
            location_context=location_context,
            player_context={"discovered_evidence": ["hidden_note"]},
        )

        assert "No new evidence" in prompt or "hidden_note" not in prompt.split("Can reveal:")[0]

    def test_unknown_spell_handled(self) -> None:
        """Unknown spell returns appropriate prompt."""
        prompt = build_spell_effect_prompt(
            spell_name="expelliarmus",
            target=None,
            location_context={},
        )

        assert "not recognized" in prompt.lower() or "unknown" in prompt.lower()

    def test_no_target_handled(self, location_context: dict) -> None:
        """No target handled gracefully."""
        prompt = build_spell_effect_prompt(
            spell_name="revelio",
            target=None,
            location_context=location_context,
        )

        assert "general area" in prompt.lower()


class TestBuildLegilimencySection:
    """Tests for Legilimency-specific prompt building."""

    def test_includes_occlumency_skill(self) -> None:
        """Legilimency section includes occlumency skill."""
        witness_context = {
            "name": "Draco Malfoy",
            "occlumency_skill": "strong",
        }

        section = _build_legilimency_section(witness_context, "draco")

        assert "strong" in section.lower()
        assert "Draco Malfoy" in section

    def test_includes_warning_instruction(self) -> None:
        """Legilimency section includes warning instruction."""
        witness_context = {
            "name": "Hermione",
            "occlumency_skill": "weak",
        }

        section = _build_legilimency_section(witness_context, "hermione")

        assert "NATURAL WARNING" in section
        assert "Are you certain?" in section

    def test_includes_outcome_options(self) -> None:
        """Legilimency section includes outcome options."""
        witness_context = {
            "name": "Test",
            "occlumency_skill": "average",
        }

        section = _build_legilimency_section(witness_context, "test")

        assert "SUCCESS UNDETECTED" in section
        assert "SUCCESS DETECTED" in section
        assert "FAILURE BACKLASH" in section
        assert "FAILURE FLEE" in section

    def test_includes_flag_instructions(self) -> None:
        """Legilimency section includes flag instructions."""
        witness_context = {
            "name": "Test",
            "occlumency_skill": "average",
        }

        section = _build_legilimency_section(witness_context, "test")

        assert "[FLAG: relationship_damaged]" in section
        assert "[FLAG: mental_strain]" in section

    def test_no_witness_context(self) -> None:
        """No witness context returns error message."""
        section = _build_legilimency_section(None, "unknown")

        assert "No valid target" in section


class TestGetOcclumencyRiskGuidance:
    """Tests for occlumency risk guidance."""

    def test_none_occlumency(self) -> None:
        """No occlumency training (most common)."""
        guidance = _get_occlumency_risk_guidance("none")

        assert "NO Occlumency training" in guidance
        assert "most wizards" in guidance
        assert "Success almost certain" in guidance
        assert "ETHICAL" in guidance

    def test_weak_occlumency(self) -> None:
        """Weak occlumency guidance."""
        guidance = _get_occlumency_risk_guidance("weak")

        assert "WEAK" in guidance
        assert "High chance of success" in guidance
        assert "Low risk of backlash" in guidance

    def test_average_occlumency(self) -> None:
        """Average occlumency guidance."""
        guidance = _get_occlumency_risk_guidance("average")

        assert "AVERAGE" in guidance
        assert "Moderate chance" in guidance

    def test_strong_occlumency(self) -> None:
        """Strong occlumency guidance."""
        guidance = _get_occlumency_risk_guidance("strong")

        assert "STRONG" in guidance
        assert "High risk" in guidance
        assert "SLAM back" in guidance
        assert "AGAINST attempting" in guidance

    def test_unknown_defaults_to_none(self) -> None:
        """Unknown skill defaults to none (most common)."""
        guidance = _get_occlumency_risk_guidance("unknown")

        assert "NO Occlumency training" in guidance
        assert "most wizards" in guidance


class TestParseSpellFromInput:
    """Tests for parse_spell_from_input function."""

    def test_cast_spell_simple(self) -> None:
        """Parse 'cast revelio'."""
        spell_id, target = parse_spell_from_input("cast revelio")

        assert spell_id == "revelio"
        assert target is None

    def test_cast_spell_with_target(self) -> None:
        """Parse 'cast revelio on desk'."""
        spell_id, target = parse_spell_from_input("cast revelio on desk")

        assert spell_id == "revelio"
        assert target == "desk"

    def test_casting_spell_simple(self) -> None:
        """Parse "I'm casting Lumos"."""
        spell_id, target = parse_spell_from_input("I'm casting Lumos")

        assert spell_id == "lumos"
        assert target is None

    def test_casting_spell_with_target(self) -> None:
        """Parse "I'm casting Prior Incantato on the wand"."""
        spell_id, target = parse_spell_from_input("I'm casting Prior Incantato on the wand")

        assert spell_id == "prior_incantato"
        assert target == "the wand"

    def test_spell_name_with_target(self) -> None:
        """Parse 'revelio on shelves'."""
        spell_id, target = parse_spell_from_input("revelio on shelves")

        assert spell_id == "revelio"
        assert target == "shelves"

    def test_just_spell_name(self) -> None:
        """Parse just spell name."""
        spell_id, target = parse_spell_from_input("lumos")

        assert spell_id == "lumos"
        assert target is None

    def test_unknown_spell(self) -> None:
        """Unknown spell returns None."""
        spell_id, target = parse_spell_from_input("cast expelliarmus")

        assert spell_id is None
        assert target is None

    def test_no_spell(self) -> None:
        """No spell in input returns None."""
        spell_id, target = parse_spell_from_input("examine the desk")

        assert spell_id is None
        assert target is None

    def test_case_insensitive(self) -> None:
        """Spell parsing is case insensitive."""
        spell_id1, _ = parse_spell_from_input("cast REVELIO")
        spell_id2, _ = parse_spell_from_input("cast Revelio")
        spell_id3, _ = parse_spell_from_input("cast revelio")

        assert spell_id1 == spell_id2 == spell_id3 == "revelio"

    def test_multi_word_spell(self) -> None:
        """Parse multi-word spell name."""
        spell_id, target = parse_spell_from_input("cast prior incantato on wand")

        assert spell_id == "prior_incantato"
        assert target == "wand"

    def test_legilimency(self) -> None:
        """Parse legilimency spell."""
        spell_id, target = parse_spell_from_input("cast legilimency on hermione")

        assert spell_id == "legilimency"
        assert target == "hermione"


class TestNormalizeSpellName:
    """Tests for _normalize_spell_name function."""

    def test_direct_match(self) -> None:
        """Direct spell ID match."""
        assert _normalize_spell_name("revelio") == "revelio"

    def test_match_by_name(self) -> None:
        """Match by display name."""
        assert _normalize_spell_name("Revelio") == "revelio"

    def test_multi_word_with_space(self) -> None:
        """Multi-word spell with space."""
        assert _normalize_spell_name("prior incantato") == "prior_incantato"

    def test_partial_match(self) -> None:
        """Partial name match."""
        assert _normalize_spell_name("prior") == "prior_incantato"

    def test_unknown_returns_none(self) -> None:
        """Unknown spell returns None."""
        assert _normalize_spell_name("expelliarmus") is None


class TestIsSpellInput:
    """Tests for is_spell_input function."""

    def test_cast_spell_is_spell(self) -> None:
        """'cast revelio' is spell input."""
        assert is_spell_input("cast revelio") is True

    def test_casting_is_spell(self) -> None:
        """'I'm casting Lumos' is spell input."""
        assert is_spell_input("I'm casting Lumos") is True

    def test_examine_not_spell(self) -> None:
        """'examine desk' is not spell input."""
        assert is_spell_input("examine the desk") is False

    def test_look_around_not_spell(self) -> None:
        """'look around' is not spell input."""
        assert is_spell_input("look around") is False

    def test_unknown_spell_not_spell(self) -> None:
        """Unknown spell not recognized as spell input."""
        assert is_spell_input("cast expelliarmus") is False


class TestBuildUnknownSpellPrompt:
    """Tests for _build_unknown_spell_prompt function."""

    def test_includes_spell_name(self) -> None:
        """Unknown spell prompt includes attempted spell name."""
        prompt = _build_unknown_spell_prompt("expelliarmus")

        assert "expelliarmus" in prompt

    def test_indicates_unknown(self) -> None:
        """Unknown spell prompt indicates spell not recognized."""
        prompt = _build_unknown_spell_prompt("fake_spell")

        assert "not recognized" in prompt.lower() or "unknown" in prompt.lower()


# =============================================================================
# Phase 4.6.2: Single-Stage Fuzzy + Semantic Detection Tests
# =============================================================================


class TestDetectSpellWithFuzzy:
    """Tests for detect_spell_with_fuzzy function (Phase 4.6.2)."""

    def test_exact_spell_name(self) -> None:
        """Exact spell name detection."""
        from src.context.spell_llm import detect_spell_with_fuzzy

        spell_id, target = detect_spell_with_fuzzy("use legilimency")
        assert spell_id == "legilimency"

    def test_spell_name_with_target(self) -> None:
        """Spell detection with target extraction."""
        from src.context.spell_llm import detect_spell_with_fuzzy

        spell_id, target = detect_spell_with_fuzzy("cast revelio on desk")
        assert spell_id == "revelio"
        assert target == "desk"

    def test_fuzzy_match_typo(self) -> None:
        """Fuzzy matching handles typos."""
        from src.context.spell_llm import detect_spell_with_fuzzy

        # Common typo: legulemancy
        spell_id, target = detect_spell_with_fuzzy("legulemancy on her")
        assert spell_id == "legilimency"
        assert target == "her"

    def test_semantic_phrase_read_mind(self) -> None:
        """Semantic phrase 'read her mind' detects Legilimency."""
        from src.context.spell_llm import detect_spell_with_fuzzy

        spell_id, target = detect_spell_with_fuzzy("I want to read her mind")
        assert spell_id == "legilimency"

    def test_no_false_positive_conversational(self) -> None:
        """Conversational phrases don't trigger detection."""
        from src.context.spell_llm import detect_spell_with_fuzzy

        spell_id, target = detect_spell_with_fuzzy("What's in your mind?")
        assert spell_id is None
        assert target is None

    def test_no_false_positive_simple_question(self) -> None:
        """Simple questions don't trigger detection."""
        from src.context.spell_llm import detect_spell_with_fuzzy

        spell_id, target = detect_spell_with_fuzzy("Can you remember anything?")
        assert spell_id is None
        assert target is None

    def test_all_7_spells_detected(self) -> None:
        """All 7 spells can be detected by name."""
        from src.context.spell_llm import detect_spell_with_fuzzy

        spells = [
            ("cast revelio", "revelio"),
            ("lumos", "lumos"),
            ("homenum revelio", "homenum_revelio"),
            ("specialis revelio", "specialis_revelio"),
            ("prior incantato", "prior_incantato"),
            ("reparo on vase", "reparo"),
            ("legilimency", "legilimency"),
        ]

        for text, expected_id in spells:
            spell_id, _ = detect_spell_with_fuzzy(text)
            assert spell_id == expected_id, f"Failed for {text}"


class TestExtractTargetFromInput:
    """Tests for extract_target_from_input function (Phase 4.6.2)."""

    def test_on_target(self) -> None:
        """Extracts target after 'on'."""
        from src.context.spell_llm import extract_target_from_input

        target = extract_target_from_input("cast revelio on the desk")
        assert target == "the desk"

    def test_at_target(self) -> None:
        """Extracts target after 'at'."""
        from src.context.spell_llm import extract_target_from_input

        target = extract_target_from_input("cast lumos at the corner")
        assert target == "the corner"

    def test_no_target(self) -> None:
        """Returns None if no target specified."""
        from src.context.spell_llm import extract_target_from_input

        target = extract_target_from_input("cast revelio")
        assert target is None


class TestExtractIntentFromInput:
    """Tests for extract_intent_from_input function (Phase 4.6.2)."""

    def test_find_out_about(self) -> None:
        """Extracts intent from 'to find out about X'."""
        from src.context.spell_llm import extract_intent_from_input

        intent = extract_intent_from_input("read her mind to find out about draco")
        assert intent == "draco"

    def test_about_pattern(self) -> None:
        """Extracts intent from 'about X'."""
        from src.context.spell_llm import extract_intent_from_input

        intent = extract_intent_from_input("legilimency about the crime")
        assert intent == "the crime"

    def test_no_intent(self) -> None:
        """Returns None if no intent specified."""
        from src.context.spell_llm import extract_intent_from_input

        intent = extract_intent_from_input("use legilimency on her")
        assert intent is None


class TestDetectFocusedLegilimency:
    """Tests for detect_focused_legilimency function (Phase 4.6.2)."""

    def test_focused_with_intent(self) -> None:
        """Focused Legilimency detected with search intent."""
        from src.context.spell_llm import detect_focused_legilimency

        is_focused, target = detect_focused_legilimency("read her mind to find out about draco")
        assert is_focused is True
        assert target == "draco"

    def test_unfocused_no_intent(self) -> None:
        """Unfocused Legilimency detected without search intent."""
        from src.context.spell_llm import detect_focused_legilimency

        is_focused, target = detect_focused_legilimency("use legilimency on hermione")
        assert is_focused is False
        assert target is None


class TestBuildLegilimencyNarrationPrompt:
    """Tests for build_legilimency_narration_prompt function (Phase 4.6.2)."""

    def test_success_focused_template(self) -> None:
        """Success focused template includes search target."""
        from src.context.spell_llm import build_legilimency_narration_prompt

        prompt = build_legilimency_narration_prompt(
            outcome="success_focused",
            witness_name="Hermione",
            search_target="Draco",
            secret_revealed=True,
        )

        assert "Hermione" in prompt
        assert "Draco" in prompt
        assert "successful" in prompt.lower() or "success" in prompt.lower()

    def test_failure_unfocused_template(self) -> None:
        """Failure unfocused template included."""
        from src.context.spell_llm import build_legilimency_narration_prompt

        prompt = build_legilimency_narration_prompt(
            outcome="failure_unfocused",
            witness_name="Ron",
        )

        assert "Ron" in prompt
        assert "failure" in prompt.lower() or "failed" in prompt.lower()

    def test_invalid_outcome_fallback(self) -> None:
        """Invalid outcome falls back to failure_unfocused."""
        from src.context.spell_llm import build_legilimency_narration_prompt

        prompt = build_legilimency_narration_prompt(
            outcome="invalid_outcome",
            witness_name="Harry",
        )

        # Should fall back to failure_unfocused template
        assert "Harry" in prompt
