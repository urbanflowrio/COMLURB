const { test, expect } = require('@playwright/test');
const pages = ['chamados-1746/','ouvidoria/','1746-comparativo/','1746-historico/','1746-timeline/'];
for (const pathname of pages) {
  test(pathname.replace(/\\/g,'-') + ' — carregamento, filtros e responsividade', async ({page}, testInfo) => {
    const errors=[];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if(m.type()==='error') errors.push('console: '+m.text()); });
    const response=await page.goto('http://127.0.0.1:8765/'+pathname, {waitUntil:'domcontentloaded', timeout:45000});
    expect(response.status()).toBe(200);
    await page.waitForTimeout(1800);
    if (pathname === '1746-timeline/') {
      await expect(page.locator('#hubHeader .header .mainTitle')).toHaveText('Linha do Tempo 1746');
      await expect(page.locator('#hubFooter .footerTitle')).toHaveText('HUB COMLURB');
      await expect(page.locator('.timeline-page .statement')).toBeVisible();
      await expect(page.locator('.timeline-page .takeaways')).toHaveCount(0);
      await expect(page.locator('.timeline-methodology')).toContainText('CAS – Controle de Atendimento a Solicitações');
      await expect(page.locator('.timeline-methodology')).toContainText('exclusão dos registros tratados internamente pela PCO');
      await expect(page.locator('#timeline .month')).toHaveCount(10);
      await expect(page.locator('.timeline-hero-title')).toBeVisible();
      await page.getByRole('button', {name:'Detalhar outubro'}).click();
      await expect(page.locator('#overlay')).toHaveClass(/open/);
      await expect(page.locator('#drawerTitle')).toHaveText('Outubro/2026');
      await page.locator('.close').click();
      await expect(page.locator('#overlay')).not.toHaveClass(/open/);
    }
    expect(await page.locator('body').innerText()).toMatch(/1746|Ouvidoria|Chamados|COMLURB/i);
    await page.screenshot({path:testInfo.outputPath('desktop.png'),fullPage:true});
    const controls=page.locator('select:visible');
    for(let i=0;i<Math.min(await controls.count(),5);i++){
      const control=controls.nth(i);
      const opts=await control.locator('option:not([disabled])').evaluateAll(nodes=>nodes.map(n=>n.value).filter(Boolean));
      if(opts.length>1){
        await control.selectOption(opts[opts.length-1]);
        await page.waitForTimeout(200);
      }
    }
    const charts=await page.locator('canvas').count();
    if(charts) await expect(page.locator('canvas').first()).toBeVisible();
    await page.setViewportSize({width:390,height:844});
    await page.waitForTimeout(600);
    await page.screenshot({path:testInfo.outputPath('mobile.png'),fullPage:true});
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
    expect(overflow,'horizontal overflow on mobile').toBeLessThan(26);
    expect(errors,'JavaScript/browser console errors').toEqual([]);
  });
}
