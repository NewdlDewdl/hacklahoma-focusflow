const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(2000); // Wait for page to load
  
  await page.screenshot({ 
    path: '/Users/vishnuanapalli/.openclaw/workspace/hacklahoma-focusflow/current-ui.png',
    fullPage: true 
  });
  
  console.log('Screenshot saved to current-ui.png');
  await browser.close();
})();
