import 'dotenv/config';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmail() {
  try {
    const data = await resend.emails.send({
      // 1. NOME E E-MAIL DO REMETENTE
      // O formato é: "Nome Que Aparece <email@dominio.com>"
      // IMPORTANTE: Para usar um e-mail diferente de onboarding@resend.dev,
      // você precisa verificar o seu domínio no painel do Resend!
      from: 'Imobiliária Consmel <onboarding@resend.dev>',
      
      to: 'rjoaomax@gmail.com',
      subject: 'Bem-vindo à Consmel Imobiliária!',
      
      // 2. TIMBRADO / HTML DO E-MAIL
      // Aqui você pode colocar o HTML completo com CSS inline para estilizar a mensagem.
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
          
          <!-- Cabeçalho / Timbrado -->
          <div style="background-color: #0044cc; padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🏢 Imobiliária Consmel</h1>
          </div>
          
          <!-- Corpo do E-mail -->
          <div style="padding: 30px; background-color: #ffffff; color: #333333; line-height: 1.6;">
            <h2 style="color: #0044cc; margin-top: 0;">Olá, João!</h2>
            <p>Este é um exemplo de e-mail <strong>timbrado e personalizado</strong> enviado pelo seu sistema.</p>
            
            <p>Você pode usar HTML e CSS (inline) para adicionar botões, imagens, formatar textos e deixar o e-mail com a cara da sua marca.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="http://localhost:3000" style="background-color: #0044cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                Acessar meu Painel
              </a>
            </div>
            
            <p>Se tiver alguma dúvida, basta responder este e-mail.</p>
          </div>
          
          <!-- Rodapé -->
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #888888;">
            <p style="margin: 0;">© 2026 Imobiliária Consmel. Todos os direitos reservados.</p>
            <p style="margin: 5px 0 0 0;">Rua Exemplo, 123 - Centro, Guaraci/SP</p>
          </div>
          
        </div>
      `
    });
    console.log('E-mail timbrado enviado com sucesso!', data);
  } catch (error) {
    console.error('Erro ao enviar o e-mail:', error);
  }
}

testEmail();
