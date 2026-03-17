// Initial mock data to populate if storage is empty
const INITIAL_EVENTS = [
    { id: 1, date: new Date().toISOString().split('T')[0], title: 'Visita: Casa Jardins', type: 'visit', time: '10:00', description: 'Cliente interessado na área gourmet.' },
    { id: 2, date: new Date().toISOString().split('T')[0], title: 'Reunião: Equipe', type: 'meeting', time: '14:30', description: 'Alinhamento semanal de metas.' },
    { id: 3, date: '2026-02-15', title: 'Visita: Apto Centro', type: 'visit', time: '09:00', description: '' },
    { id: 4, date: '2026-02-18', title: 'Ligação: Cliente João', type: 'call', time: '11:00', description: 'Retornar sobre proposta.' },
    { id: 5, date: '2026-02-20', title: 'Reunião: Banco', type: 'meeting', time: '16:00', description: 'Discutir taxas de financiamento.' },
];

const STORAGE_KEY = 'consmel_agenda_events';

export const agendaService = {
    getEvents: () => {
        if (typeof window === 'undefined') return INITIAL_EVENTS;

        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_EVENTS));
            return INITIAL_EVENTS;
        }
        return JSON.parse(stored);
    },

    saveEvent: (event) => {
        const events = agendaService.getEvents();

        if (event.id) {
            // Update existing
            const index = events.findIndex(e => e.id === event.id);
            if (index !== -1) {
                events[index] = event;
            }
        } else {
            // Create new
            event.id = Date.now(); // Simple ID generation
            events.push(event);
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
        return events;
    },

    deleteEvent: (id) => {
        const events = agendaService.getEvents();
        const filtered = events.filter(e => e.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        return filtered;
    }
};
