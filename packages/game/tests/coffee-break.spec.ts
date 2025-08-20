import { test, expect } from '@playwright/test';

test.describe('Coffee Break Card Test', () => {
  test('should correctly play Coffee Break card and verify game state', async ({
    page,
  }) => {
    // Navigate to the game
    await page.goto('/');

    // Wait for the main menu to load
    await expect(
      page.getByText('Welcome to Draw It, Play It, Ship It!')
    ).toBeVisible();

    // Start a new game
    await page.getByText('Start New Game').click();

    // Wait for game board to load
    await expect(page.getByText('Round')).toBeVisible();
    await expect(page.getByText('Your Hand')).toBeVisible();

    let foundCoffeeBreak = false;
    let roundCount = 0;
    const maxRounds = 20; // Safety limit

    while (!foundCoffeeBreak && roundCount < maxRounds) {
      roundCount++;
      console.log(`Looking for Coffee Break in round ${roundCount}`);

      // Wait for hand to be ready
      await page.waitForTimeout(1000);

      // Get all cards in hand
      const handCards = page.locator('[class*="cards"] > div');
      const cardCount = await handCards.count();

      console.log(`${cardCount} cards in hand`);

      // Look for Coffee Break card
      for (let i = 0; i < cardCount; i++) {
        const card = handCards.nth(i);
        const cardTitle = await card
          .locator('[class*="cardTitle"]')
          .textContent();

        if (cardTitle === 'Coffee Break') {
          console.log(`Found Coffee Break card at position ${i + 1}`);
          foundCoffeeBreak = true;

          // Verify card is playable
          const cardInner = card.locator('[data-playable]');
          const isPlayable =
            (await cardInner.getAttribute('data-playable')) === 'true' &&
            (await cardInner.getAttribute('data-disabled')) === 'false';

          expect(isPlayable).toBe(true);

          // Play the Coffee Break card
          console.log('Playing Coffee Break card...');
          await cardInner.click();

          // Wait for card animation and effects to complete
          await page.waitForTimeout(2000);

          // Verify final state
          const finalStats = await getGameStats(page);
          console.log('finalStats', finalStats);

          // Expected state after Coffee Break:
          // - Progress: 0 (no progress effect)
          // - Bugs: 0 (no bug effect)
          // - Tech Debt: 0 (no TD effect)
          // - Productivity: 19 (20 - 1 PP cost)
          // - Cards in hand: 7 (4 remaining + 3 drawn)
          // - Cards in graveyard: 1 (Coffee Break card)
          // - Cards in discard: 0 (no cards discarded)

          expect(finalStats.progress).toBe('0');
          expect(finalStats.bugs).toBe('0');
          expect(finalStats.techDebt).toBe('0');
          expect(finalStats.productivity).toBe('19');
          expect(finalStats.cardsInHand).toBe('7');
          expect(finalStats.cardsPlayed).toBe('1'); // This tracks graveyard
          expect(finalStats.cardsRemaining).toBe('29'); // 30 total - 1 in graveyard

          return; // Exit the test successfully
        }
      }

      if (!foundCoffeeBreak) {
        // Coffee Break not found, end turn to get new cards
        console.log('Coffee Break not found, ending turn...');

        const endTurnButton = page.getByText('End Turn');
        await expect(endTurnButton).toBeVisible();
        await endTurnButton.click();

        // Wait for turn end animation
        await page.waitForTimeout(3000);

        // Wait for "drawing cards" animation to complete
        try {
          await page.waitForSelector(':has-text("drawing cards")', {
            timeout: 5000,
          });
          await page.waitForSelector(':has-text("drawing cards")', {
            state: 'hidden',
            timeout: 10000,
          });
        } catch {
          // If drawing text doesn't appear, just wait
          await page.waitForTimeout(1000);
        }
      }
    }

    if (!foundCoffeeBreak) {
      throw new Error(`Coffee Break card not found after ${maxRounds} rounds`);
    }
  });

  // Helper function to extract game statistics
  async function getGameStats(page: any) {
    const statsContainer = page.locator('[class*="stats"]');

    // Get resource values from ResourceDisplay - use more specific selectors
    const progressValue = await page
      .locator('[data-type="progress"] [class*="resourceValue"]')
      .first()
      .textContent();
    const bugsValue = await page
      .locator('[data-type="bugs"] [class*="resourceValue"]')
      .first()
      .textContent();
    const techDebtValue = await page
      .locator('[data-type="technical-debt"] [class*="resourceValue"]')
      .first()
      .textContent();
    const productivityValue = await page
      .locator('[data-type="productivity"] [class*="resourceValue"]')
      .first()
      .textContent();

    // Get stats from GameInfo
    const cardsInHand = await page.locator('[class*="cards"] > div').count();
    const cardsPlayedStat = statsContainer
      .locator('[class*="stat"]')
      .filter({ hasText: 'Cards Played' });
    const cardsRemainingstat = statsContainer
      .locator('[class*="stat"]')
      .filter({ hasText: 'Cards Remaining' });

    const cardsPlayed = await cardsPlayedStat
      .locator('[class*="statValue"]')
      .first()
      .textContent();
    const cardsRemaining = await cardsRemainingstat
      .locator('[class*="statValue"]')
      .first()
      .textContent();

    return {
      progress: progressValue?.replace('%', '') || '0',
      bugs: bugsValue || '0',
      techDebt: techDebtValue?.split('/')[0] || '0',
      productivity: productivityValue || '0',
      cardsInHand: cardsInHand.toString(),
      cardsPlayed: cardsPlayed || '0',
      cardsRemaining: cardsRemaining || '0',
    };
  }
});
