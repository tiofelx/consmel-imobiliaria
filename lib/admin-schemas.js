import { z } from 'zod';

// Validação das telas do admin. Folgada em texto livre para não travar registros antigos.
export const clientUpdateSchema = z.object({
    name: z.string().trim().min(2, 'Nome muito curto').max(150),
    email: z.string().trim().min(3, 'E-mail obrigatório').max(150),
    phone: z.string().trim().max(30).optional().nullable(),
    interest: z.enum(['Compra', 'Aluguel', 'Cadastro de Imóvel', 'Solicitação']),
    status: z.enum(['Novo', 'Em Negociação', 'Visita Agendada', 'Arquivado']),
    notes: z.string().max(10000).optional().nullable(),
});

export const eventSchema = z.object({
    title: z.string().trim().min(1, 'Informe o título').max(200),
    date: z.string().refine((value) => !Number.isNaN(Date.parse(value)), 'Data inválida'),
    time: z.string().regex(/^\d{2}:\d{2}$/, 'Horário inválido'),
    duration: z.number().optional(),
    type: z.enum(['visit', 'meeting', 'call']),
    description: z.string().max(2000).optional().nullable(),
});
