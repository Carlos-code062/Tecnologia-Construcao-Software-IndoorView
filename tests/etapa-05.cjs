// Executar com Node.js e Playwright disponíveis. Usa navegador isolado, sem dados pessoais.
const { chromium, expect } = require('playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../src');
const evidence = path.resolve(__dirname, '../docs/evidencias/etapa-05');
const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
  fs.readFile(file, (err, data) => {
    if (err) return res.writeHead(404).end();
    res.setHeader('Content-Type', ({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.json':'application/json'})[path.extname(file)] || 'application/octet-stream');
    res.end(data);
  });
});
async function main() {
  fs.mkdirSync(evidence, {recursive:true});
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch({channel:'msedge',headless:true});
  const context = await browser.newContext({viewport:{width:1440,height:1000},timezoneId:'America/Sao_Paulo'});
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const snap = name => page.screenshot({path:path.join(evidence,name+'.png'),fullPage:true});
  const ready = () => expect(page.locator('main')).toHaveAttribute('aria-busy','false');
  const fill = async () => {
    await page.locator('#nome').fill('Campanha Etapa Cinco');
    await page.locator('#anunciante').fill('Loja Teste');
    await page.locator('#data-inicio').fill('2026-11-01');
    await page.locator('#data-fim').fill('2026-11-30');
    await page.locator('#estabelecimento').selectOption('shopping');
  };
  try {
    await page.goto(url+'campanhas.html');
    await expect(page.locator('#aviso-dados')).toHaveText('Carregando campanhas...');
    await snap('01-carregando-consulta');
    await ready();
    await expect(page.locator('#lista-campanhas article')).toHaveCount(3);
    await snap('02-consulta-sucesso');
    await page.locator('#pesquisa').fill('ACADEMIA');
    await expect(page.locator('#lista-campanhas article')).toHaveCount(1);
    await page.locator('#pesquisa').fill('inexistente');
    await expect(page.locator('#resultado')).toContainText('Nenhuma campanha');
    await page.locator('#limpar-filtros').click();
    await page.getByRole('button',{name:'Ver detalhes: Campanha Academia Fit',exact:true}).click();
    await expect(page.locator('#detalhes')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#detalhes')).not.toBeVisible();

    await page.goto(url+'cadastro-campanha.html'); await ready();
    await page.getByRole('button',{name:'Cadastrar campanha',exact:true}).click();
    await expect(page.locator('[aria-invalid="true"]')).toHaveCount(5);
    await fill();
    await page.locator('#data-fim').fill('2026-10-01');
    await page.getByRole('button',{name:'Cadastrar campanha',exact:true}).click();
    await expect(page.locator('#erro-data-fim')).toContainText('anterior');
    await page.locator('#data-fim').fill('2026-11-30');
    await page.getByRole('button',{name:'Cadastrar campanha',exact:true}).click();
    await expect(page.locator('#mensagem')).toHaveText('Enviando campanha...');
    await expect(page.locator('button[type=submit]')).toBeDisabled();
    await snap('03-enviando-campanha');
    // Mesmo um segundo evento de envio não deve duplicar a operação.
    await page.locator('form').dispatchEvent('submit');
    await expect(page.locator('#mensagem')).toContainText('cadastrada com sucesso');
    await snap('04-envio-sucesso');
    await page.goto(url+'campanhas.html'); await ready();
    await expect(page.locator('#lista-campanhas article')).toHaveCount(4);
    await page.reload(); await ready();
    await expect(page.locator('#lista-campanhas article')).toHaveCount(4);
    await page.getByRole('link',{name:'Editar: Campanha Etapa Cinco',exact:true}).click(); await ready();
    await page.locator('#nome').fill('Campanha Editada');
    await page.getByRole('button',{name:'Salvar alterações',exact:true}).click();
    await expect(page.locator('#mensagem')).toContainText('atualizada com sucesso');
    await page.goto(url+'campanhas.html'); await ready();
    await expect(page.locator('#lista-campanhas article')).toHaveCount(4);
    await expect(page.locator('#lista-campanhas')).toContainText('Campanha Editada');

    await page.goto(url+'campanhas.html?falha=consulta'); await ready();
    await expect(page.locator('#aviso-dados')).toContainText('indisponível');
    await expect(page.locator('#lista-campanhas article')).toHaveCount(0);
    await snap('05-erro-consulta');
    await page.evaluate(()=>history.replaceState(null,'','campanhas.html'));
    await page.getByRole('button',{name:'Tentar novamente'}).click(); await ready();
    await expect(page.locator('#lista-campanhas article')).toHaveCount(4);
    await page.goto(url+'cadastro-campanha.html?falha=envio'); await ready(); await fill();
    const before = await page.evaluate(()=>localStorage.getItem('indoorview-campanhas-v1'));
    await page.getByRole('button',{name:'Cadastrar campanha',exact:true}).click();
    await expect(page.locator('#mensagem')).toContainText('falha simulada');
    await expect(page.locator('#nome')).toHaveValue('Campanha Etapa Cinco');
    assert.equal(await page.evaluate(()=>localStorage.getItem('indoorview-campanhas-v1')),before);
    await snap('06-erro-envio');
    await page.evaluate(()=>history.replaceState(null,'','cadastro-campanha.html'));
    await page.getByRole('button',{name:'Cadastrar campanha',exact:true}).click();
    await expect(page.locator('#mensagem')).toContainText('cadastrada com sucesso');

    for (const [width,height] of [[1440,900],[768,1024],[390,844]]) {
      await page.setViewportSize({width,height});
      for (const file of ['index.html','campanhas.html','cadastro-campanha.html']) {
        await page.goto(url+file); await ready();
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,file+' '+width);
      }
    }
    await snap('07-celular');
    await page.setViewportSize({width:1440,height:1000});
    // Conflito de edição em outra aba ou após a abertura do formulário.
    await page.goto(url+'cadastro-campanha.html?editar=1'); await ready();
    await page.evaluate(()=>{const k='indoorview-campanhas-v1';const d=JSON.parse(localStorage.getItem(k));d[0].nome='Alterada em outra aba';localStorage.setItem(k,JSON.stringify(d));});
    await page.getByRole('button',{name:'Salvar alterações'}).click();
    await expect(page.locator('#mensagem')).toContainText('foi alterada');
    await page.goto(url+'cadastro-campanha.html?editar=inexistente'); await ready();
    await expect(page.locator('button[type=submit]')).toBeDisabled();
    // Preserva dados corrompidos.
    await page.evaluate(()=>localStorage.setItem('indoorview-campanhas-v1','quebrado'));
    await page.goto(url+'campanhas.html'); await ready();
    await expect(page.locator('#aviso-dados')).toContainText('inválidos');
    assert.equal(await page.evaluate(()=>localStorage.getItem('indoorview-campanhas-v1')),'quebrado');
    await page.evaluate(()=>localStorage.removeItem('indoorview-campanhas-v1'));
    // Erro de rede real na consulta Fetch, seguido de recuperação.
    await page.route('**/dados/campanhas.json', route=>route.abort('failed'));
    await page.reload(); await ready();
    await expect(page.locator('#aviso-dados')).toContainText('comunicar');
    await page.unroute('**/dados/campanhas.json');
    await page.locator('#tentar-novamente').click(); await ready();
    await expect(page.locator('#lista-campanhas article')).toHaveCount(3);
    // Resposta HTTP inválida também deve ser tratada.
    await page.route('**/dados/campanhas.json', route=>route.fulfill({status:503,body:'erro'}));
    await page.reload(); await ready();
    await expect(page.locator('#aviso-dados')).toContainText('HTTP 503');
    await page.unroute('**/dados/campanhas.json');
    // Falha de armazenamento não deve limpar campos nem anunciar sucesso.
    await page.goto(url+'cadastro-campanha.html'); await ready(); await fill();
    await page.evaluate(()=>{Storage.prototype.setItem=()=>{throw new DOMException('Quota','QuotaExceededError');};});
    await page.getByRole('button',{name:'Cadastrar campanha',exact:true}).click();
    await expect(page.locator('#mensagem')).toContainText('Não foi possível salvar');
    await expect(page.locator('#nome')).toHaveValue('Campanha Etapa Cinco');
    assert.deepEqual(errors,[]);
    console.log('PASS: consulta Fetch, carregamento, POST/PUT simulados, persistência, validação, filtro, modal, bloqueio de envio duplicado, erro/repetição, conflito, dados inválidos, rede/HTTP, falha de gravação e 9 cenários responsivos.');
  } finally { await context.close(); await browser.close(); server.close(); }
}
main().catch(e=>{console.error(e);server.close();process.exitCode=1;});
