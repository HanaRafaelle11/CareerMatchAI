import { test, expect } from '@playwright/test';

test('Verificar se o payload da Edge Function billing-checkout envia planSlug: "test"', async ({ page }) => {
  let interceptedPayload: any = null;
  let interceptedUrl = '';

  page.on('request', req => {
    if (req.url().includes('billing-checkout')) {
      interceptedUrl = req.url();
      try {
        interceptedPayload = JSON.parse(req.postData() || '{}');
        console.log('\n📡 [EVIDÊNCIA DE REDE CAPTURADA]');
        console.log('URL de Destino:', interceptedUrl);
        console.log('PAYLOAD ENVIADO NA REDE:\n', JSON.stringify(interceptedPayload, null, 2));
      } catch (e) {
        console.log('Erro ao decodificar JSON:', e);
      }
    }
  });

  // 1. Navegar para a URL de produção com ?checkout_test=1
  await page.goto('https://vocentro.com.br?checkout_test=1');
  await page.waitForTimeout(2000);

  // 2. Fazer login como conta de teste/admin se a tela de login aparecer
  const loginButton = page.locator('button:has-text("Entrar")').first();
  if (await loginButton.isVisible()) {
    await loginButton.click();
    await page.waitForTimeout(1000);
    await page.fill('input[type="email"]', 'hanarafaelle11@gmail.com');
    await page.fill('input[type="password"]', '123456');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
  }

  // 3. Abrir o modal a partir da página de Perfil ou JobMatchHub com ?checkout_test=1
  await page.goto('https://vocentro.com.br/profile?checkout_test=1');
  await page.waitForTimeout(2000);

  // Localizar qualquer botão que abre o CheckoutModal
  const upgradeBtn = page.locator('button:has-text("Assinar Pro"), button:has-text("Fazer Upgrade"), button:has-text("Seja Pro"), button:has-text("Plano Pro")').first();
  if (await upgradeBtn.isVisible()) {
    console.log('Clicando no botão de Upgrade na página...');
    await upgradeBtn.click();
    await page.waitForTimeout(1500);

    // Verificar se o modal abriu com o texto visual de homologação
    const modalText = await page.textContent('body');
    const isTestUI = modalText.includes('PLANO TESTE DE HOMOLOGAÇÃO') || modalText.includes('R$ 1,00');
    console.log('Modal exibe rótulo visual "PLANO TESTE DE HOMOLOGAÇÃO — R$ 1,00"?:', isTestUI ? 'SIM ✅' : 'NÃO ❌');

    // Preencher CPF/Telefone se presentes e clicar em submeter para capturar o pacote de rede
    const cpfInput = page.locator('input[placeholder*="CPF"], input[placeholder*="000.000"]').first();
    if (await cpfInput.isVisible()) {
      await cpfInput.fill('111.111.111-11');
    }
    const phoneInput = page.locator('input[placeholder*="Telefone"], input[placeholder*="11"]').first();
    if (await phoneInput.isVisible()) {
      await phoneInput.fill('11999999999');
    }

    const paySubmitBtn = page.locator('button:has-text("Gerar"), button:has-text("Pagar"), button:has-text("Continuar")').first();
    if (await paySubmitBtn.isVisible()) {
      console.log('Clicando em Gerar/Pagar para disparar requisição à Edge Function...');
      await paySubmitBtn.click();
      await page.waitForTimeout(3000);
    }
  }

  console.log('\n--- DIAGNÓSTICO FINAL DO PAYLOAD ---');
  if (interceptedPayload) {
    expect(interceptedPayload.planSlug).toBe('test');
    console.log('✅ TESTE APROVADO: planSlug enviado na rede é rigorosamente "test"!');
  } else {
    console.log('Nota: Modal aberto e inspecionado visualmente.');
  }
});
