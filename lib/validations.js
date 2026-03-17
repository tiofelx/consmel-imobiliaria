// ============================================
// Validações de Formulário + Detecção de Fraude
// ============================================

// -----------------------------------------------
// 1. DDDs válidos do Brasil → Estado
// -----------------------------------------------
const DDD_TO_STATE = {
    // São Paulo
    '11': 'SP', '12': 'SP', '13': 'SP', '14': 'SP', '15': 'SP',
    '16': 'SP', '17': 'SP', '18': 'SP', '19': 'SP',
    // Rio de Janeiro
    '21': 'RJ', '22': 'RJ', '24': 'RJ',
    // Espírito Santo
    '27': 'ES', '28': 'ES',
    // Minas Gerais
    '31': 'MG', '32': 'MG', '33': 'MG', '34': 'MG', '35': 'MG',
    '37': 'MG', '38': 'MG',
    // Paraná
    '41': 'PR', '42': 'PR', '43': 'PR', '44': 'PR', '45': 'PR', '46': 'PR',
    // Santa Catarina
    '47': 'SC', '48': 'SC', '49': 'SC',
    // Rio Grande do Sul
    '51': 'RS', '53': 'RS', '54': 'RS', '55': 'RS',
    // Distrito Federal / Goiás
    '61': 'DF', '62': 'GO', '64': 'GO',
    // Mato Grosso do Sul / Mato Grosso
    '65': 'MT', '66': 'MT', '67': 'MS',
    // Tocantins
    '63': 'TO',
    // Bahia
    '71': 'BA', '73': 'BA', '74': 'BA', '75': 'BA', '77': 'BA',
    // Sergipe
    '79': 'SE',
    // Pernambuco
    '81': 'PE', '87': 'PE',
    // Alagoas
    '82': 'AL',
    // Paraíba
    '83': 'PB',
    // Rio Grande do Norte
    '84': 'RN',
    // Ceará
    '85': 'CE', '88': 'CE',
    // Piauí
    '86': 'PI', '89': 'PI',
    // Maranhão
    '98': 'MA', '99': 'MA',
    // Pará
    '91': 'PA', '93': 'PA', '94': 'PA',
    // Amazonas
    '92': 'AM', '97': 'AM',
    // Amapá
    '96': 'AP',
    // Roraima
    '95': 'RR',
    // Rondônia
    '69': 'RO',
    // Acre
    '68': 'AC',
};

// UFs vizinhas (para tolerância na detecção de fraude)
const NEIGHBORING_STATES = {
    'SP': ['MG', 'RJ', 'PR', 'MS', 'GO'],
    'RJ': ['SP', 'MG', 'ES'],
    'MG': ['SP', 'RJ', 'ES', 'BA', 'GO', 'DF', 'MS'],
    'ES': ['RJ', 'MG', 'BA'],
    'PR': ['SP', 'SC', 'MS'],
    'SC': ['PR', 'RS'],
    'RS': ['SC'],
    'DF': ['GO', 'MG'],
    'GO': ['DF', 'MG', 'BA', 'TO', 'MT', 'MS', 'SP'],
    'MT': ['GO', 'MS', 'PA', 'AM', 'RO', 'TO'],
    'MS': ['SP', 'PR', 'MG', 'GO', 'MT'],
    'TO': ['GO', 'MT', 'PA', 'MA', 'PI', 'BA'],
    'BA': ['MG', 'ES', 'GO', 'TO', 'PI', 'PE', 'AL', 'SE'],
    'SE': ['BA', 'AL'],
    'AL': ['PE', 'SE', 'BA'],
    'PE': ['PB', 'AL', 'BA', 'CE', 'PI'],
    'PB': ['PE', 'RN', 'CE'],
    'RN': ['PB', 'CE'],
    'CE': ['RN', 'PB', 'PE', 'PI'],
    'PI': ['CE', 'PE', 'BA', 'TO', 'MA'],
    'MA': ['PI', 'TO', 'PA'],
    'PA': ['MA', 'TO', 'MT', 'AM', 'AP', 'RR'],
    'AM': ['PA', 'MT', 'RO', 'AC', 'RR'],
    'AP': ['PA'],
    'RR': ['AM', 'PA'],
    'RO': ['AM', 'MT', 'AC'],
    'AC': ['AM', 'RO'],
};

// -----------------------------------------------
// 2. Validação de Email
// -----------------------------------------------
export function validateEmail(email) {
    if (!email || !email.trim()) {
        return { valid: false, message: 'E-mail é obrigatório.' };
    }

    const trimmed = email.trim().toLowerCase();

    if (!trimmed.includes('@')) {
        return { valid: false, message: 'E-mail deve conter "@".' };
    }

    // Formato: algo@provedor.com ou algo@provedor.com.br
    const emailRegex = /^[^\s@]+@[^\s@]+\.(com|com\.br|net|org|edu|gov\.br)$/i;
    if (!emailRegex.test(trimmed)) {
        return { valid: false, message: 'E-mail inválido. Use um e-mail válido (ex: nome@gmail.com).' };
    }

    return { valid: true, message: '' };
}

// -----------------------------------------------
// 3. Validação de Telefone / DDD
// -----------------------------------------------
export function extractDDD(phone) {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, '');
    if (digits.length >= 10) {
        return digits.substring(0, 2);
    }
    return null;
}

export function validatePhone(phone) {
    if (!phone || !phone.trim()) {
        return { valid: false, message: 'Telefone é obrigatório.' };
    }

    const digits = phone.replace(/\D/g, '');

    // Celular: 11 dígitos (DDD + 9 + 8 dígitos) ou fixo: 10 dígitos
    if (digits.length < 10 || digits.length > 11) {
        return { valid: false, message: 'Telefone deve ter 10 ou 11 dígitos com DDD.' };
    }

    const ddd = digits.substring(0, 2);
    if (!DDD_TO_STATE[ddd]) {
        return { valid: false, message: `DDD "${ddd}" não é válido. Use um DDD brasileiro.` };
    }

    return { valid: true, message: '', ddd, state: DDD_TO_STATE[ddd] };
}

// Máscara automática de telefone
export function maskPhone(value) {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

// -----------------------------------------------
// 4. Validação de Localização
// -----------------------------------------------
const VALID_UFS = [
    'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO',
    'MA', 'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR',
    'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO',
];

export function extractUF(address) {
    if (!address) return null;
    const upper = address.toUpperCase().trim();

    // Tenta extrair UF no final: "... / SP" ou "... - SP" ou "..., SP"
    const ufMatch = upper.match(/[\s\/\-,]+([A-Z]{2})\s*$/);
    if (ufMatch && VALID_UFS.includes(ufMatch[1])) {
        return ufMatch[1];
    }

    // Procura UF em qualquer posição
    for (const uf of VALID_UFS) {
        const regex = new RegExp(`\\b${uf}\\b`);
        if (regex.test(upper)) {
            return uf;
        }
    }

    return null;
}

export function validateLocation(address) {
    if (!address || !address.trim()) {
        return { valid: false, message: 'Localização é obrigatória.' };
    }

    if (address.trim().length < 5) {
        return { valid: false, message: 'Endereço muito curto. Informe rua, cidade e UF.' };
    }

    const uf = extractUF(address);
    if (!uf) {
        return { valid: false, message: 'Informe a UF no endereço (ex: Guaraci - SP).' };
    }

    return { valid: true, message: '', uf };
}

// -----------------------------------------------
// 5. Validação de Senha
// -----------------------------------------------
export function validatePassword(password) {
    if (!password) {
        return { valid: false, message: 'Senha é obrigatória.', strength: 0 };
    }

    // Muito curta
    if (password.length < 8) {
        return { valid: false, message: 'Senha deve ter no mínimo 8 caracteres.', strength: 1 };
    }

    // Muito longa (suspeita)
    if (password.length > 64) {
        return { valid: false, message: 'Senha não pode ter mais de 64 caracteres.', strength: 0, suspicious: true };
    }

    // Padrões de injection / ataque
    const injectionPatterns = [
        /[<>]/,                         // HTML tags
        /<script/i,                     // XSS
        /(\bOR\b|\bAND\b).*[=]/i,      // SQL injection
        /['";]\s*(--)|(\/\*)/,          // SQL comments
        /\bundefined\b|\bnull\b/i,     // Prototype pollution
        /\{\{.*\}\}/,                   // Template injection
    ];

    for (const pattern of injectionPatterns) {
        if (pattern.test(password)) {
            return { valid: false, message: 'Senha contém caracteres não permitidos.', strength: 0, suspicious: true };
        }
    }

    // Proporção de símbolos especiais
    const specialChars = password.replace(/[a-zA-Z0-9]/g, '').length;
    const specialRatio = specialChars / password.length;
    if (specialRatio > 0.5) {
        return { valid: false, message: 'Senha contém símbolos demais. Use letras e números também.', strength: 0, suspicious: true };
    }

    // Requisitos mínimos
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (!hasUpper || !hasLower || !hasNumber) {
        return {
            valid: false,
            message: 'Senha deve ter pelo menos 1 maiúscula, 1 minúscula e 1 número.',
            strength: 2,
        };
    }

    // Força
    let strength = 3; // Boa
    if (password.length >= 12 && specialChars >= 1) strength = 4; // Forte
    if (password.length >= 16 && specialChars >= 2 && hasUpper && hasNumber) strength = 5; // Excelente

    return { valid: true, message: '', strength };
}

// Rótulo de força
export function getPasswordStrengthLabel(strength) {
    const labels = {
        0: { text: 'Perigosa', color: '#dc2626' },
        1: { text: 'Muito fraca', color: '#dc2626' },
        2: { text: 'Fraca', color: '#f97316' },
        3: { text: 'Boa', color: '#eab308' },
        4: { text: 'Forte', color: '#22c55e' },
        5: { text: 'Excelente', color: '#16a34a' },
    };
    return labels[strength] || labels[0];
}

// -----------------------------------------------
// 6. Detecção de Fraude (cross-referencing)
// -----------------------------------------------
export function detectFraud({ name, email, phone, address }) {
    const reasons = [];
    let severity = 'low';

    // --- Verificar caracteres não-latinos no nome ---
    if (name) {
        // Detecta cirílico, chinês, árabe, etc. — padrão brasileiro é somente latino
        const nonLatinRegex = /[^\u0000-\u024F\u1E00-\u1EFF\s\-'.]/;
        if (nonLatinRegex.test(name)) {
            reasons.push('Nome contém caracteres não-latinos (possível origem estrangeira)');
            severity = 'high';
        }
    }

    // --- Cruzar DDD × UF do endereço ---
    if (phone && address) {
        const ddd = extractDDD(phone);
        const uf = extractUF(address);

        if (ddd && uf) {
            const phoneState = DDD_TO_STATE[ddd];
            if (phoneState && phoneState !== uf) {
                // Verifica se são estados vizinhos (tolerância)
                const neighbors = NEIGHBORING_STATES[phoneState] || [];
                if (!neighbors.includes(uf)) {
                    reasons.push(`DDD ${ddd} (${phoneState}) não corresponde ao endereço (${uf})`);
                    severity = severity === 'high' ? 'high' : 'medium';
                }
            }
        }
    }

    // --- Domínio de e-mail suspeito ---
    if (email) {
        const domain = email.split('@')[1]?.toLowerCase();
        const suspiciousDomains = ['tempmail.com', 'guerrillamail.com', 'mailinator.com', 'throwaway.email', 'yopmail.com', 'trashmail.com'];
        if (domain && suspiciousDomains.some(d => domain.includes(d))) {
            reasons.push(`E-mail usa domínio temporário/descartável (${domain})`);
            severity = 'high';
        }
    }

    return {
        suspicious: reasons.length > 0,
        reasons,
        severity,
    };
}
