- [x] Inspect current background component and confirm it is the only background entry point
- [x] Update `frontend/src/components/BackgroundEffects.js` to add layered deep-space atmosphere behind UI (nebula haze, distant starfield, twinkling stars, dying supernova remnants, rare shooting stars)

- [ ] Ensure GPU-accelerated animations (CSS transforms + Framer Motion / canvas approach) and no layout shifts
- [ ] Respect `prefers-reduced-motion`
- [ ] Verify layer order stays: existing base layer unchanged; new layers are added behind everything within BackgroundEffects
- [ ] Run frontend dev/build command to ensure no runtime errors
