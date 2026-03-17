import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'optional',
});

export const metadata = {
  title: 'Consmel Imobiliária | Encontre o Imóvel dos Seus Sonhos',
  description: 'Imobiliária especializada em compra, venda e locação de imóveis. Casas, apartamentos, terrenos e muito mais. Encontre seu imóvel ideal com a Consmel.',
  keywords: 'imobiliária, imóveis, casas, apartamentos, venda, aluguel, São Paulo',
  authors: [{ name: 'Consmel Imobiliária' }],
  openGraph: {
    title: ' Consmel Imobiliária | Encontre o Imóvel dos Seus Sonhos',
    description: 'Imobiliária especializada em compra, venda e locação de imóveis.',
    type: 'website',
    locale: 'pt_BR',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: "if ('scrollRestoration' in history) { history.scrollRestoration = 'manual'; }"
          }}
        />
      </head>
      <body className={inter.className} suppressHydrationWarning={true}>
        {children}
      </body>
    </html>
  );
}

