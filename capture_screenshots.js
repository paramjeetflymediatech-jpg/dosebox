const { chromium } = require('C:\\\\Users\\\\TEch\\\\Desktop\\\\screenshots_temp\\\\node_modules\\\\playwright');
const fs = require('fs');
const path = require('path');
const jwt = require('C:\\\\Users\\\\TEch\\\\Desktop\\\\letscode\\\\dosebox\\\\node_modules\\\\jsonwebtoken');

(async () => {
  const screenshotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
  }

  console.log('Launching browser...');
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  
  const page = await context.newPage();

  // Mock Orders API so we guarantee the exact orders we want to screenshot
  await page.route('**/api/orders', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 998,
              status: 'Pending',
              totalAmount: '450',
              finalAmount: '450',
              paymentStatus: 'Paid',
              paymentMethod: 'PhonePe',
              createdAt: new Date().toISOString(),
              trackingTimeline: '[]'
            },
            {
              id: 999,
              status: 'Pending',
              totalAmount: '450',
              finalAmount: '450',
              paymentStatus: 'Pending',
              paymentMethod: 'COD',
              createdAt: new Date().toISOString(),
              trackingTimeline: '[]'
            }
          ]
        })
      });
    } else {
      route.continue();
    }
  });

  // Inject Local Storage and cookies
  console.log('Navigating and injecting session...');
  await page.goto('http://localhost:3000');
  
  const token = jwt.sign({ id: 1, roleName: 'Customer' }, 'dosebox_jwt_access_secret_2024');
  await context.addCookies([
    { name: 'accessToken', value: token, domain: 'localhost', path: '/' }
  ]);
  
  await page.evaluate((t) => {
    localStorage.setItem('user', JSON.stringify({
      id: 1,
      name: 'Test Customer',
      email: 'customer@test.com',
      role: 'Customer',
      doseboxTokens: 150
    }));
    
    // Inject Cart
    localStorage.setItem('cart', JSON.stringify([
      {
        id: 1,
        medicineId: 1,
        name: 'Premium Multivitamin',
        quantity: 1,
        price: 450,
        discountPrice: 400
      }
    ]));
    
    localStorage.setItem('accessToken', t);
  }, token);

  // 1. Checkout Page - COD
  console.log('Capturing Checkout - COD...');
  await page.goto('http://localhost:3000/checkout', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000); 
  // Click COD
  await page.evaluate(() => {
    const codDiv = Array.from(document.querySelectorAll('span')).find(el => el.textContent.includes('Cash on Delivery'));
    if (codDiv) codDiv.closest('div[class*="cursor-pointer"]').click();
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(screenshotsDir, '1_checkout_cod.png') });

  // 2. Checkout Page - PhonePe
  console.log('Capturing Checkout - PhonePe...');
  await page.evaluate(() => {
    const phonepeDiv = Array.from(document.querySelectorAll('span')).find(el => el.textContent.includes('PhonePe'));
    if (phonepeDiv) phonepeDiv.closest('div[class*="cursor-pointer"]').click();
  });
  await page.waitForTimeout(1000);
  
  // Click 'Use tokens'
  await page.evaluate(() => {
    const checkbox = document.querySelector('input[type="checkbox"]');
    if (checkbox && !checkbox.checked) checkbox.click();
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(screenshotsDir, '2_checkout_phonepe.png') });

  // 3. Orders Page - PhonePe Cancel
  console.log('Capturing Orders Page - PhonePe...');
  await page.goto('http://localhost:3000/account/orders', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  // Click Cancel on Order 998 (PhonePe)
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button')).filter(btn => btn.textContent.includes('Cancel Order'));
    if (btns.length > 0) btns[0].click(); // Order 998 is first
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(screenshotsDir, '3_orders_cancel_phonepe.png') });
  
  // Close modal
  await page.evaluate(() => {
    // Escape key or close button. Close button is an X icon
    const closeBtn = document.querySelector('.lucide-x-circle');
    if (closeBtn) closeBtn.closest('button').click();
  });
  await page.waitForTimeout(1000);

  // 4. Orders Page - COD Cancel
  console.log('Capturing Orders Page - COD...');
  // Click Cancel on Order 999 (COD)
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button')).filter(btn => btn.textContent.includes('Cancel Order'));
    if (btns.length > 1) btns[1].click(); // Order 999 is second
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(screenshotsDir, '4_orders_cancel_cod.png') });

  console.log('Done capturing screenshots!');
  await browser.close();
})();
