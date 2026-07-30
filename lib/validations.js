const DDD_TO_STATE = {
    '11': 'SP', '12': 'SP', '13': 'SP', '14': 'SP', '15': 'SP',
    '16': 'SP', '17': 'SP', '18': 'SP', '19': 'SP',
    '21': 'RJ', '22': 'RJ', '24': 'RJ',
    '27': 'ES', '28': 'ES',
    '31': 'MG', '32': 'MG', '33': 'MG', '34': 'MG', '35': 'MG',
    '37': 'MG', '38': 'MG',
    '41': 'PR', '42': 'PR', '43': 'PR', '44': 'PR', '45': 'PR', '46': 'PR',
    '47': 'SC', '48': 'SC', '49': 'SC',
    '51': 'RS', '53': 'RS', '54': 'RS', '55': 'RS',
    '61': 'DF', '62': 'GO', '64': 'GO',
    '65': 'MT', '66': 'MT', '67': 'MS',
    '63': 'TO',
    '71': 'BA', '73': 'BA', '74': 'BA', '75': 'BA', '77': 'BA',
    '79': 'SE',
    '81': 'PE', '87': 'PE',
    '82': 'AL',
    '83': 'PB',
    '84': 'RN',
    '85': 'CE', '88': 'CE',
    '86': 'PI', '89': 'PI',
    '98': 'MA', '99': 'MA',
    '91': 'PA', '93': 'PA', '94': 'PA',
    '92': 'AM', '97': 'AM',
    '96': 'AP',
    '95': 'RR',
    '69': 'RO',
    '68': 'AC',
};

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

export function validateEmail(email) {
    if (!email || !email.trim()) {
        return { valid: false, message: 'E-mail é obrigatório.' };
    }

    const trimmed = email.trim().toLowerCase();

    if (!trimmed.includes('@')) {
        return { valid: false, message: 'E-mail deve conter "@".' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.(com|com\.br|net|org|edu|gov\.br)$/i;
    if (!emailRegex.test(trimmed)) {
        return { valid: false, message: 'E-mail inválido. Use um e-mail válido (ex: nome@gmail.com).' };
    }

    return { valid: true, message: '' };
}

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

    if (digits.length < 10 || digits.length > 11) {
        return { valid: false, message: 'Telefone deve ter 10 ou 11 dígitos com DDD.' };
    }

    const ddd = digits.substring(0, 2);
    if (!DDD_TO_STATE[ddd]) {
        return { valid: false, message: `DDD "${ddd}" não é válido. Use um DDD brasileiro.` };
    }

    return { valid: true, message: '', ddd, state: DDD_TO_STATE[ddd] };
}

export function maskPhone(value) {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function maskCep(value) {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

// Treats every typed digit as a cent, like standard BRL money inputs (e.g. Nubank/Mercado Livre).
export function maskCurrencyInput(value) {
    const digits = value.replace(/\D/g, '');
    if (!digits) return '';
    const cents = parseInt(digits, 10);
    return (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatCurrencyBRL(value) {
    const number = typeof value === 'number' ? value : parseFloat(value);
    if (!Number.isFinite(number)) return '';
    return number.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const VALID_UFS = [
    'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO',
    'MA', 'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR',
    'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO',
];

export function extractUF(address) {
    if (!address) return null;
    const upper = address.toUpperCase().trim();

    const ufMatch = upper.match(/[\s\/\-,]+([A-Z]{2})\s*$/);
    if (ufMatch && VALID_UFS.includes(ufMatch[1])) {
        return ufMatch[1];
    }

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

export function validatePassword(password) {
    if (!password) {
        return { valid: false, message: 'Senha é obrigatória.', strength: 0 };
    }

    if (password.length < 8) {
        return { valid: false, message: 'Senha deve ter no mínimo 8 caracteres.', strength: 1 };
    }

    if (password.length > 64) {
        return { valid: false, message: 'Senha não pode ter mais de 64 caracteres.', strength: 0, suspicious: true };
    }

    const injectionPatterns = [
        /[<>]/,
        /<script/i,
        /(\bOR\b|\bAND\b).*[=]/i,
        /['";]\s*(--)|(\/\*)/,
        /\bundefined\b|\bnull\b/i,
        /\{\{.*\}\}/,
    ];

    for (const pattern of injectionPatterns) {
        if (pattern.test(password)) {
            return { valid: false, message: 'Senha contém caracteres não permitidos.', strength: 0, suspicious: true };
        }
    }

    const specialChars = password.replace(/[a-zA-Z0-9]/g, '').length;
    const specialRatio = specialChars / password.length;
    if (specialRatio > 0.5) {
        return { valid: false, message: 'Senha contém símbolos demais. Use letras e números também.', strength: 0, suspicious: true };
    }

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

    let strength = 3;
    if (password.length >= 12 && specialChars >= 1) strength = 4;
    if (password.length >= 16 && specialChars >= 2 && hasUpper && hasNumber) strength = 5;

    return { valid: true, message: '', strength };
}

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

export function detectFraud({ name, email, phone, address }) {
    const reasons = [];
    let severity = 'low';

    if (name) {
        const nonLatinRegex = /[^\u0000-\u024F\u1E00-\u1EFF\s\-'.]/;
        if (nonLatinRegex.test(name)) {
            reasons.push('Nome contém caracteres não-latinos (possível origem estrangeira)');
            severity = 'high';
        }
    }

    if (phone && address) {
        const ddd = extractDDD(phone);
        const uf = extractUF(address);

        if (ddd && uf) {
            const phoneState = DDD_TO_STATE[ddd];
            if (phoneState && phoneState !== uf) {
                const neighbors = NEIGHBORING_STATES[phoneState] || [];
                if (!neighbors.includes(uf)) {
                    reasons.push(`DDD ${ddd} (${phoneState}) não corresponde ao endereço (${uf})`);
                    severity = severity === 'high' ? 'high' : 'medium';
                }
            }
        }
    }

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
