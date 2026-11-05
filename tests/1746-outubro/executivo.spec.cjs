const {test,expect}=require('@playwright/test');
test('Boletim executivo 1746: leitura única, dados conferidos e responsividade', async ({page},info)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const response=await page.goto('http://127.0.0.1:8765/1746-resumo-executivo/',{waitUntil:'load',timeout:45000});
 expect(response.status()).toBe(200);
 await expect(page.locator('.header .mainTitle')).toHaveText('Boletim Executivo 1746');
 await expect(page.locator('#hubFooter .footerTitle')).toHaveText('HUB COMLURB');
 await expect(page.locator('#hubHeader .logoImg')).toBeVisible();
 await expect(page.locator('.app')).toBeVisible();
 // Três momentos: Resultado, O que explica, Onde ocorreu
 await expect(page.locator('main > section')).toHaveCount(3);
 await expect(page.locator('main > section h2')).toHaveText(['Resultado','O que explica','Onde ocorreu']);
 await expect(page.locator('.be-headline')).toContainText('O aumento dos chamados esteve concentrado em Limpeza');
 await expect(page.locator('.be-fig')).toHaveCount(3);
 await expect(page.locator('.be-place')).toHaveCount(2);
 await expect(page.locator('.be-more a')).toHaveCount(5);
 const main=page.locator('main');
 for(const t of ['24.116','2.213','21.652','2.697','+13,5%','+15,5%','+2.581','799','8,4%','97,6%','2.310','Campo Grande','Bangu','OG18G','OG17B','599 chamados e 99 ouvidorias','637 chamados e 52 ouvidorias','já contidos nesses totais','92 ouvidorias a mais','04/11/2026','sem homologação independente'])
   await expect(main).toContainText(t);
 expect(await main.innerText()).not.toMatch(/Vale acompanhar|Merece atenção|Leitura executiva|É importante destacar/);
 expect(await page.locator('main details, main button, main select, main table, main canvas').count()).toBe(0);
 expect(await page.locator('script').count()).toBeGreaterThanOrEqual(3);
 expect(await page.locator('body').innerText()).not.toMatch(/[–—]/);
 await page.screenshot({path:info.outputPath('boletim-executivo-desktop.png'),fullPage:true});
 await page.setViewportSize({width:390,height:844});
 await expect(page.locator('.header .mainTitle')).toBeVisible();
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
 expect(overflow).toBeLessThan(15);
 await page.screenshot({path:info.outputPath('boletim-executivo-mobile.png'),fullPage:true});
 expect(errors).toEqual([]);
});
