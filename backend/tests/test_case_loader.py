"""Tests for case loader module."""

import pytest

from src.case_store.loader import (
    get_all_evidence,
    get_evidence_by_id,
    get_location,
    get_witness,
    list_cases,
    list_witnesses,
    load_case,
    load_confrontation,
    load_mentor_templates,
    load_solution,
    load_witnesses,
    load_wrong_suspects,
    load_wrong_verdict_info,
)


class TestLoadCase:
    """Tests for load_case function."""

    def test_load_case_001_success(self) -> None:
        """Load case_001 successfully."""
        case_data = load_case("case_001")

        assert "case" in case_data
        assert case_data["case"]["id"] == "case_001"
        assert case_data["case"]["title"] == "The Restricted Section"

    def test_load_case_has_locations(self) -> None:
        """Case has locations dictionary."""
        case_data = load_case("case_001")

        assert "locations" in case_data["case"]
        assert "library" in case_data["case"]["locations"]

    def test_load_case_not_found_raises(self) -> None:
        """FileNotFoundError for missing case."""
        with pytest.raises(FileNotFoundError):
            load_case("nonexistent_case")


class TestGetLocation:
    """Tests for get_location function."""

    def test_get_library_location(self) -> None:
        """Get library location data."""
        case_data = load_case("case_001")
        location = get_location(case_data, "library")

        assert location["id"] == "library"
        assert location["name"] == "Hogwarts Library - Crime Scene"
        assert "description" in location

    def test_location_has_description_multiline(self) -> None:
        """Location description has multiple lines (YAML pipe)."""
        case_data = load_case("case_001")
        location = get_location(case_data, "library")

        description = location["description"]
        assert "\n" in description
        assert "oak desk" in description.lower()

    def test_location_has_hidden_evidence(self) -> None:
        """Location has hidden evidence list."""
        case_data = load_case("case_001")
        location = get_location(case_data, "library")

        assert "hidden_evidence" in location
        evidence_list = location["hidden_evidence"]
        assert len(evidence_list) >= 2

        # Check evidence structure
        first_evidence = evidence_list[0]
        assert "id" in first_evidence
        assert "triggers" in first_evidence
        assert "description" in first_evidence

    def test_location_has_not_present_items(self) -> None:
        """Location has not_present items for hallucination prevention."""
        case_data = load_case("case_001")
        location = get_location(case_data, "library")

        assert "not_present" in location
        not_present = location["not_present"]
        assert len(not_present) >= 2

        # Check structure
        first_item = not_present[0]
        assert "triggers" in first_item
        assert "response" in first_item

    def test_get_nonexistent_location_raises(self) -> None:
        """KeyError for missing location."""
        case_data = load_case("case_001")

        with pytest.raises(KeyError):
            get_location(case_data, "nonexistent_room")


class TestListCases:
    """Tests for list_cases function."""

    def test_list_cases_includes_case_001(self) -> None:
        """case_001 in available cases."""
        cases = list_cases()

        assert "case_001" in cases

    def test_list_cases_returns_list(self) -> None:
        """Returns list of strings."""
        cases = list_cases()

        assert isinstance(cases, list)
        assert all(isinstance(c, str) for c in cases)


class TestEvidenceStructure:
    """Tests for evidence data structure."""

    def test_evidence_has_required_fields(self) -> None:
        """Each evidence has id, triggers, description."""
        case_data = load_case("case_001")
        location = get_location(case_data, "library")

        for evidence in location["hidden_evidence"]:
            assert "id" in evidence, f"Evidence missing 'id': {evidence}"
            assert "triggers" in evidence, f"Evidence missing 'triggers': {evidence}"
            assert "description" in evidence, f"Evidence missing 'description': {evidence}"
            assert isinstance(evidence["triggers"], list)
            assert len(evidence["triggers"]) >= 1

    def test_evidence_triggers_are_lowercase_substrings(self) -> None:
        """Triggers suitable for substring matching."""
        case_data = load_case("case_001")
        location = get_location(case_data, "library")

        for evidence in location["hidden_evidence"]:
            for trigger in evidence["triggers"]:
                # Triggers should be lowercase for case-insensitive matching
                assert trigger == trigger.lower(), f"Trigger not lowercase: {trigger}"

    def test_hidden_note_evidence_exists(self) -> None:
        """hidden_note evidence with desk triggers."""
        case_data = load_case("case_001")
        location = get_location(case_data, "library")

        evidence_ids = [e["id"] for e in location["hidden_evidence"]]
        assert "hidden_note" in evidence_ids

        hidden_note = next(e for e in location["hidden_evidence"] if e["id"] == "hidden_note")
        assert "under desk" in hidden_note["triggers"]

    def test_wand_signature_evidence_exists(self) -> None:
        """wand_signature evidence with wand triggers."""
        case_data = load_case("case_001")
        location = get_location(case_data, "library")

        evidence_ids = [e["id"] for e in location["hidden_evidence"]]
        assert "wand_signature" in evidence_ids

        wand_sig = next(e for e in location["hidden_evidence"] if e["id"] == "wand_signature")
        assert "prior incantato" in wand_sig["triggers"]


class TestLoadWitnesses:
    """Tests for witness loading functions."""

    def test_load_witnesses_returns_dict(self) -> None:
        """load_witnesses returns dict keyed by witness ID."""
        case_data = load_case("case_001")
        witnesses = load_witnesses(case_data)

        assert isinstance(witnesses, dict)
        assert "hermione" in witnesses
        assert "draco" in witnesses

    def test_get_witness_hermione(self) -> None:
        """Get Hermione witness data."""
        case_data = load_case("case_001")
        hermione = get_witness(case_data, "hermione")

        assert hermione["name"] == "Hermione Granger"
        assert hermione["base_trust"] == 50
        assert "personality" in hermione
        assert "knowledge" in hermione
        assert "secrets" in hermione
        assert "lies" in hermione

    def test_get_witness_draco(self) -> None:
        """Get Draco witness data."""
        case_data = load_case("case_001")
        draco = get_witness(case_data, "draco")

        assert draco["name"] == "Draco Malfoy"
        assert draco["base_trust"] == 20
        assert "personality" in draco

    def test_get_witness_not_found_raises(self) -> None:
        """KeyError for missing witness."""
        case_data = load_case("case_001")

        with pytest.raises(KeyError):
            get_witness(case_data, "voldemort")

    def test_list_witnesses(self) -> None:
        """list_witnesses returns witness IDs."""
        case_data = load_case("case_001")
        witness_ids = list_witnesses(case_data)

        assert "hermione" in witness_ids
        assert "draco" in witness_ids
        assert len(witness_ids) == 2


class TestWitnessStructure:
    """Tests for witness data structure."""

    def test_witness_has_required_fields(self) -> None:
        """Each witness has required fields."""
        case_data = load_case("case_001")
        witnesses = load_witnesses(case_data)

        required_fields = [
            "id",
            "name",
            "personality",
            "base_trust",
            "knowledge",
            "secrets",
            "lies",
        ]

        for witness_id, witness in witnesses.items():
            for field in required_fields:
                assert field in witness, f"Witness {witness_id} missing '{field}'"

    def test_witness_knowledge_is_list(self) -> None:
        """Witness knowledge is a list of strings."""
        case_data = load_case("case_001")
        hermione = get_witness(case_data, "hermione")

        assert isinstance(hermione["knowledge"], list)
        assert len(hermione["knowledge"]) >= 3
        assert all(isinstance(k, str) for k in hermione["knowledge"])

    def test_witness_secrets_structure(self) -> None:
        """Witness secrets have id, trigger, text."""
        case_data = load_case("case_001")
        hermione = get_witness(case_data, "hermione")

        for secret in hermione["secrets"]:
            assert "id" in secret, f"Secret missing 'id': {secret}"
            assert "trigger" in secret, f"Secret missing 'trigger': {secret}"
            assert "text" in secret, f"Secret missing 'text': {secret}"

    def test_witness_lies_structure(self) -> None:
        """Witness lies have condition, topics, response."""
        case_data = load_case("case_001")
        draco = get_witness(case_data, "draco")

        for lie in draco["lies"]:
            assert "condition" in lie, f"Lie missing 'condition': {lie}"
            assert "topics" in lie, f"Lie missing 'topics': {lie}"
            assert "response" in lie, f"Lie missing 'response': {lie}"
            assert isinstance(lie["topics"], list)

    def test_hermione_secret_triggers(self) -> None:
        """Hermione's secrets have valid triggers."""
        case_data = load_case("case_001")
        hermione = get_witness(case_data, "hermione")

        secret_ids = [s["id"] for s in hermione["secrets"]]
        assert "saw_draco" in secret_ids
        assert "borrowed_restricted_book" in secret_ids

        saw_draco = next(s for s in hermione["secrets"] if s["id"] == "saw_draco")
        assert "evidence:frost_pattern" in saw_draco["trigger"]
        assert "trust>70" in saw_draco["trigger"]

    def test_draco_base_trust_lower_than_hermione(self) -> None:
        """Draco starts with lower trust (hostile)."""
        case_data = load_case("case_001")
        hermione = get_witness(case_data, "hermione")
        draco = get_witness(case_data, "draco")

        assert draco["base_trust"] < hermione["base_trust"]


class TestWitnessesPresentField:
    """Tests for witnesses_present field in locations."""

    def test_location_has_witnesses_present_field(self) -> None:
        """Location includes witnesses_present field."""
        case_data = load_case("case_001")
        location = get_location(case_data, "library")

        assert "witnesses_present" in location
        assert isinstance(location["witnesses_present"], list)

    def test_library_has_hermione_present(self) -> None:
        """Library has Hermione as witness present."""
        case_data = load_case("case_001")
        location = get_location(case_data, "library")

        assert "hermione" in location["witnesses_present"]

    def test_witnesses_present_defaults_to_empty(self) -> None:
        """Missing witnesses_present defaults to empty list."""
        # This tests backward compatibility via get_location
        case_data = load_case("case_001")
        location = get_location(case_data, "library")

        # Field should exist (either from YAML or default)
        assert "witnesses_present" in location


class TestEvidenceMetadata:
    """Tests for evidence metadata fields (name, location_found, description)."""

    def test_evidence_has_name_field(self) -> None:
        """Each evidence has name field."""
        case_data = load_case("case_001")
        location = get_location(case_data, "library")

        for evidence in location["hidden_evidence"]:
            assert "name" in evidence, f"Evidence {evidence['id']} missing 'name'"
            assert isinstance(evidence["name"], str)
            assert len(evidence["name"]) > 0

    def test_evidence_has_location_found_field(self) -> None:
        """Each evidence has location_found field."""
        case_data = load_case("case_001")
        location = get_location(case_data, "library")

        for evidence in location["hidden_evidence"]:
            assert "location_found" in evidence, (
                f"Evidence {evidence['id']} missing 'location_found'"
            )
            assert evidence["location_found"] == "library"

    def test_evidence_description_is_detailed(self) -> None:
        """Evidence descriptions are detailed (multi-sentence)."""
        case_data = load_case("case_001")
        location = get_location(case_data, "library")

        for evidence in location["hidden_evidence"]:
            desc = evidence["description"]
            # Should have at least 50 characters for meaningful description
            assert len(desc) >= 50, f"Evidence {evidence['id']} has too short description"

    def test_hidden_note_metadata(self) -> None:
        """Hidden note has correct metadata."""
        case_data = load_case("case_001")
        location = get_location(case_data, "library")

        hidden_note = next(e for e in location["hidden_evidence"] if e["id"] == "hidden_note")
        assert hidden_note["name"] == "Threatening Note"
        assert hidden_note["location_found"] == "library"
        assert "parchment" in hidden_note["description"].lower()

    def test_wand_signature_metadata(self) -> None:
        """Wand signature has correct metadata."""
        case_data = load_case("case_001")
        location = get_location(case_data, "library")

        wand_sig = next(e for e in location["hidden_evidence"] if e["id"] == "wand_signature")
        assert wand_sig["name"] == "Prior Incantato Result"
        assert wand_sig["location_found"] == "library"
        assert "stupefy" in wand_sig["description"].lower()

    def test_frost_pattern_metadata(self) -> None:
        """Frost pattern has correct metadata."""
        case_data = load_case("case_001")
        location = get_location(case_data, "library")

        frost = next(e for e in location["hidden_evidence"] if e["id"] == "frost_pattern")
        assert frost["name"] == "Unnatural Frost Pattern"
        assert frost["location_found"] == "library"
        assert "spiral" in frost["description"].lower()


class TestGetEvidenceById:
    """Tests for get_evidence_by_id function."""

    def test_get_existing_evidence(self) -> None:
        """Get evidence by ID returns correct data."""
        case_data = load_case("case_001")
        evidence = get_evidence_by_id(case_data, "library", "hidden_note")

        assert evidence is not None
        assert evidence["id"] == "hidden_note"
        assert evidence["name"] == "Threatening Note"
        assert evidence["location_found"] == "library"
        assert "description" in evidence

    def test_get_nonexistent_evidence(self) -> None:
        """Get evidence returns None for missing ID."""
        case_data = load_case("case_001")
        evidence = get_evidence_by_id(case_data, "library", "fake_evidence")

        assert evidence is None

    def test_get_evidence_has_all_fields(self) -> None:
        """Returned evidence has all metadata fields."""
        case_data = load_case("case_001")
        evidence = get_evidence_by_id(case_data, "library", "frost_pattern")

        required_fields = ["id", "name", "location_found", "description", "type", "triggers", "tag"]
        for field in required_fields:
            assert field in evidence, f"Evidence missing field: {field}"


class TestGetAllEvidence:
    """Tests for get_all_evidence function."""

    def test_get_all_evidence_returns_list(self) -> None:
        """Get all evidence returns list of evidence."""
        case_data = load_case("case_001")
        all_evidence = get_all_evidence(case_data, "library")

        assert isinstance(all_evidence, list)
        assert len(all_evidence) == 3  # hidden_note, wand_signature, frost_pattern

    def test_all_evidence_has_metadata(self) -> None:
        """All evidence items have required metadata."""
        case_data = load_case("case_001")
        all_evidence = get_all_evidence(case_data, "library")

        for evidence in all_evidence:
            assert "id" in evidence
            assert "name" in evidence
            assert "location_found" in evidence
            assert "description" in evidence
            assert "type" in evidence


# Phase 3: Verdict-related loader tests


class TestLoadSolution:
    """Tests for load_solution function."""

    def test_load_solution_returns_dict(self) -> None:
        """load_solution returns solution dictionary."""
        case_data = load_case("case_001")
        solution = load_solution(case_data)

        assert isinstance(solution, dict)

    def test_solution_has_culprit(self) -> None:
        """Solution has culprit field."""
        case_data = load_case("case_001")
        solution = load_solution(case_data)

        assert "culprit" in solution
        assert solution["culprit"] == "draco"

    def test_solution_has_method(self) -> None:
        """Solution has method field."""
        case_data = load_case("case_001")
        solution = load_solution(case_data)

        assert "method" in solution
        assert (
            "freezing" in solution["method"].lower() or "petrificus" in solution["method"].lower()
        )

    def test_solution_has_key_evidence(self) -> None:
        """Solution has key_evidence list."""
        case_data = load_case("case_001")
        solution = load_solution(case_data)

        assert "key_evidence" in solution
        assert isinstance(solution["key_evidence"], list)
        assert "frost_pattern" in solution["key_evidence"]

    def test_solution_has_deductions_required(self) -> None:
        """Solution has deductions_required list."""
        case_data = load_case("case_001")
        solution = load_solution(case_data)

        assert "deductions_required" in solution
        assert isinstance(solution["deductions_required"], list)
        assert len(solution["deductions_required"]) >= 1


class TestLoadWrongSuspects:
    """Tests for load_wrong_suspects function."""

    def test_load_wrong_suspects_returns_list(self) -> None:
        """load_wrong_suspects returns list."""
        case_data = load_case("case_001")
        wrong_suspects = load_wrong_suspects(case_data)

        assert isinstance(wrong_suspects, list)

    def test_hermione_in_wrong_suspects(self) -> None:
        """Hermione is in wrong suspects list."""
        case_data = load_case("case_001")
        wrong_suspects = load_wrong_suspects(case_data)

        suspect_ids = [s["id"] for s in wrong_suspects]
        assert "hermione" in suspect_ids

    def test_wrong_suspect_has_why_innocent(self) -> None:
        """Wrong suspect has why_innocent field."""
        case_data = load_case("case_001")
        wrong_suspects = load_wrong_suspects(case_data)

        hermione = next(s for s in wrong_suspects if s["id"] == "hermione")
        assert "why_innocent" in hermione
        assert (
            "wand" in hermione["why_innocent"].lower()
            or "witness" in hermione["why_innocent"].lower()
        )

    def test_wrong_suspect_has_exoneration_evidence(self) -> None:
        """Wrong suspect has exoneration_evidence list."""
        case_data = load_case("case_001")
        wrong_suspects = load_wrong_suspects(case_data)

        hermione = next(s for s in wrong_suspects if s["id"] == "hermione")
        assert "exoneration_evidence" in hermione
        assert isinstance(hermione["exoneration_evidence"], list)


class TestLoadConfrontation:
    """Tests for load_confrontation function."""

    def test_load_confrontation_correct_verdict(self) -> None:
        """Load confrontation for correct verdict."""
        case_data = load_case("case_001")
        confrontation = load_confrontation(case_data, "draco", correct=True)

        assert confrontation is not None
        assert "dialogue" in confrontation
        assert "aftermath" in confrontation

    def test_confrontation_dialogue_structure(self) -> None:
        """Confrontation dialogue has speaker and text."""
        case_data = load_case("case_001")
        confrontation = load_confrontation(case_data, "draco", correct=True)

        assert len(confrontation["dialogue"]) >= 3
        for entry in confrontation["dialogue"]:
            assert "speaker" in entry
            assert "text" in entry

    def test_confrontation_has_moody(self) -> None:
        """Confrontation includes Moody dialogue."""
        case_data = load_case("case_001")
        confrontation = load_confrontation(case_data, "draco", correct=True)

        speakers = [d["speaker"] for d in confrontation["dialogue"]]
        assert "moody" in speakers

    def test_confrontation_has_aftermath(self) -> None:
        """Confrontation has aftermath text."""
        case_data = load_case("case_001")
        confrontation = load_confrontation(case_data, "draco", correct=True)

        assert len(confrontation["aftermath"]) > 50

    def test_load_confrontation_incorrect_no_show(self) -> None:
        """Load confrontation for incorrect verdict without show_anyway returns None."""
        case_data = load_case("case_001")
        # Mock: if no "confrontation_anyway" defined or False
        confrontation = load_confrontation(case_data, "unknown_suspect", correct=False)

        assert confrontation is None

    def test_load_confrontation_incorrect_show_anyway(self) -> None:
        """Load confrontation for incorrect verdict with show_anyway=True."""
        case_data = load_case("case_001")
        # Hermione has confrontation_anyway: true
        confrontation = load_confrontation(case_data, "hermione", correct=False)

        assert confrontation is not None
        assert "dialogue" in confrontation


class TestLoadMentorTemplates:
    """Tests for load_mentor_templates function."""

    def test_load_mentor_templates_returns_dict(self) -> None:
        """load_mentor_templates returns dictionary."""
        case_data = load_case("case_001")
        templates = load_mentor_templates(case_data)

        assert isinstance(templates, dict)

    def test_templates_has_fallacies(self) -> None:
        """Templates have fallacies section."""
        case_data = load_case("case_001")
        templates = load_mentor_templates(case_data)

        assert "fallacies" in templates
        assert "confirmation_bias" in templates["fallacies"]

    def test_fallacy_template_structure(self) -> None:
        """Fallacy templates have description and example."""
        case_data = load_case("case_001")
        templates = load_mentor_templates(case_data)

        cb = templates["fallacies"]["confirmation_bias"]
        assert "description" in cb
        assert "example" in cb

    def test_templates_has_reasoning_quality(self) -> None:
        """Templates have reasoning_quality section."""
        case_data = load_case("case_001")
        templates = load_mentor_templates(case_data)

        assert "reasoning_quality" in templates
        assert "excellent" in templates["reasoning_quality"]
        assert "failing" in templates["reasoning_quality"]

    def test_templates_has_wrong_suspect_responses(self) -> None:
        """Templates have wrong_suspect_responses section."""
        case_data = load_case("case_001")
        templates = load_mentor_templates(case_data)

        assert "wrong_suspect_responses" in templates
        assert "hermione" in templates["wrong_suspect_responses"]


class TestLoadWrongVerdictInfo:
    """Tests for load_wrong_verdict_info function."""

    def test_load_wrong_verdict_info_existing(self) -> None:
        """Load info for existing wrong suspect."""
        case_data = load_case("case_001")
        info = load_wrong_verdict_info(case_data, "hermione")

        assert info is not None
        assert "reveal" in info
        assert "teaching_moment" in info
        assert "confrontation_anyway" in info

    def test_wrong_verdict_info_has_reveal(self) -> None:
        """Wrong verdict info has reveal text."""
        case_data = load_case("case_001")
        info = load_wrong_verdict_info(case_data, "hermione")

        assert "draco" in info["reveal"].lower()

    def test_wrong_verdict_info_has_teaching_moment(self) -> None:
        """Wrong verdict info has teaching_moment."""
        case_data = load_case("case_001")
        info = load_wrong_verdict_info(case_data, "hermione")

        assert len(info["teaching_moment"]) > 20

    def test_load_wrong_verdict_info_nonexistent(self) -> None:
        """Load info for non-existent wrong suspect returns None."""
        case_data = load_case("case_001")
        info = load_wrong_verdict_info(case_data, "unknown_suspect")

        assert info is None

    def test_load_wrong_verdict_info_case_insensitive(self) -> None:
        """Load info is case-insensitive."""
        case_data = load_case("case_001")
        info = load_wrong_verdict_info(case_data, "HERMIONE")

        assert info is not None
