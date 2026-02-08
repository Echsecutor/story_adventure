/**
 * E2E tests for editing stories in the editor.
 */

import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { join } from 'path';

const exampleStoryPath = join(__dirname, '../../../stories/example_story.json');

test.describe('Editor Edit', () => {
  test('clicks node, edits text, and verifies change persists', async ({ page }) => {
    await page.goto('/');
    
    await page.waitForSelector('.react-flow', { timeout: 10000 });
    
    // Load example story
    await page.click('text=Load Adventure');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(exampleStoryPath);
    
    await page.waitForTimeout(1000);
    
    // Click first node
    const firstNode = page.locator('.section-node').first();
    await firstNode.click();
    
    // Wait for section panel to appear
    await page.waitForSelector('textarea', { timeout: 5000 });
    
    // Edit text
    const textarea = page.locator('textarea').first();
    await textarea.fill('Edited text for testing');
    
    // Wait a bit for state to update
    await page.waitForTimeout(500);
    
    // Verify text is still there (persists)
    const textValue = await textarea.inputValue();
    expect(textValue).toBe('Edited text for testing');
  });

  test('adds a new node', async ({ page }) => {
    await page.goto('/');
    
    await page.waitForSelector('.react-flow', { timeout: 10000 });
    
    // Click Add Section
    await page.click('text=Add Section');
    
    await page.waitForTimeout(500);
    
    // Verify new node appears
    const nodes = page.locator('.section-node');
    const nodeCount = await nodes.count();
    expect(nodeCount).toBeGreaterThan(0);
  });

  test('adds an edge between nodes', async ({ page }) => {
    await page.goto('/');
    
    await page.waitForSelector('.react-flow', { timeout: 10000 });
    
    // Load example story
    await page.click('text=Load Adventure');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(exampleStoryPath);
    
    await page.waitForTimeout(1000);
    
    // Click first node to select it
    const firstNode = page.locator('.section-node').first();
    await firstNode.click();
    
    // Wait for section panel
    await page.waitForSelector('select', { timeout: 5000 });
    
    // Select target section and add choice
    const select = page.locator('select').first();
    await select.selectOption({ index: 1 }); // Select second option
    
    // Click Add Choice button
    await page.click('button:has-text("Add Choice")');
    
    await page.waitForTimeout(500);
    
    // Verify edge appears (check for edge elements)
    const edges = page.locator('.react-flow__edge');
    const edgeCount = await edges.count();
    expect(edgeCount).toBeGreaterThan(0);
  });

  test('deletes a node', async ({ page }) => {
    await page.goto('/');
    
    await page.waitForSelector('.react-flow', { timeout: 10000 });
    
    // Load example story
    await page.click('text=Load Adventure');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(exampleStoryPath);
    
    await page.waitForTimeout(1000);
    
    // Get initial node count
    const initialNodes = page.locator('.section-node');
    const initialCount = await initialNodes.count();
    
    // Click first node
    const firstNode = initialNodes.first();
    await firstNode.click();
    
    // Wait for panel
    await page.waitForSelector('button:has-text("Delete")', { timeout: 5000 });
    
    // Click Delete button
    await page.click('button:has-text("Delete")');
    
    await page.waitForTimeout(500);
    
    // Verify node count decreased
    const finalNodes = page.locator('.section-node');
    const finalCount = await finalNodes.count();
    expect(finalCount).toBe(initialCount - 1);
  });
});
