/**
 * E2E tests for loading stories in the viewer.
 */

import { test, expect } from '@playwright/test';

const exampleStories = [
  '../stories/example_story.json',
  '../stories/test.json',
  '../stories/prinzessin.json',
  '../stories/weihnachtsmann.json',
  '../stories/Der_Weihnachtsmann/Der_Weihnachtsmann.json',
];

test.describe('Viewer Story Loading', () => {
  for (const storyPath of exampleStories) {
    test(`should load story from query param: ${storyPath}`, async ({ page }) => {
      await page.goto(`/?load=${storyPath}`);
      
      // Wait for loading spinner to disappear
      await page.waitForSelector('.spinner-border', { state: 'hidden' }).catch(() => {
        // Spinner might not appear or disappear quickly
      });

      // Wait for story container to be visible
      await page.waitForSelector('#story_container', { state: 'visible', timeout: 10000 });

      // Verify story text is displayed
      const storyText = page.locator('#story_text');
      await expect(storyText).toBeVisible({ timeout: 10000 });
      
      // Verify text content is not empty
      const textContent = await storyText.textContent();
      expect(textContent?.trim().length).toBeGreaterThan(0);
    });
  }

  test('should show menu screen initially', async ({ page }) => {
    await page.goto('/');
    
    // Should see menu container
    const menuContainer = page.locator('#menu_container');
    await expect(menuContainer).toBeVisible();
    
    // Should see load button
    const loadButton = page.getByText('Load a Story Adventure');
    await expect(loadButton).toBeVisible();
  });
});
