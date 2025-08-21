# Draw It, Play It, Ship It

A single-player browser-based card game where you manage development resources (Productivity Points, Technical Debt, Bugs) to complete a project in the fewest rounds possible.

## Development

This is a pnpm workspace with multiple packages:

- `@dev-cards/data` - Shared data definitions and game logic
- `@dev-cards/game` - React-based game UI
- `@dev-cards/api` - Cloudflare Worker API for leaderboard

### Setup

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run game & API in dev mode
pnpm dev

# Run tests
pnpm test
```

### Package Scripts

Each package has its own scripts that can be run individually:

```bash
# Run specific package
pnpm --filter @dev-cards/data test
pnpm --filter @dev-cards/game test
pnpm --filter @dev-cards/api test
```

## Game Rules

See [RULES.md](./RULES.md) for detailed game rules and mechanics.

## Implementation Plan

See [PLAN.md](./PLAN.md) for the complete development roadmap.
