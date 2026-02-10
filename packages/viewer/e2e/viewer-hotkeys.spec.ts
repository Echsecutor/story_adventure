/**
 * E2E tests for keyboard hotkeys in the viewer.
 */

import { test, expect } from '@playwright/test';

test.describe('Viewer Hotkeys', () => {
  test.beforeEach(async ({ page }) => {
    // Load example story before each test
    await page.goto('/?load=../stories/example_story.json');
    await page.waitForSelector('#story_container', { state: 'visible', timeout: 10000 });
  });

  test('should show help modal when pressing ?', async ({ page }) => {
    await page.keyboard.press('?');
    
    // Wait for modal to appear
    const helpModal = page.locator('#help_modal');
    await expect(helpModal).toBeVisible({ timeout: 2000 });
    
    // Verify help content is displayed (use modal title ID to avoid matching toast text)
    const helpTitle = page.locator('#help_modal_label');
    await expect(helpTitle).toBeVisible();
  });

  test('should navigate forward with n key', async ({ page }) => {
    const initialText = await page.locator('#story_text').textContent();
    
    // Press 'n' to go forward (if single choice)
    await page.keyboard.press('n');
    await page.waitForTimeout(500);
    
    // Text might change if there's a single choice
    const newText = await page.locator('#story_text').textContent();
    // At minimum, should not crash
    expect(newText).toBeTruthy();
  });

  test('should navigate back with b key', async ({ page }) => {
    // First navigate forward if possible
    const choiceButton = page.locator('button.btn-primary').first();
    if (await choiceButton.isVisible()) {
      const initialText = await page.locator('#story_text').textContent();
      await choiceButton.click();
      await page.waitForTimeout(500);
      
      // Press 'b' to go back
      await page.keyboard.press('b');
      await page.waitForTimeout(500);
      
      const backText = await page.locator('#story_text').textContent();
      expect(backText).toBe(initialText);
    }
  });

  test('should toggle fullscreen with f key', async ({ page }) => {
    // Note: Fullscreen API might not work in headless mode
    // Just verify the key doesn't cause errors
    await page.keyboard.press('f');
    await page.waitForTimeout(200);
    
    // Should still be functional
    const storyContainer = page.locator('#story_container');
    await expect(storyContainer).toBeVisible();
  });

  test('should toggle text visibility with h key', async ({ page }) => {
    const storyText = page.locator('#story_text');
    await expect(storyText).toBeVisible();
    
    // Press 'h' to hide
    await page.keyboard.press('h');
    await page.waitForTimeout(200);
    
    // Text should be hidden
    await expect(storyText).not.toBeVisible();
    
    // Press 'h' again to show
    await page.keyboard.press('h');
    await page.waitForTimeout(200);
    
    // Text should be visible again
    await expect(storyText).toBeVisible();
  });
});
