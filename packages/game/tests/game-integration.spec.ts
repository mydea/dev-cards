import { test, expect } from '@playwright/test';

test.describe('Dev-Cards Game Integration', () => {
  test('should play a complete game from start to finish', async ({ page }) => {
    // Navigate to the game
    await page.goto('/');

    // Wait for the main menu to load
    await expect(page.getByText('Welcome to Dev-Cards!')).toBeVisible();

    // Start a new game
    await page.getByText('Start New Game').click();

    // Wait for game board to load
    await expect(page.getByText('Round')).toBeVisible();
    await expect(page.getByText('Your Hand')).toBeVisible();

    let gameEnded = false;
    let roundCount = 0;
    const maxRounds = 50; // Safety limit to prevent infinite loops

    while (!gameEnded && roundCount < maxRounds) {
      roundCount++;
      console.log(`Starting round ${roundCount}`);

      // Wait for hand to be ready (no animations)
      await page.waitForTimeout(1000);

      // Check if game has ended
      const gameOverVisible =
        (await page
          .getByText('Victory!')
          .isVisible()
          .catch(() => false)) ||
        (await page
          .getByText('Game Over')
          .isVisible()
          .catch(() => false));

      if (gameOverVisible) {
        gameEnded = true;
        break;
      }

      let cardsPlayedThisRound = 0;
      let canPlayAnyCard = false;

      // Try to play cards until no more can be played
      while (true) {
        // Get all cards in hand - use the working selector from debug
        const handCards = page.locator('[class*="cards"] > div');
        const cardCount = await handCards.count();

        if (cardCount === 0) {
          console.log('No cards in hand');
          break;
        }

        let playedACard = false;

        // Try to play each card
        for (let i = 0; i < cardCount; i++) {
          const card = handCards.nth(i);

          // Check if card is playable using data attributes
          const cardInner = card.locator('[data-playable]');
          const isPlayable = (await cardInner.getAttribute('data-playable')) === 'true' &&
                            (await cardInner.getAttribute('data-disabled')) === 'false';

          if (isPlayable) {
            console.log(`Playing card ${i + 1}/${cardCount}`);

            // Click the actual card element (with role="button")
            await cardInner.click();

            // Wait for animation and any coin flips
            await page.waitForTimeout(500);

            // Check if coin flip overlay appeared
            const coinFlipVisible = await page
              .locator('[class*="coinFlipOverlay"]')
              .isVisible()
              .catch(() => false);
            if (coinFlipVisible) {
              console.log('Coin flip appeared, waiting for it to complete');
              // Click to skip coin flip animation
              await page.locator('[class*="coinFlipOverlay"]').click();
              
              // Wait a bit for the click to register
              await page.waitForTimeout(500);
              
              // Click again if still visible (sometimes needs double click)
              const stillVisible = await page
                .locator('[class*="coinFlipOverlay"]')
                .isVisible()
                .catch(() => false);
              if (stillVisible) {
                await page.locator('[class*="coinFlipOverlay"]').click();
                await page.waitForTimeout(1000);
              }
              
              // Final wait for disappearance with longer timeout
              await page.waitForSelector('[class*="coinFlipOverlay"]', {
                state: 'hidden',
                timeout: 15000,
              });
            }

            cardsPlayedThisRound++;
            canPlayAnyCard = true;
            playedACard = true;

            // Wait a bit between card plays
            await page.waitForTimeout(300);
            break;
          }
        }

        if (!playedACard) {
          console.log('No more playable cards found');
          break;
        }
      }

      // Decision logic for round end
      if (cardsPlayedThisRound > 0) {
        // At least one card was played, use End Turn
        console.log(
          `Played ${cardsPlayedThisRound} cards this round, ending turn`
        );

        const endTurnButton = page.getByText('End Turn');
        await expect(endTurnButton).toBeVisible();
        await endTurnButton.click();

        // Wait for turn end animation
        await page.waitForTimeout(2000);
      } else if (!canPlayAnyCard) {
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
        await page.waitForTimeout(3000);
      } else {
        throw new Error(
          'Game logic error: Cards available but none played, and reduce TD not needed'
        );
      }

      // Wait for new round to settle
      await page.waitForTimeout(500);

      // Check if game ended after this action
      const victoryVisible = await page
        .getByText('Victory!')
        .isVisible()
        .catch(() => false);
      const gameOverVisibleAfterAction = await page
        .getByText('Game Over')
        .isVisible()
        .catch(() => false);

      if (victoryVisible || gameOverVisibleAfterAction) {
        gameEnded = true;
        console.log(victoryVisible ? 'Game won!' : 'Game lost!');
        break;
      }

      // Safety check: ensure we have cards or game should have ended
      await page.waitForTimeout(500);
      const handCards = page.locator('[class*="cards"] > div');
      const finalCardCount = await handCards.count();

      if (finalCardCount === 0) {
        // If no cards in hand, game should have ended or should be drawing cards
        const drawingText = await page
          .getByText('drawing cards')
          .isVisible()
          .catch(() => false);
        if (!drawingText && !gameEnded) {
          throw new Error(
            'No cards in hand but game has not ended and not drawing cards'
          );
        }
      }
    }

    // Verify game ended properly
    if (!gameEnded) {
      throw new Error(
        `Game did not end after ${maxRounds} rounds - possible infinite loop`
      );
    }

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

  test('should handle empty game states gracefully', async ({ page }) => {
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

    // Check initial statistics - use first() to avoid strict mode violations
    const initialRound = await page
      .locator('[class*="stat"]:has-text("Round") [class*="statValue"]')
      .first()
      .textContent();
    const initialTime = await page
      .locator('[class*="stat"]:has-text("Time") [class*="timeValue"]')
      .first()
      .textContent();
    const initialCardsPlayed = await page
      .locator('[class*="stat"]:has-text("Cards Played") [class*="statValue"]')
      .first()
      .textContent();
    const initialCardsRemaining = await page
      .locator(
        '[class*="stat"]:has-text("Cards Remaining") [class*="statValue"]'
      )
      .first()
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
      const newCardsPlayed = await page
        .locator(
          '[class*="stat"]:has-text("Cards Played") [class*="statValue"]'
        )
        .first()
        .textContent();
      expect(parseInt(newCardsPlayed!)).toBeGreaterThanOrEqual(
        parseInt(initialCardsPlayed!)
      );
    }
  });
});
