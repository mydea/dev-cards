# Dev-Cards

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

# Run all packages in development mode
pnpm dev

# Build all packages
pnpm build

# Run tests
pnpm test
```

### Package Scripts

Each package has its own scripts that can be run individually:

```bash
# Run specific package
pnpm --filter @dev-cards/data dev
pnpm --filter @dev-cards/game dev
pnpm --filter @dev-cards/api dev
```

## Game Rules

See [RULES.md](./RULES.md) for detailed game rules and mechanics.

## Implementation Plan

See [PLAN.md](./PLAN.md) for the complete development roadmap.
