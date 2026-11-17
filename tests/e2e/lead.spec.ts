import { test, expect } from '@playwright/test'

test.describe('formulário de lead (sem número de WhatsApp)', () => {
  test('valida no blur, limpa ao digitar e desabilita o botão', async ({ page }) => {
    await page.goto('/')
    const form = page.locator('#contato')
    const nome = form.getByLabel('Nome')
    await nome.focus()
    await nome.blur()
    await expect(form.getByText('Conte seu nome para a gente')).toBeVisible()
    await nome.fill('Ana')
    await expect(form.getByText('Conte seu nome para a gente')).toHaveCount(0)

    await expect(form.getByRole('button', { name: 'Contato direto em breve' })).toBeDisabled()
    const insta = form.getByRole('link', { name: /Instagram/ })
    await expect(insta).toBeVisible()
    await expect(insta).toHaveAttribute('href', 'https://www.instagram.com/amenestudio/')
  })
})
