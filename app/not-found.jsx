import Link from 'next/link';

export default function NotFound() {
    return (
        <main style={{ minHeight: '100svh', display: 'grid', placeContent: 'center', gap: 16, textAlign: 'center', padding: 24 }}>
            <h1>Página não encontrada</h1>
            <p>O endereço pode ter mudado ou o imóvel não está mais disponível.</p>
            <Link href="/">Voltar ao início</Link>
        </main>
    );
}
