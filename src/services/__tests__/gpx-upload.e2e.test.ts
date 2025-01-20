import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test.describe('GPX Upload Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the upload page
    await page.goto('http://localhost:5173');
    
    // Login if needed (assuming Auth0 is configured for test environment)
    if (await page.locator('text=Log in').isVisible()) {
      await page.click('text=Log in');
      await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || '');
      await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || '');
      await page.click('button[type="submit"]');
    }
  });

  test('should upload GPX file and display on map', async ({ page }) => {
    // Wait for the upload button to be visible
    const uploadButton = page.locator('text=Upload GPX');
    await expect(uploadButton).toBeVisible();

    // Get test file path
    const testFilePath = path.join(__dirname, '../../../uploads/1736662353807-164831248.gpx');
    
    // Upload file
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      uploadButton.click()
    ]);
    await fileChooser.setFiles(testFilePath);

    // Wait for upload success message
    await expect(page.locator('text=Upload successful')).toBeVisible();

    // Verify route appears on map
    const mapRoute = page.locator('.leaflet-overlay-pane path');
    await expect(mapRoute).toBeVisible();

    // Verify surface legend appears
    const surfaceLegend = page.locator('.surface-legend');
    await expect(surfaceLegend).toBeVisible();
  });

  test('should show error for invalid file type', async ({ page }) => {
    // Create temporary invalid file
    const invalidFilePath = path.join(__dirname, 'invalid.txt');
    fs.writeFileSync(invalidFilePath, 'invalid content');

    // Upload invalid file
    const uploadButton = page.locator('text=Upload GPX');
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      uploadButton.click()
    ]);
    await fileChooser.setFiles(invalidFilePath);

    // Verify error message
    await expect(page.locator('text=Invalid file type')).toBeVisible();

    // Clean up
    fs.unlinkSync(invalidFilePath);
  });

  test('should show error for large files', async ({ page }) => {
    // Create temporary large file (11MB)
    const largeFilePath = path.join(__dirname, 'large.gpx');
    const largeContent = Buffer.alloc(11 * 1024 * 1024, 'x');
    fs.writeFileSync(largeFilePath, largeContent);

    // Upload large file
    const uploadButton = page.locator('text=Upload GPX');
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      uploadButton.click()
    ]);
    await fileChooser.setFiles(largeFilePath);

    // Verify error message
    await expect(page.locator('text=File size exceeds limit')).toBeVisible();

    // Clean up
    fs.unlinkSync(largeFilePath);
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Simulate offline mode
    await page.route('**/api/routes', route => route.abort('failed'));

    // Upload file
    const uploadButton = page.locator('text=Upload GPX');
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      uploadButton.click()
    ]);
    await fileChooser.setFiles(path.join(__dirname, '../../../uploads/1736662353807-164831248.gpx'));

    // Verify error message
    await expect(page.locator('text=Network error')).toBeVisible();
  });

  test('should show upload progress', async ({ page }) => {
    // Upload file
    const uploadButton = page.locator('text=Upload GPX');
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      uploadButton.click()
    ]);
    await fileChooser.setFiles(path.join(__dirname, '../../../uploads/1736662353807-164831248.gpx'));

    // Verify progress indicator
    const progressIndicator = page.locator('.progress-indicator');
    await expect(progressIndicator).toBeVisible();
    
    // Wait for upload to complete
    await expect(page.locator('text=Upload successful')).toBeVisible();
    await expect(progressIndicator).not.toBeVisible();
  });
});
