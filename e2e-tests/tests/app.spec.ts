import { test, expect } from '@playwright/test';

test.describe('Railway Assistance E2E Tests', () => {
  test('Complete flow: Happy Path Flow', async ({ page }) => {
    // Auto-dismiss all browser dialogs (Alert.alert in React Native Web)
    page.on('dialog', async dialog => {
      await dialog.accept();
    });

    await page.goto('/');

    // --- STEP 1: LOGIN ---
    await page.getByPlaceholder('Phone Number (e.g., +919999999999)').fill('+918919653536');
    // Click 'Send OTP' button (React Native may render as uppercase or title case)
    await page.getByRole('button', { name: /send otp/i }).click();

    // Wait for the OTP screen to appear (after Firebase responds & alert is dismissed)
    await expect(page.getByPlaceholder('Enter OTP')).toBeVisible({ timeout: 15000 });
    
    await page.getByPlaceholder('Enter OTP').fill('123456');
    await page.getByRole('button', { name: /verify otp/i }).click();

    // Verify we reach the Role Selection screen
    await expect(page.getByText('Select Your Role')).toBeVisible({ timeout: 10000 });

    // --- STEP 2: PASSENGER - Create a trip ---
    await page.getByText('Passenger').click();
    await expect(page.getByText('Passenger View')).toBeVisible();

    await page.getByPlaceholder('Pickup').fill('Platform 4');
    await page.getByPlaceholder('Drop').fill('North Gate');
    await page.getByText('Request Assistance').click();
    await page.waitForTimeout(1000); // Wait for API call

    // Verify the NEW trip appears (use .first() since old trips may exist)
    await expect(page.getByText('From: Platform 4').first()).toBeVisible();
    await expect(page.getByText('To: North Gate').first()).toBeVisible();
    // At least one trip should be REQUESTED
    await expect(page.getByText('Status: REQUESTED').first()).toBeVisible();

    // --- STEP 3: HAMALI - View and Accept the trip ---
    await page.getByText('Back to Roles').click();
    await page.getByText('Hamali').click();
    await expect(page.getByText('Hamali View')).toBeVisible();

    // The dashboard auto-refreshes every 3s — wait for the trip to appear
    await expect(page.getByText('Pickup: Platform 4').first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Drop: North Gate').first()).toBeVisible();

    // Accept the first available trip
    await page.getByText('Accept Trip').first().click();
    await page.waitForTimeout(1000); // Wait for API call

    // --- STEP 4: VERIFY status updated in Passenger View ---
    await page.getByText('Back to Roles').click();
    await page.getByText('Passenger').click();

    // At least one trip should now show ACCEPTED
    await expect(page.getByText('Status: ACCEPTED').first()).toBeVisible();
  });
});

