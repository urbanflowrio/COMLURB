/* Navegação por assunto; preserva os filtros ao alternar visões. */
(() => {
  'use strict';
  const tabs=[...document.querySelectorAll('#pessoasAbas [role="tab"]')];
  const scoped=new Set(['quadro','afast','restr','tmp']);
  const filters=document.querySelector('.pe-recorte'), kpis=document.getElementById('peKpis');
  function show(key,updateHash=true) {
    const chosen=tabs.find(t=>t.dataset.aba===key) || tabs[0];
    tabs.forEach(t=>{const active=t===chosen;t.setAttribute('aria-selected',String(active));t.tabIndex=active?0:-1;document.getElementById(t.getAttribute('aria-controls')).hidden=!active;});
    filters.hidden=!scoped.has(chosen.dataset.aba);kpis.hidden=filters.hidden;
    if(updateHash) history.replaceState(null,'','#'+chosen.dataset.aba);
    document.getElementById('peTip').hidden=true;
  }
  tabs.forEach((t,i)=>{
    t.addEventListener('click',()=>show(t.dataset.aba));
    t.addEventListener('keydown',e=>{let n;if(e.key==='ArrowRight') n=(i+1)%tabs.length;if(e.key==='ArrowLeft')n=(i+tabs.length-1)%tabs.length;if(e.key==='Home')n=0;if(e.key==='End')n=tabs.length-1;if(n!==undefined){e.preventDefault();show(tabs[n].dataset.aba);tabs[n].focus();}});
  });
  window.addEventListener('hashchange',()=>show(location.hash.slice(1).replace('bloco-',''),false));
  show(location.hash.slice(1).replace('bloco-',''),false);
})();
