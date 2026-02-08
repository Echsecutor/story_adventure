/**
 * E2E tests for toast notifications in the editor.
 */

import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const exampleStoryPath = join(__dirname, '../../../stories/example_story.json');

test.describe('Editor Toast System', () => {
  test('shows success toast when loading a story', async ({ page }) => {
    await page.goto('/');
    
    await page.waitForSelector('.react-flow', { timeout: 10000 });
    
    // Load example story
    await page.click('text=Load Adventure');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(exampleStoryPath);
    
    // Wait for toast to appear
    await page.waitForSelector('.toast', { timeout: 5000 });
    
    // Verify toast contains success message
    const toast = page.locator('.toast').first();
    await expect(toast).toBeVisible();
    
    const toastText = await toast.textContent();
    expect(toastText).toContain('Story loaded');
  });

  test('shows only one toast when loading a story (no infinite loop)', async ({ page }) => {
    await page.goto('/');
    
    await page.waitForSelector('.react-flow', { timeout: 10000 });
    
    // Load example story
    await page.click('text=Load Adventure');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(exampleStoryPath);
    
    // Wait for toast to appear
    await page.waitForSelector('.toast', { timeout: 5000 });
    
    // Wait a bit to ensure no additional toasts appear
    await page.waitForTimeout(2000);
    
    // Count visible toasts - should be exactly 1
    const toastCount = await page.locator('.toast').count();
    expect(toastCount).toBe(1);
  });

  test('does not create infinite loop on initial page load', async ({ page, context }) => {
    // First, save a story to IndexedDB by loading one
    await page.goto('/');
    await page.waitForSelector('.react-flow', { timeout: 10000 });
    
    // Load and save example story
    await page.click('text=Load Adventure');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(exampleStoryPath);
    await page.waitForTimeout(1000);
    
    // Auto-save should happen, wait a bit
    await page.waitForTimeout(2000);
    
    // Now reload the page to trigger initial load from IndexedDB
    await page.reload();
    await page.waitForSelector('.react-flow', { timeout: 10000 });
    
    // Wait for potential toast (if story was saved)
    // The toast might or might not appear depending on auto-save timing
    await page.waitForTimeout(3000);
    
    // Count visible toasts - should be 0 or 1, not multiple
    const toastCount = await page.locator('.toast').count();
    expect(toastCount).toBeLessThanOrEqual(1);
  });

  test('toast auto-dismisses after timeout', async ({ page }) => {
    await page.goto('/');
    
    await page.waitForSelector('.react-flow', { timeout: 10000 });
    
    // Trigger a toast by adding a section
    await page.click('text=Add Section');
    
    // Wait for toast to appear
    await page.waitForSelector('.toast', { timeout: 5000 });
    const toast = page.locator('.toast').first();
    await expect(toast).toBeVisible();
    
    // Wait for auto-dismiss (5 seconds + buffer)
    await page.waitForTimeout(6000);
    
    // Toast should be gone
    await expect(toast).not.toBeVisible();
  });

  test('shows success toast when adding a section', async ({ page }) => {
    await page.goto('/');
    
    await page.waitForSelector('.react-flow', { timeout: 10000 });
    
    // Click Add Section
    await page.click('text=Add Section');
    
    // Wait for toast to appear
    await page.waitForSelector('.toast', { timeout: 5000 });
    
    // Verify toast contains success message
    const toast = page.locator('.toast').first();
    await expect(toast).toBeVisible();
    
    const toastText = await toast.textContent();
    expect(toastText).toMatch(/Added section \d+/);
  });

  test('shows success toast when deleting a section', async ({ page }) => {
    await page.goto('/');
    
    await page.waitForSelector('.react-flow', { timeout: 10000 });
    
    // Load example story
    await page.click('text=Load Adventure');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(exampleStoryPath);
    await page.waitForTimeout(1000);
    
    // Clear any existing toasts by waiting
    await page.waitForTimeout(6000);
    
    // Click first node
    const firstNode = page.locator('.section-node').first();
    await firstNode.click();
    
    // Wait for panel and delete button
    await page.waitForSelector('button:has-text("Delete")', { timeout: 5000 });
    
    // Click Delete
    await page.click('button:has-text("Delete")');
    
    // Wait for toast to appear
    await page.waitForSelector('.toast', { timeout: 5000 });
    
    // Verify toast contains success message
    const toast = page.locator('.toast').first();
    await expect(toast).toBeVisible();
    
    const toastText = await toast.textContent();
    expect(toastText).toContain('Section deleted');
  });

  test('shows multiple distinct toasts for multiple actions', async ({ page }) => {
    await page.goto('/');
    
    await page.waitForSelector('.react-flow', { timeout: 10000 });
    
    // Perform multiple actions quickly
    await page.click('text=Add Section');
    await page.waitForTimeout(500);
    await page.click('text=Add Section');
    
    // Wait for toasts to appear
    await page.waitForTimeout(1000);
    
    // Should have 2 toasts visible
    const toastCount = await page.locator('.toast').count();
    expect(toastCount).toBe(2);
  });
});
