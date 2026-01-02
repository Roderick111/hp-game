# Execute BASE PRP

Implement a feature using using the PRP file.

## PRP File: $ARGUMENTS

## Execution Process

1. **Load PRP**
   - Read the specified PRP file
   - Understand all context and requirements
   - Follow all instructions in the PRP and extend the research if needed
   - Ensure you have all needed context to implement the PRP fully
   - Do more web searches and codebase exploration as needed

2. **ULTRATHINK**
   - Think hard before you execute the plan. Create a comprehensive plan addressing all requirements.
   - Break down complex tasks into smaller, manageable steps using your todos tools.
   - Use the TodoWrite tool to create and track your implementation plan.
   - Identify implementation patterns from existing code to follow.
   - Use context7 mcp before writing any important code

3. **Execute the plan**
   - Execute the PRP
   - Implement all the code
   - Use relevant subagent for code writing:
     fastapi-specialist
     nextjs-specialist
     react-vite-specialist
     refactoring-specialist
     typescript-architect
     data-scientist
     devops-engineer
     dependency_manager

4. **Validate**
   - Run validation-gates agent to verify the implementation
   - Validation includes: linting, type-checking, tests, build, security audit
   - Fix any failures iteratively
   - Hard issues may be fixed with the debugger subagent
   - Re-run until ALL gates pass (0 errors)

5. **Update Documentation**
   - Run documentation-manager agent to update project docs
   - Updates required:
     - STATUS.md: Mark tasks complete, update milestone progress
     - PLANNING.md: Update current status if milestone completes
     - README.md: Document new user-facing features
     - Serena memories: Update project_overview if architecture changes
   - Provide the agent with list of files changed for context

6. **Complete**
   - Ensure all checklist items done
   - Run final validation suite (one more time)
   - Report completion status with summary:
     - Tests passed/total
     - Coverage percentage
     - Files created/modified
     - Documentation updated
   - Read the PRP again to ensure you have implemented everything

7. **Reference the PRP**
   - You can always reference the PRP again if needed

## Post-Implementation Workflow
```yaml
Step 1 - Validation:
  agent: validation-gates
  gates:
    - npm run lint (0 errors)
    - npm run type-check (0 errors)
    - npm test (all passing)
    - npm run build (success)
    - npm audit (0 vulnerabilities)

Step 2 - Documentation:
  agent: documentation-manager
  files_to_update:
    - STATUS.md
    - PLANNING.md (if milestone completes)
    - README.md (if user-facing changes)
    - Serena memories (if architecture changes)
  context: Provide list of files changed

Step 3 - Completion:
  - Verify all PRP checklist items done
  - Report summary to user
  - Commit changes if requested
```

Note: If validation fails, use error patterns in PRP to fix and retry. Never skip validation or documentation steps.
