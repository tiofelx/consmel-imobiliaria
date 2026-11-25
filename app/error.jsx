'use client';

export default function ErrorPage({ reset }) {
    return (
        <main style={{ minHeight: '100svh', display: 'grid', placeContent: 'center', gap: 16, textAlign: 'center', padding: 24 }}>
            <h1>Algo deu errado</h1>
            <p>Tente novamente em instantes.</p>
            <button type="button" onClick={() => reset()}>Tentar de novo</button>
        </main>
    );
}
