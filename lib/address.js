/**
 * Fetches address information from ViaCEP API
 * @param {string} cep - The CEP to search for (numbers only or with hyphen)
 * @returns {Promise<Object|null>} - The address object or null if not found/error
 */
export async function fetchAddressByCep(cep) {
  // Remove non-numeric characters
  const cleanCep = cep.replace(/\D/g, '');

  // Validation: CEP must have 8 digits
  if (cleanCep.length !== 8) {
    return null;
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    const data = await response.json();

    if (data.erro) {
      return null;
    }

    return {
      street: data.logradouro,
      neighborhood: data.bairro,
      city: data.localidade,
      state: data.uf,
      fullAddress: `${data.logradouro}, ${data.bairro}, ${data.localidade} - ${data.uf}`
    };
  } catch (error) {
    console.error('Error fetching address:', error);
    return null;
  }
}
