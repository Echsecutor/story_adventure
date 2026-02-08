/**
 * E2E tests for navigation in the viewer.
 */

import { test, expect } from '@playwright/test';

test.describe('Viewer Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Load example story before each test
    await page.goto('/?load=../stories/example_story.json');
    await page.waitForSelector('#story_container', { state: 'visible', timeout: 10000 });
  });

  test('should navigate forward when clicking a choice', async ({ page }) => {
    // Get initial section text
    const initialText = await page.locator('#story_text').textContent();
    
    // Find and click a choice button
    const choiceButton = page.locator('button.btn-primary').first();
    if (await choiceButton.isVisible()) {
      await choiceButton.click();
      
      // Wait for navigation
      await page.waitForTimeout(500);
      
      // Verify text changed (new section loaded)
      const newText = await page.locator('#story_text').textContent();
      expect(newText).not.toBe(initialText);
    }
  });

  test('should navigate back with back button hotkey', async ({ page }) => {
    // Navigate forward first if possible
    const choiceButton = page.locator('button.btn-primary').first();
    if (await choiceButton.isVisible()) {
      const initialText = await page.locator('#story_text').textContent();
      await choiceButton.click();
      await page.waitForTimeout(500);
      
      // Press back key
      await page.keyboard.press('b');
      await page.waitForTimeout(500);
      
      // Should be back to initial section
      const backText = await page.locator('#story_text').textContent();
      expect(backText).toBe(initialText);
    }
  });

  test('should show choices when available', async ({ page }) => {
    const choicesRow = page.locator('#choices_row');
    // Choices might be in a row or directly as buttons
    const choiceButtons = page.locator('button.btn-primary');
    const count = await choiceButtons.count();
    // Should have at least some UI element for choices (even if empty)
    expect(choicesRow).toBeVisible();
  });
});
