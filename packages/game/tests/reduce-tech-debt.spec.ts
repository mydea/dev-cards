import { test, expect } from '@playwright/test';

test.describe('Reduce Tech Debt Button', () => {
  test('should be disabled after playing any cards in the round', async ({
    page,
  }) => {
    // Navigate to the game
    await page.goto('http://localhost:3000');

    // Start a new game
    await page.getByRole('button', { name: 'Start New Game' }).click();

    // Wait for the game to load
    await expect(page.locator('[data-testid="game-board"]')).toBeVisible();

    // Step 2: Verify "Reduce Tech Debt" is not disabled initially
    const reduceDebtButton = page.getByRole('button', {
      name: /Reduce Tech Debt/i,
    });
    await expect(reduceDebtButton).toBeVisible();
    await expect(reduceDebtButton).not.toBeDisabled();

    // Step 3: Play the first card from hand
    const firstCard = page.getByRole('button').filter({ hasText: /PP/ }).first();
    await expect(firstCard).toBeVisible();
    await firstCard.click();

    // Wait for any animations or state updates to complete
    await page.waitForTimeout(1000);

    // Step 4: Verify the "Reduce Tech Debt" button is now disabled
    await expect(reduceDebtButton).toBeDisabled();

    // Verify the tooltip shows the correct message
    await reduceDebtButton.hover();
    await expect(
      page.locator(
        'text=Cannot reduce TD: You must not have played any cards this round'
      )
    ).toBeVisible();

     // End the turn
     const endTurnButton = page.getByRole('button', { name: /End Turn/i });
     await endTurnButton.click();
 
     // Wait for turn to complete and new round to start
     await page.waitForTimeout(2000);
 
     // Verify the "Reduce Tech Debt" button is enabled again in the new round
     await expect(reduceDebtButton).not.toBeDisabled();
  });
});
