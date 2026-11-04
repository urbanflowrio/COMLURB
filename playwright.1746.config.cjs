const { defineConfig, devices } = require('@playwright/test');
module.exports=defineConfig({ testDir: './tests/1746-outubro', timeout:90000, retries:0, reporter:[['list'],['html',{outputFolder:'playwright-report',open:'never'}]],use:{...devices['Desktop Chrome'], headless:true},workers:1 });
