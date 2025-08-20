# Rules of Draw It, Play It, Ship It

Draw It, Play It, Ship It is a single-player card game that can be played in the browser.

## Goal

The goal of the game is to complete your project in as little rounds as possible. The number of rounds is counted and acts as the final indicator of success, the fewer rounds you needed to finish your project the better.

As soon as all win-conditions are met, you have immediately won:

- Reach 100/100 progress
- Have no bugs

## Terms

- Deck: The full deck of cards that you start the game with. This is pre-defined for the player.
- Draw pile: A shuffled series of face-down cards that represents cards that you have not played yet.
- Discard pile: A face-down pile of cards that have been discarded because they have not been played yet.
- Graveyard: A face-down pile of cards that have been played from your hand. Cards in the graveyard can never return to play.
- Progress (%): A step towards completing your project. It is the main goal of the game to collect 100% progress.
- Bug (🐛): A problem in your code that you must fix. You cannot win the game while you have unfixed bugs.
- Fixing a bug: Removing a single bug.
- Productivity Point (PP): Represents your ability to ship progress. This is the primary resource that is needed to play cards.
- Techncial Debt (TD): Every point of TD you collect reduces the PP you get at the beginning of your following rounds.

## Rules

### Game Setup

You start with the following initial setup:

- 0/100 Progress (%)
- 0 bugs (🐛)
- 0 technical debt (TD)
- A shuffled deck of pre-defined cards

### Cards

Each card has the following properties:

- An internal, unique ID (for internal reference purposes)
- A card title at the top of the card
- An image below the title
- A short, snappy quote or comment at the very bottom of the card (this has no effect on the game and is just for fun)
- A productivity cost between 0 and 20 in the top right corner
- An effect below the image
  - See below for possible effects

### Card Effects

Card effects can be a combination of AND and OR of the following list. X can either be a fixed number, or can be determined by a coin flip.

- Add X%
- Add/remove X 🐛
- Add/remove X TD
- Shuffle X cards from your discard pile into your deck
- Draw X cards from your card pile

Card effects can either be static (e.g. add 2%), or can be defined by a coin flip (e.g. When heads, add 2%, else remove 2%)

### Card Requirements

Most cards have requirements that have to be met/spent in order to play the card. Requirements are shown in the top right of the card.

- Spend X PP
- Discard X cards from your hand
- Send X cards to the graveyard

### How a round looks like

1. Replenish your PP to 20 MINUS your current TD.
   a. E.g. if you have 4 TD, you start each round with 16 PP
2. Play as many cards from your hand as you like & as your resources allow. You can also play no cards.
   a. You can only play cards if you can satisify _all_ requirements stated on the card.
   b. You have to apply _all_ stated effects on the card in order from top to bottom.
3. _Instead of playing any cards_, you can also discard _all_ cards from your hand and reduce your TD by 2.
4. When you are done with playing cards from your hand, discard the remaining cards from your hand and draw 5 new cards.
   a. If there are no more cards in your draw pile, shuffle the cards from your discard pile and form a new draw pile.
   b. If there are not enough cards to draw a full hand of 5 cards, you have immediately lost the game.
5. Start the next round.

### General Rules

- PP can never fall below 0.
- TD can never exceed 20.
- You can never have less than 0 cards in your hand.
- If you cannot fullfil a requirement fully, you cannot play a card.
  - e.g. if a card requires you to discard 2 cards from your hand, but you only have one remaining card on your hand, you cannot play this card.
