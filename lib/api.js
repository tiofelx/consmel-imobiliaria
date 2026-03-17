/**
 * Service API Adapter
 * 
 * This adapter acts as the bridge between the frontend forms and the backend services.
 * Currently configured in MOCK mode for immediate UI functionality and testing.
 * 
 * Future Integration Options:
 * 1. Connect to paid APIs (Superlógica, PJBank, Iugu)
 * 2. Connect to an email service for manual processing (Zero Cost)
 */

const SIMULATION_DELAY_MS = 1500;

export const ServiceAPI = {
  /**
   * Request a 2nd via of Boleto
   * @param {string} document - CPF or CNPJ
   * @param {string} code - Optional specific bill code
   */
  getBoleto: async (document, code = '') => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulation logic
        if (!document || document.length < 11) {
          reject({ message: 'Documento inválido. Verifique o CPF/CNPJ informado.' });
          return;
        }

        resolve({
          success: true,
          message: 'Solicitação recebida com sucesso! O boleto será enviado para o e-mail cadastrado.',
          data: {
            protocol: 'BOL-' + Math.floor(Math.random() * 100000),
            status: 'sent_to_email'
          }
        });
      }, SIMULATION_DELAY_MS);
    });
  },

  /**
   * Request Owner's Extract
   * @param {string} document - CPF or CNPJ
   * @param {string} id - Property or Owner ID
   */
  getExtrato: async (document, id) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!id) {
          reject({ message: 'ID do proprietário/imóvel é obrigatório.' });
          return;
        }

        resolve({
          success: true,
          message: 'Extrato gerado com sucesso.',
          data: {
            period: 'Fevereiro/2026',
            entries: [
              { date: '05/02', description: 'Aluguel Recebido', value: 2500.00, type: 'credit' },
              { date: '05/02', description: 'Taxa de Administração', value: -250.00, type: 'debit' },
              { date: '10/02', description: 'Repasse Efetuado', value: -2250.00, type: 'debit' }
            ],
            balance: 0.00
          }
        });
      }, SIMULATION_DELAY_MS);
    });
  },

  /**
   * Request Income Report (Informe de Rendimentos)
   * @param {string} document - CPF/CNPJ
   * @param {string} userType - 'locador' or 'locatario'
   */
  getInformeRenda: async (document, userType) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: 'Informe de rendimentos disponível para download.',
          data: {
            year: 2025,
            downloadUrl: '#', // In a real app, this would be a link to a PDF
            fileName: `informe_rendimentos_2025_${document}.pdf`
          }
        });
      }, SIMULATION_DELAY_MS);
    });
  }
};
