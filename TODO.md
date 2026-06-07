# TODO - Plinko Lab full-stack implementation

- [x] Fix backend server route mounting bug in `be/server.js` (verify router variable name).

- [ ] Define Prisma `Round` model in `be/prisma/schema.prisma` with all required fields.

- [ ] Add Prisma client singleton for Node (e.g., `be/src/prisma/prismaClient.js`) and wire into controllers.
- [ ] Implement `SHA256` service (`be/src/services/hash.service.js`).
- [ ] Implement `xorshift32` PRNG service (`be/src/services/prng.service.js`).
- [ ] Implement deterministic Plinko engine (`be/src/services/plinko.service.js`) per spec:
  - pegMap generation + pegMapHash
  - combinedSeed generation
  - drop path generation
  - payout multiplier lookup
  - pathJson storage
- [ ] Implement backend controllers:
  - `be/src/controllers/rounds.controller.js`: commit/start/reveal + get/getRecent
  - `be/src/controllers/verify.controller.js`: verifier recomputation and Verified/Failed
- [ ] Ensure routes wire correctly:
  - `be/src/routes/rounds.routes.js`
  - `be/src/routes/verify.routes.js`
- [ ] Add strict input validation and consistent error handling across all endpoints.
- [ ] Update backend `be/package.json` scripts for Vitest + add initial Vitest config.
- [ ] Add Vitest tests for SHA256, xorshift32, deterministic replay, and verifier correctness.
- [ ] Frontend: build Next.js pages/components:
  - Main Plinko Lab page with controls (clientSeed, bet amount, dropColumn), mute, drop animation
  - Verifier page
  - Recent rounds page
- [ ] Frontend animations & accessibility:
  - Framer Motion ball through deterministic positions
  - bin pulse + confetti
  - keyboard support (arrows/space)
  - reduced motion handling
- [ ] Connect FE to BE routes (commit/start/reveal + fetch recent + verifier recompute).
