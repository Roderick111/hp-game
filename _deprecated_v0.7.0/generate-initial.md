Create an INITIAL.md file for the feature I'm about to describe.

  BEFORE writing, perform web searches to find:
  1. Real-world code examples from GitHub (repositories with similar implementations)
  2. Official documentation for relevant libraries/frameworks/APIs
  3. Technical articles or guides about this type of feature
  4. Common implementation patterns and best practices

  Then fill out this template:

  ## FEATURE:
  [Clear description of what needs to be built - functionality, user experience, and technical requirements]

  ## EXAMPLES:
  [List 2-4 relevant GitHub repositories, code examples, or live demos you found. For each:
  - Repository/source name and URL
  - Brief explanation of what pattern or approach to adopt from it
  - Why it's relevant to this project]

  ## DOCUMENTATION:
  [List official documentation sources that will be referenced during development:
  - API documentation
  - Framework/library official docs
  - Technical specifications
  - MCP server resources (if applicable)
  - Any other authoritative sources]

  ## TESTING STRATEGY:
  [Required validation and testing approach:
  - Unit test coverage requirements (aim for >85%)
  - Integration test scenarios
  - Test file locations following project structure
  - validation-gates agent will run: lint, type-check, tests, build, security
  - Specific edge cases to test]

  ## DOCUMENTATION UPDATES:
  [Documentation that needs updating after implementation:
  - STATUS.md: Update milestone progress and agent handoff context
  - PLANNING.md: Update current status section if milestone completes
  - README.md: Add new features if user-facing
  - Serena memory files: Update project_overview if architecture changes
  - Code comments: Document any non-obvious logic]

  ## OTHER CONSIDERATIONS:
  [Important details that shouldn't be missed:
  - Common pitfalls or gotchas
  - Edge cases to handle
  - Performance considerations
  - Security concerns
  - Compatibility requirements
  - Anything AI assistants frequently overlook for this type of feature]

  GUIDELINES:
  - Keep each section concise (3-6 bullet points maximum)
  - Prioritize quality over quantity in examples
  - Focus on actionable, specific references
  - Ensure examples are recent and maintained (check last commit date)
  - Verify all URLs are accessible
  - ALWAYS include testing and documentation sections

  The feature I want to implement is: [DESCRIBE YOUR FEATURE HERE]

  ---
  Or a more compact version:

  Generate INITIAL.md for: [YOUR FEATURE DESCRIPTION]

  PROCESS:
  1. Search GitHub for 2-4 relevant code examples
  2. Find official documentation for required libraries/APIs
  3. Research common implementation patterns and pitfalls
  4. Define testing strategy (unit tests, integration tests, validation gates)
  5. Identify documentation that needs updating

  OUTPUT (using template):
  - FEATURE: Clear description with functionality + technical requirements
  - EXAMPLES: 2-4 GitHub repos/demos with URLs, explaining what pattern to use from each
  - DOCUMENTATION: Official docs, APIs, specs that will be referenced
  - TESTING STRATEGY: Unit test requirements, validation gates, edge cases
  - DOCUMENTATION UPDATES: Files to update after implementation
  - OTHER CONSIDERATIONS: Gotchas, edge cases, common mistakes to avoid

  Keep concise (3-6 points per section). Prioritize recent, well-maintained examples.

  WORKFLOW:
  After implementation:
  1. Run validation-gates agent for automated testing
  2. Run documentation-manager agent to update docs
  3. Update STATUS.md with completion status
