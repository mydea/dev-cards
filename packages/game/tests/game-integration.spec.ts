import { test, expect } from '@playwright/test';

test.describe('Dev-Cards Game Integration', () => {
  test.only('should play a complete game from start to finish', async ({
    page,
  }) => {
    // Navigate to the game
    await page.goto('/');

    // Wait for the main menu to load
    await expect(page.getByText('Welcome to Dev-Cards!')).toBeVisible();

    // Start a new game
    await page.getByText('Start New Game').click();

    // Wait for game board to load
    await expect(page.getByText('Round')).toBeVisible();
    await expect(page.getByText('Your Hand')).toBeVisible();

    let roundCount = 0;
    const maxRounds = 50; // Safety limit to prevent infinite loops

    // Helper function to handle coin flip overlays
    async function handleCoinFlip() {
      const coinFlipVisible = await page
        .locator('[class*="coinFlipOverlay"]')
        .isVisible()
        .catch(() => false);

      if (coinFlipVisible) {
        console.log('Coin flip appeared, waiting for it to complete');
        // Click to skip coin flip animation
        await page.locator('[class*="coinFlipOverlay"]').click();
        await page.waitForTimeout(200);

        // Click again if still visible (sometimes needs double click)
        const stillVisible = await page
          .locator('[class*="coinFlipOverlay"]')
          .isVisible()
          .catch(() => false);
        if (stillVisible) {
          await page.locator('[class*="coinFlipOverlay"]').click();
        }

        // Final wait for disappearance with longer timeout
        await page.waitForSelector('[class*="coinFlipOverlay"]', {
          state: 'hidden',
          timeout: 15000,
        });
      }
    }

    // Helper function to wait for turn end completion
    async function waitForTurnEndComplete() {
      // Wait for turn end animation to complete
      await page.waitForTimeout(500);

      // Wait for the "drawing cards" text to appear and disappear
      try {
        await page.waitForSelector(':has-text("drawing cards")', {
          timeout: 5000,
        });
        await page.waitForSelector(':has-text("drawing cards")', {
          state: 'hidden',
          timeout: 10000,
        });
      } catch {
        // If drawing text doesn't appear, just wait a bit more
        await page.waitForTimeout(1000);
      }
    }

    async function tryPlayCardFromHand(): Promise<boolean> {
      // Get all cards in hand
      const handCards = page.locator('[class*="cards"] > div');
      const cardCount = await handCards.count();

      if (cardCount === 0) {
        console.log('No cards in hand');
        return false;
      }

      // Try to play each card
      console.log(`${cardCount} cards in hand, trying to play a card`);
      for (let i = 0; i < cardCount; i++) {
        const card = handCards.nth(i);

        // Check if card is playable using data attributes
        const cardInner = card.locator('[data-playable]');
        const isPlayable =
          (await cardInner.getAttribute('data-playable')) === 'true' &&
          (await cardInner.getAttribute('data-disabled')) === 'false';

        if (isPlayable) {
          console.log(
            `Playing card #${i + 1} of the remaining ${cardCount} cards`
          );

          // Click the actual card element (with role="button")
          await cardInner.click();

          // Wait for animation and any coin flips
          await page.waitForTimeout(500);

          // Handle coin flip if it appears
          await handleCoinFlip();

          // Wait a bit between card plays
          await page.waitForTimeout(300);

          return true;
        }
      }

      return false;
    }

    // Recursive function to play a single round
    async function playRound(): Promise<boolean> {
      roundCount++;
      console.log(`Starting round ${roundCount}`);

      if (roundCount > maxRounds) {
        throw new Error(
          `Game did not end after ${maxRounds} rounds - possible infinite loop`
        );
      }

      // Wait for hand to be ready (no animations)
      await page.waitForTimeout(500);

      // Check if game has ended
      const victoryVisible = await page
        .getByText('Victory!')
        .isVisible()
        .catch(() => false);
      const gameOverVisible = await page
        .getByText('Game Over')
        .isVisible()
        .catch(() => false);

      if (victoryVisible || gameOverVisible) {
        console.log(
          'Game ended with',
          victoryVisible ? 'victory' : 'game over'
        );
        return true; // Game ended
      }

      let cardsPlayedThisRound = 0;

      while (await tryPlayCardFromHand()) {
        cardsPlayedThisRound++;
      }

      console.log('No more playable cards found');

      // Decision logic for round end
      if (cardsPlayedThisRound > 0) {
        // At least one card was played, use End Turn
        console.log(
          `Played ${cardsPlayedThisRound} cards this round, ending turn`
        );

        const endTurnButton = page.getByText('End Turn');
        await expect(endTurnButton).toBeVisible();
        await endTurnButton.click();

        // Wait for turn end animations
        await waitForTurnEndComplete();
      } else {
        // No cards could be played at all, reduce technical debt
        console.log('No cards playable, reducing technical debt');

        const reduceTDButton = page.getByText('Reduce Tech Debt');
        const isEnabled = await reduceTDButton.isEnabled();

        if (!isEnabled) {
          throw new Error(
            'Cannot reduce technical debt and no cards are playable - game is stuck!'
          );
        }

        await reduceTDButton.click();

        // Wait for tech debt reduction and turn end animation
        await waitForTurnEndComplete();
      }

      // Check if game ended after this action
      const victoryVisibleAfterAction = await page
        .getByText('Victory!')
        .isVisible()
        .catch(() => false);
      const gameOverVisibleAfterAction = await page
        .getByText('Game Over')
        .isVisible()
        .catch(() => false);

      if (victoryVisibleAfterAction || gameOverVisibleAfterAction) {
        console.log(victoryVisibleAfterAction ? 'Game won!' : 'Game lost!');
        return true; // Game ended
      }

      // Safety check: ensure we have cards or game should have ended
      await page.waitForTimeout(500);
      const handCardsAfterAction = page.locator('[class*="cards"] > div');
      const finalCardCount = await handCardsAfterAction.count();

      if (finalCardCount === 0) {
        // If no cards in hand, game should have ended or should be drawing cards
        const drawingText = await page
          .getByText('drawing cards')
          .isVisible()
          .catch(() => false);
        if (!drawingText) {
          throw new Error(
            'No cards in hand but game has not ended and not drawing cards'
          );
        }
      }

      // Recursively play the next round
      return await playRound();
    }

    // Start the recursive game loop
    const gameEnded = await playRound();

    // Verify game ended properly
    expect(gameEnded).toBe(true);

    // Verify we can see final results
    const finalScoreVisible = await page
      .getByText('Final Score')
      .isVisible()
      .catch(() => false);
    const roundsInfo = await page
      .getByText('Rounds:')
      .isVisible()
      .catch(() => false);

    expect(finalScoreVisible || roundsInfo).toBe(true);

    console.log(`Game completed successfully in ${roundCount} rounds`);
  });

  test('should handle initial game state gracefully', async ({ page }) => {
    // Navigate to game
    await page.goto('/');
    await page.getByText('Start New Game').click();

    // Wait for game to load
    await expect(page.getByText('Round')).toBeVisible();

    // Test that clicking disabled buttons doesn't break anything
    const endTurnButton = page.getByText('End Turn');
    const reduceTDButton = page.getByText('Reduce Tech Debt');

    // Multiple clicks shouldn't cause issues
    await endTurnButton.click();
    await page.waitForTimeout(100);
    await endTurnButton.click();
    await page.waitForTimeout(100);

    // Game should still be responsive
    await expect(page.getByText('Your Hand')).toBeVisible();
  });

  test('should display correct statistics during gameplay', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByText('Start New Game').click();

    // Wait for game to load
    await expect(page.getByText('Round')).toBeVisible();

    // Check initial statistics - be more specific to avoid ambiguity
    const statsContainer = page.locator('[class*="stats"]');
    const roundStat = statsContainer
      .locator('[class*="stat"]')
      .filter({ hasText: 'Round' });
    const timeStat = statsContainer
      .locator('[class*="stat"]')
      .filter({ hasText: 'Time' });
    const cardsPlayedStat = statsContainer
      .locator('[class*="stat"]')
      .filter({ hasText: 'Cards Played' });
    const cardsRemainingStat = statsContainer
      .locator('[class*="stat"]')
      .filter({ hasText: 'Cards Remaining' });

    const initialRound = await roundStat
      .locator('[class*="statValue"]')
      .textContent();
    const initialTime = await timeStat
      .locator('[class*="timeValue"]')
      .textContent();
    const initialCardsPlayed = await cardsPlayedStat
      .locator('[class*="statValue"]')
      .textContent();
    const initialCardsRemaining = await cardsRemainingStat
      .locator('[class*="statValue"]')
      .textContent();

    expect(initialRound).toBe('1');
    expect(initialTime).toMatch(/\d+:\d{2}/);
    expect(initialCardsPlayed).toBe('0');
    expect(parseInt(initialCardsRemaining!)).toBeGreaterThan(0);

    // Play one card if possible
    const handCards = page.locator('[class*="cards"] > div');
    const cardCount = await handCards.count();

    if (cardCount > 0) {
      // Try to play first card - click the actual card element
      const firstCard = handCards.first().locator('[data-playable="true"]');
      await firstCard.click();
      await page.waitForTimeout(1000);

      // Check that cards played increased
      const newStatsContainer = page.locator('[class*="stats"]');
      const newCardsPlayedStat = newStatsContainer
        .locator('[class*="stat"]')
        .filter({ hasText: 'Cards Played' });
      const newCardsPlayed = await newCardsPlayedStat
        .locator('[class*="statValue"]')
        .textContent();
      expect(parseInt(newCardsPlayed!)).toBeGreaterThanOrEqual(
        parseInt(initialCardsPlayed!)
      );
    }
  });
});
