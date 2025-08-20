# Draw It, Play It, Ship It - Implementation Plan

## Project Overview

Draw It, Play It, Ship It is a single-player browser-based card game where players manage development resources (Productivity Points, Technical Debt, Bugs) to complete a project. The goal is to reach 100% progress with no bugs in the fewest rounds possible.

## Architecture

### Workspace Structure

```
dev-cards/
├── packages/
│   ├── data/           # @dev-cards/data - Shared data definitions
│   ├── game/           # @dev-cards/game - React SPA game
│   └── api/            # @dev-cards/api - Cloudflare Worker API
├── package.json        # Root workspace config
├── pnpm-workspace.yaml
└── README.md
```

### Technology Stack

**Frontend (@dev-cards/game):**

- React 18 with TypeScript
- Vite for build tooling
- CSS Modules for styling
- Framer Motion for card animations
- Zustand for state management
- React Spring for physics-based animations

**Data Layer (@dev-cards/data):**

- TypeScript definitions for game entities
- Card definitions and effects
- Game logic and rules engine
- Asset management (images, icons)

**API (@dev-cards/api):**

- Cloudflare Workers
- Cloudflare D1 database
- Hono.js for routing
- TypeScript

**Deployment:**

- Cloudflare Pages for frontend
- Cloudflare Workers for API
- Cloudflare D1 for database

## Implementation Phases

### Phase 1: Project Setup & Data Layer

**Objectives:**

- Set up pnpm workspace
- Create shared data package
- Define type system and game entities

**Tasks:**

1. Initialize pnpm workspace with proper configuration
2. Create `@dev-cards/data` package
3. Define TypeScript interfaces for:
   - Card structure (ID, title, image, quote, cost, effects, requirements)
   - Game state (progress, bugs, TD, PP, round counter)
   - Player actions and game events
   - Card effects and requirements enums
4. Create initial card deck data
5. Implement game rules engine:
   - Card validation logic
   - Effect application system
   - Win/lose condition checking
   - Round progression logic
6. Add unit tests for core game logic

**Deliverables:**

- Working `@dev-cards/data` package
- Complete type definitions
- Game rules engine with tests
- Initial set of 20-30 cards

### Phase 2: Core Game Engine

**Objectives:**

- Implement game state management
- Create game loop and turn mechanics
- Build card effect system

**Tasks:**

1. Create game state manager using Zustand
2. Implement core game mechanics:
   - Deck shuffling and card drawing
   - Hand management
   - Resource tracking (PP, TD, bugs, progress)
   - Round progression
3. Build card effect resolution system
4. Implement game event system for animations/UI updates
5. Create comprehensive test suite

**Deliverables:**

- Functional game engine
- State management system
- Complete card effect implementation
- Game persistence

### Phase 3: UI Foundation & Card Components

**Objectives:**

- Create React app structure
- Build basic UI components
- Implement card rendering system

**Tasks:**

1. Set up `@dev-cards/game` React application
2. Create UI component library:
   - Card component with all visual elements
   - Game board layout
   - Resource displays (PP, TD, bugs, progress)
   - Hand and pile visualizations
3. Implement responsive design
4. Create theme system for consistent styling
5. Add accessibility features

**Deliverables:**

- React application structure
- Complete card component
- Basic game UI layout
- Responsive design

### Phase 4: Card Animations & Interactions

**Objectives:**

- Implement realistic card animations
- Create engaging user interactions
- Polish visual feedback

**Tasks:**

1. Implement card animations using Framer Motion:
   - Card drawing from deck
   - Card flip animations
   - Drag and drop for playing cards
   - Card movement between piles
   - Hover and selection effects
2. Create smooth transitions for game state changes
3. Add visual feedback for:
   - Playable vs non-playable cards
   - Resource changes
   - Effect resolution
4. Implement sound effects (optional)
5. Add particle effects for special moments (winning, etc.)

**Deliverables:**

- Fully animated card system
- Polished user interactions
- Visual feedback system

### Phase 5: Game Flow & Polish

**Objectives:**

- Complete game experience
- Add menus and game flow
- Implement scoring system

**Tasks:**

1. Create game flow components:
   - Main menu
   - Game setup screen
   - In-game UI with all information displays
   - End game screen with results
2. Implement scoring calculation
3. Add game statistics tracking
4. Create tutorial/help system

**Deliverables:**

- Complete game experience
- Scoring system
- Performance optimizations

### Phase 6: API & Leaderboard

**Objectives:**

- Build Cloudflare Worker API
- Implement score submission and leaderboard
- Deploy complete system

**Tasks:**

1. Set up `@dev-cards/api` Cloudflare Worker
2. Create D1 database schema:
   - Players table
   - Scores/games table
   - Leaderboard views
3. Implement API endpoints:
   - POST /scores (submit score)
   - GET /leaderboard (get top scores)
   - GET /leaderboard/player/:id (player's best scores)
4. Add authentication/anti-cheat measures
5. Implement rate limiting
6. Deploy API and database
7. Integrate frontend with API
8. Deploy frontend to Cloudflare Pages

**Deliverables:**

- Working API with database
- Leaderboard functionality
- Fully deployed application

## Technical Considerations

### Card System Architecture

- **Card Effects**: Use a command pattern for effect execution
- **Requirements**: Implement as validator functions
- **Animation Queue**: Ensure smooth visual feedback for rapid actions
- **State Immutability**: Use immutable updates for reliable state management

### Performance Optimization

- **Bundle Splitting**: Lazy load card images and animations
- **Memory Management**: Clean up animation resources
- **Caching**: Cache card data and images effectively

### Security & Anti-Cheat

- **Score Validation**: Server-side validation of submitted scores
- **Rate Limiting**: Prevent score spam
- **Game State Verification**: Basic checks for impossible scores

### Accessibility

- **Keyboard Navigation**: Full game playable with keyboard
- **Screen Reader Support**: Proper ARIA labels and descriptions
- **Color Accessibility**: High contrast and colorblind-friendly design
- **Reduced Motion**: Respect user motion preferences

## File Structure Details

### @dev-cards/data

```
packages/data/
├── src/
│   ├── types/
│   │   ├── card.ts
│   │   ├── game-state.ts
│   │   └── effects.ts
│   ├── cards/
│   │   ├── index.ts
│   │   └── deck.ts
│   ├── rules/
│   │   ├── game-engine.ts
│   │   ├── validators.ts
│   │   └── effects.ts
│   └── assets/
│       └── images/
│           ├── icons/     # General reusable icons (SVG format)
│           └── cards/     # Card images (.jpg, 800x640px, 5:4 aspect ratio)
├── package.json
└── README.md
```

### @dev-cards/game

```
packages/game/
├── src/
│   ├── components/
│   │   ├── Card/
│   │   ├── GameBoard/
│   │   ├── Hand/
│   │   └── UI/
│   ├── hooks/
│   ├── store/
│   ├── utils/
│   ├── styles/
│   └── App.tsx
├── public/
├── package.json
└── README.md
```

### @dev-cards/api

```
packages/api/
├── src/
│   ├── routes/
│   ├── db/
│   ├── middleware/
│   └── index.ts
├── migrations/
├── wrangler.toml
└── package.json
```

## Success Metrics

- **Gameplay**: Smooth 60fps animations on modern browsers
- **Performance**: Initial load under 3 seconds
- **Accessibility**: WCAG 2.1 AA compliance
- **Cross-browser**: Support for Chrome, Firefox, Safari, Edge
- **Mobile**: Fully playable on mobile devices
- **API**: Sub-100ms response times for score submission

## Risk Mitigation

- **Animation Performance**: Progressive enhancement approach
- **Browser Compatibility**: Polyfills and feature detection
- **API Reliability**: Graceful fallbacks for offline play
- **Score Integrity**: Multiple validation layers

This plan provides a comprehensive roadmap for building a polished, engaging card game while maintaining good software engineering practices and user experience standards.

// TODO:

- Get rid of inline styles
- Responsive styling of cards ??
- Only start timer when first card is played
