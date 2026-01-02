# INITIAL.md - Milestone 6: UI/UX Polish and Game Flow Improvements

## FEATURE:

- **Hypothesis Selection System** - Allow players to choose which Tier 1 hypotheses to actively investigate (not passive viewing)
- **Visual Tier Distinction** - Clear visual separation between available (Tier 1) and locked (Tier 2) hypotheses with "locked placeholder" cards
- **Evidence-Hypothesis Linking** - Visual indicators showing which evidence supports/contradicts which hypotheses
- **Contradiction Integration** - Make contradiction discovery dramatic and clearly integrated into investigation flow
- **Investigation Strategy UI** - Allow players to plan investigation paths and see IP cost implications
- **Unlock Feedback Loop** - Ensure UnlockToast appears and creates "aha!" moments when Tier 2 unlocks
- **Phase Transition Animations** - Smooth, informative transitions between game phases
- **Progress Visualization** - Show investigation progress, hypothesis confidence evolution, IP scarcity tension
- **Enhanced Evidence Cards** - Better information architecture showing relevance, contradictions, IP cost, unlock potential
- **Case Review Meaningfulness** - Make metrics feel impactful and educational, not just numbers

## EXAMPLES:

### Codebase Patterns
- `src/components/ui/UnlockToast.tsx` - Existing toast component (verify integration)
- `src/components/ui/ContradictionPanel.tsx` - Existing contradiction UI (enhance visibility)
- `src/components/phases/HypothesisFormation.tsx` - Needs hypothesis selection UX
- `src/components/phases/Investigation.tsx` - Needs evidence-hypothesis linking
- `src/components/ui/EvidenceCard.tsx` - Needs redesign for better information architecture
- `src/context/GameContext.tsx` - State management for active hypotheses

### GitHub Inspiration
- [Fungeey/detectiveboard](https://github.com/Fungeey/detectiveboard) - Evidence board connecting sticky notes/images
- [stefankober/detective-board](https://github.com/stefankober/detective-board) - Minimalist detective board UI

### Animation Patterns
- [Motion.dev React animations](https://motion.dev/docs/react-animation) - Modern Framer Motion patterns
- [AnimatePresence pattern](https://blog.logrocket.com/creating-react-animations-with-motion/) - Mount/unmount transitions for unlocks
- [Layout animations](https://motion.dev/docs/react-transitions) - Smooth layout shifts

## DOCUMENTATION:

- [Motion (Framer Motion)](https://motion.dev/docs/react-animation) - React animation library (v11+)
- [Game Flow & Pacing](https://machinations.io/articles/game-systems-feedback-loops-and-how-they-help-craft-player-experiences) - Feedback loop design
- [Player Engagement Mechanics](https://www.cgspectrum.com/blog/game-design-principles-player-engagement) - Flow state principles
- [Game UI Database](https://www.gameuidatabase.com/) - UI pattern reference
- [Accessibility: prefers-reduced-motion](https://motion.dev/docs/react-transitions) - Respect user preferences

## OTHER CONSIDERATIONS:

### Critical UX Issues (from user testing)
- Game flow feels broken and incoherent
- Too easy and direct (no strategic depth)
- No way to adjust investigation direction
- Unlock moments don't create impact
- Contradictions hidden or not integrated
- IP economy doesn't create tension
- Metrics don't feel meaningful

### Design Philosophy (GAME_DESIGN.md)
- Realism over contrivance
- Multiple paths to truth
- Failure teaches
- Complexity scaffolds gradually
- Mature without gratuitous

### Performance
- Use transform/opacity for animations (not layout properties)
- Respect `prefers-reduced-motion`
- Keep animations 150-250ms for micro-interactions, 250-400ms for phase transitions
- Install Framer Motion: `npm install framer-motion`

### Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation for hypothesis selection
- ARIA labels for locked hypotheses
- Focus management during phase transitions
- Screen reader announcements for unlocks/contradictions

### Integration Points
- `useUnlockNotifications` hook may need debugging
- Contradiction detection exists but may not be visible
- Unlock toast exists but may not trigger
- Case review metrics exist but need better presentation

### Out of Scope (Future Milestones)
- Tutorial/onboarding system
- Multi-case progression
- Advanced analytics dashboard
- Mobile responsive design (desktop-first for now)
