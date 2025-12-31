# INITIAL.md - Enhanced Type System for Milestone 1

## FEATURE:

Create a comprehensive TypeScript type system for enhanced game mechanics including conditional hypothesis unlocking, evidence contradictions, and unlock events. This system will extend the existing `PlayerState` interface and introduce new type definitions for:

- **ConditionalHypothesis**: Multi-tier hypothesis system with unlock requirements and threshold-based progression
- **Contradiction**: Evidence conflict tracking with resolution status and metadata
- **UnlockEvent**: Event tracking system for hypothesis tier unlocking with trigger conditions
- **Enhanced PlayerState**: Extended player state to track hypothesis tiers, unlocked hypotheses, discovered contradictions, and unlock history

**Technical Requirements**:
- TypeScript strict mode compliance (no `any` types, explicit return types)
- Immutable state patterns using `readonly` properties
- Interface extension patterns for backward compatibility
- Type-safe discriminated unions for event types
- Generic constraints for reusable type patterns

**User Experience Impact**:
- Enables progressive revelation of hypotheses as players investigate
- Provides visual feedback for contradiction detection
- Tracks player progression through hypothesis tiers
- Creates foundation for achievement/unlock notification system

---

## EXAMPLES:

### 1. **UnlockIt - Achievement Tracker System**
**Repository**: [Med-Echbiy/UnlockIt](https://github.com/Med-Echbiy/UnlockIt)

**Relevant Patterns**:
- 7-tier progression rank system based on scores and completion percentage
- Real-time tracking with React Context + TypeScript interfaces
- Modern UI with Framer Motion animations for unlock notifications
- Achievement evaluation interface pattern with common base type

**Why Relevant**: Demonstrates TypeScript patterns for multi-tier unlocking systems with scoring mechanics, similar to our hypothesis tier progression. Shows how to structure unlock events and progression tracking.

---

### 2. **React Notification System with Context**
**Article**: [Learning React: Custom Notification-System with Context](https://blog.cetindere.de/react-notification-contexts/)
**Additional**: [App-wide Notifications with Hooks & React Context](https://eng.tatari.tv/engineering/2020/09/18/app-wide-notifications.html)

**Relevant Patterns**:
- TypeScript interfaces for notification data (title, content, type)
- Context-based state management with reducer pattern
- Event queue system with unique IDs for tracking
- Type-safe provider composition for multiple contexts

**Why Relevant**: Provides pattern for implementing `UnlockEvent` notification system. Shows how to create type-safe event queues and manage transient state (unlocks) separate from persistent state (player progress).

---

### 3. **TypeScript Immutable State Patterns**
**Documentation**: [TypeScript: Object Types](https://www.typescriptlang.org/docs/handbook/2/objects.html)
**Tutorial**: [TypeScript Extend Interface](https://www.typescriptlang.org/docs/handbook/interfaces.html)
**Guide**: [Implementing Immutable Objects in TypeScript](https://softwarepatternslexicon.com/patterns-ts/9/1/1/)

**Relevant Patterns**:
- Interface extension with `extends` keyword for backward compatibility
- `readonly` modifier for immutable properties
- Structural sharing patterns for state updates
- Generic constraints with `Record<K, V>` and `Pick<T, K>`

**Why Relevant**: Official TypeScript documentation for extending interfaces immutably. Critical for extending `PlayerState` without breaking existing functionality while maintaining type safety.

---

### 4. **Mastra Detective Game - Evidence System**
**Article**: [Building an Interactive Detective Game with Multi-Agent AI](https://mastra.ai/blog/the-detective-game)
**Reference**: [Contradiction Game Mechanics](https://www.escapistmagazine.com/see-how-to-conquer-contradiction-with-the-in-game-cheat-system/)

**Relevant Patterns**:
- Evidence data structure with conflict detection metadata
- Statement pairing system for contradiction identification
- Character testimony tracking with truth/lie status
- Evidence inventory with categorization

**Why Relevant**: Shows how detective games structure evidence and contradiction data. Provides insight into designing the `Contradiction` interface with proper metadata for tracking conflicts and resolutions.

---

## DOCUMENTATION:

### Official TypeScript Documentation
- **[TypeScript Handbook: Object Types](https://www.typescriptlang.org/docs/handbook/2/objects.html)** - Interface definitions, readonly properties, index signatures
- **[TypeScript Handbook: Interfaces](https://www.typescriptlang.org/docs/handbook/interfaces.html)** - Interface extension, optional properties, type constraints
- **[TypeScript: Everyday Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html)** - Union types, type aliases, type assertions
- **[TypeScript: Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)** - Discriminated unions, type guards, type predicates

### React Context API
- **[React Context API Documentation](https://react.dev/reference/react/createContext)** - Context creation, provider patterns, consuming context
- **[React useReducer Hook](https://react.dev/reference/react/useReducer)** - Reducer patterns, action types, state updates

### TypeScript Best Practices
- **[TypeScript Best Practices 2024](https://pierre.io/journal/typescript-best-practices/)** - Strict mode configuration, type safety patterns
- **[TypeScript Strict Mode Guide](https://runebook.dev/en/articles/typescript/tsconfig/strict-config)** - Benefits and common pitfalls of strict configuration
- **[Mastering TypeScript Best Practices](https://www.bacancytechnology.com/blog/typescript-best-practices)** - Avoiding `any`, using `unknown`, template literals

---

## OTHER CONSIDERATIONS:

### Common Pitfalls
- **Avoid optional chaining abuse**: Use discriminated unions instead of `?` for state that has clear phases (locked vs unlocked)
- **Don't nest generics excessively**: Keep type definitions simple and readable, use type aliases for complex generic combinations
- **Circular dependencies**: When extending `PlayerState`, ensure `UnlockEvent` doesn't create circular type references
- **Type widening**: Use `as const` for literal types in unlock conditions to prevent string widening

### Edge Cases to Handle
- **Multiple simultaneous unlocks**: What if 2+ hypotheses unlock from same evidence? Queue system needed
- **Partial contradiction resolution**: Evidence may resolve some contradictions while creating new ones
- **Race conditions in unlock events**: Ensure event IDs are unique and order-independent
- **State migration**: Existing `PlayerState` data must remain valid when extended

### Performance Considerations
- **Immutable updates**: Use spread operators efficiently, avoid deep cloning entire state for small changes
- **Event queue cleanup**: Implement TTL (time-to-live) for `UnlockEvent` instances to prevent memory leaks
- **Type inference overhead**: Explicit type annotations on complex interfaces reduce compile-time overhead

### Security Concerns
- **Data validation**: Even with TypeScript, validate unlock conditions can't be manipulated client-side
- **Sensitive game data**: Ensure Tier 2 hypotheses aren't exposed in initial state (prevent spoilers via devtools)

### Compatibility Requirements
- **Backward compatibility**: Existing game code using `PlayerState` must continue working
- **Forward compatibility**: Design interfaces to allow future extension (Mission 2-6 mechanics)
- **Type narrowing**: Ensure discriminated unions work correctly with TypeScript 5.6+

### AI Assistant Blind Spots
- **Over-abstracting too early**: Don't create generic `Unlockable<T>` if only used for hypotheses in Mission 1
- **Forgetting readonly enforcement**: Every state property should be `readonly` for immutability guarantees
- **Missing JSDoc on complex types**: Interfaces like `ConditionalHypothesis` need documentation comments
- **Not considering testing**: Types should be designed with test fixture creation in mind

### Design Philosophy Alignment
- **YAGNI**: Only implement features needed for Mission 1, don't over-engineer for future missions
- **KISS**: Keep type definitions simple and self-documenting
- **Fail Fast**: Use strict TypeScript settings to catch errors at compile time, not runtime

---

## IMPLEMENTATION CHECKLIST

Based on TASK.md Milestone 1:
- [ ] Create `src/types/enhanced.ts` file
- [ ] Define `ConditionalHypothesis` interface with unlock requirements
- [ ] Define `Contradiction` interface with conflict metadata
- [ ] Define `UnlockEvent` interface with event tracking
- [ ] Extend `PlayerState` for tiers and contradictions
- [ ] Ensure TypeScript strict mode compliance
- [ ] Add JSDoc comments to all public interfaces
- [ ] Test type definitions with example fixtures

---

## SOURCES

- [GitHub - pmndrs/zustand](https://github.com/pmndrs/zustand)
- [game-state · GitHub Topics](https://github.com/topics/game-state?l=typescript)
- [Building an Interactive Detective Game with Multi-Agent AI - Mastra Blog](https://mastra.ai/blog/the-detective-game)
- [Learning React: Custom Notification-System with Context](https://blog.cetindere.de/react-notification-contexts/)
- [App-wide Notifications with Hooks & React Context](https://eng.tatari.tv/engineering/2020/09/18/app-wide-notifications.html)
- [Mastering React Context in TypeScript](https://blog.rz-codes.com/433/web-dev/mastering-react-context-in-typescript-from-basics-to-advanced-patterns/)
- [TypeScript: Documentation - Object Types](https://www.typescriptlang.org/docs/handbook/2/objects.html)
- [TypeScript: Handbook - Interfaces](https://www.typescriptlang.org/docs/handbook/interfaces.html)
- [TypeScript Extend Interface](https://www.typescriptlang.org/docs/handbook/interfaces.html)
- [Implementing Immutable Objects in TypeScript](https://softwarepatternslexicon.com/patterns-ts/9/1/1/)
- [TypeScript Best Practices for 2024](https://pierre.io/journal/typescript-best-practices/)
- [GitHub - Med-Echbiy/UnlockIt](https://github.com/Med-Echbiy/UnlockIt)
- [Contradiction Game Mechanics](https://www.escapistmagazine.com/see-how-to-conquer-contradiction-with-the-in-game-cheat-system/)
