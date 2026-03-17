export const clients = [
    {
        id: 1,
        name: 'Roberto Almeida',
        email: 'roberto.almeida@email.com',
        phone: '(11) 98765-4321',
        interest: 'Compra',
        status: 'Novo',
        registrationDate: '2024-02-10',
    },
    {
        id: 2,
        name: 'Ana Souza',
        email: 'ana.souza@email.com',
        phone: '(11) 91234-5678',
        interest: 'Aluguel',
        status: 'Em Negociação',
        registrationDate: '2024-02-08',
    },
    {
        id: 3,
        name: 'Carlos Oliveira',
        email: 'carlos.oliveira@email.com',
        phone: '(11) 99876-5432',
        interest: 'Compra',
        status: 'Visita Agendada',
        registrationDate: '2024-02-05',
    },
    {
        id: 4,
        name: 'Fernanda Lima',
        email: 'fernanda.lima@email.com',
        phone: '(11) 95678-1234',
        interest: 'Aluguel',
        status: 'Novo',
        registrationDate: '2024-02-11',
    },
    {
        id: 5,
        name: 'João Pereira',
        email: 'joao.pereira@email.com',
        phone: '(11) 94321-8765',
        interest: 'Compra',
        status: 'Arquivado',
        registrationDate: '2024-01-20',
    },
];

export function getClientById(id) {
    return clients.find(client => client.id === parseInt(id));
}
