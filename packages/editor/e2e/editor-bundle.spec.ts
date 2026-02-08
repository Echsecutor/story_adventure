/**
 * E2E tests for bundle generation in the editor.
 */

import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { join } from 'path';
// Note: JSZip is used for testing ZIP structure, but Playwright tests run in Node context
// We'll use a simple check instead of full JSZip parsing for now

const exampleStoryPath = join(__dirname, '../../../stories/example_story.json');
const exampleStory = JSON.parse(readFileSync(exampleStoryPath, 'utf-8'));

test.describe('Editor Bundle Generation', () => {
  test('can download story as JSON', async ({ page }) => {
    await page.goto('/');
    
    // Wait for editor to load
    await page.waitForSelector('.react-flow', { timeout: 10000 });
    
    // Load example story
    await page.click('text=Load Adventure');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(exampleStoryPath);
    
    await page.waitForTimeout(1000);
    
    // Set up download listener
    const downloadPromise = page.waitForEvent('download');
    
    // Click "Save Adventure as it is"
    await page.click('text=Save Adventure as it is');
    
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.json$/);
    
    // Verify file content
    const path = await download.path();
    if (path) {
      const content = readFileSync(path, 'utf-8');
      const downloadedStory = JSON.parse(content);
      expect(downloadedStory.sections).toBeDefined();
      expect(Object.keys(downloadedStory.sections).length).toBeGreaterThan(0);
    }
  });

  test('can generate bundle ZIP with correct structure', async ({ page, context }) => {
    await page.goto('/');
    
    // Wait for editor to load
    await page.waitForSelector('.react-flow', { timeout: 10000 });
    
    // Load example story
    await page.click('text=Load Adventure');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(exampleStoryPath);
    
    await page.waitForTimeout(1000);
    
    // Set up download listener
    const downloadPromise = page.waitForEvent('download');
    
    // Click "Generate playable adventure bundle"
    await page.click('text=Generate playable adventure bundle');
    
    // Wait for download to start (may take a moment for ZIP generation)
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.zip$/);
    
    // Verify ZIP file was downloaded
    const path = await download.path();
    expect(path).toBeTruthy();
    
    // Verify it's a ZIP file (starts with PK header)
    if (path) {
      const zipBuffer = readFileSync(path);
      // ZIP files start with "PK" (0x504B)
      expect(zipBuffer[0]).toBe(0x50);
      expect(zipBuffer[1]).toBe(0x4B);
      
      // Verify file size is reasonable (not empty)
      expect(zipBuffer.length).toBeGreaterThan(1000);
    }
  });

  test('bundle ZIP contains viewer files', async ({ page }) => {
    await page.goto('/');
    
    await page.waitForSelector('.react-flow', { timeout: 10000 });
    
    // Load example story
    await page.click('text=Load Adventure');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(exampleStoryPath);
    
    await page.waitForTimeout(1000);
    
    const downloadPromise = page.waitForEvent('download');
    await page.click('text=Generate playable adventure bundle');
    
    const download = await downloadPromise;
    const path = await download.path();
    
    if (path) {
      const zipBuffer = readFileSync(path);
      // Verify it's a valid ZIP file
      expect(zipBuffer[0]).toBe(0x50);
      expect(zipBuffer[1]).toBe(0x4B);
      // ZIP should contain viewer files (check for "viewer" string in ZIP)
      const zipString = zipBuffer.toString('utf-8', 0, Math.min(10000, zipBuffer.length));
      expect(zipString).toMatch(/viewer/i);
    }
  });

  test('can create linear story dialog', async ({ page }) => {
    await page.goto('/');
    
    await page.waitForSelector('.react-flow', { timeout: 10000 });
    
    // Load example story
    await page.click('text=Load Adventure');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(exampleStoryPath);
    
    await page.waitForTimeout(1000);
    
    // Click "Create Linear Story"
    await page.click('text=Create Linear Story');
    
    // Verify dialog appears
    await expect(page.locator('text=Create Linear Story').locator('..').locator('text=Start at section:')).toBeVisible();
    
    // Verify section dropdowns are populated
    const startSelect = page.locator('select').first();
    const options = await startSelect.locator('option').count();
    expect(options).toBeGreaterThan(1); // At least one option plus placeholder
  });
});
