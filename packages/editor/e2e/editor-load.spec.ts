/**
 * E2E tests for loading stories in the editor.
 */

import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const exampleStoryPath = join(__dirname, '../../../stories/example_story.json');
const exampleStory = JSON.parse(readFileSync(exampleStoryPath, 'utf-8'));

test.describe('Editor Load', () => {
  test('loads example story and verifies correct node count', async ({ page }) => {
    await page.goto('/');
    
    // Wait for editor to load
    await page.waitForSelector('.react-flow', { timeout: 10000 });
    
    // Click Load Adventure
    await page.click('text=Load Adventure');
    
    // Wait for file input and upload example story
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(exampleStoryPath);
    
    // Wait for graph to render
    await page.waitForTimeout(1000);
    
    // Count nodes (section nodes should be rendered)
    const sectionNodes = page.locator('.section-node');
    const nodeCount = await sectionNodes.count();
    
    // Verify we have the correct number of nodes
    const expectedNodeCount = Object.keys(exampleStory.sections).length;
    expect(nodeCount).toBe(expectedNodeCount);
  });

  test('verifies nodes render correctly', async ({ page }) => {
    await page.goto('/');
    
    await page.waitForSelector('.react-flow', { timeout: 10000 });
    
    // Load example story
    await page.click('text=Load Adventure');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(exampleStoryPath);
    
    await page.waitForTimeout(1000);
    
    // Verify nodes are visible
    const nodes = page.locator('.section-node');
    const firstNode = nodes.first();
    await expect(firstNode).toBeVisible();
    
    // Verify node contains section ID
    const nodeText = await firstNode.textContent();
    expect(nodeText).toBeTruthy();
    expect(nodeText!.trim().length).toBeGreaterThan(0);
  });
});
