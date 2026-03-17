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
        <style
          dangerouslySetInnerHTML={{
            __html: "html.reload-prepaint-hide body{opacity:0 !important;background:#1f3654 !important;}"
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: "(function(){if('scrollRestoration' in history){history.scrollRestoration='manual';}try{var nav=performance.getEntriesByType&&performance.getEntriesByType('navigation');var type=nav&&nav[0]&&nav[0].type;var isDesktop=(window.matchMedia&&window.matchMedia('(min-width: 1024px)').matches)||window.innerWidth>=1024;if(type==='reload'&&isDesktop){document.documentElement.classList.add('reload-prepaint-hide');window.scrollTo(0,0);requestAnimationFrame(function(){window.scrollTo(0,0);document.documentElement.classList.remove('reload-prepaint-hide');});}}catch(e){}})();"
          }}
        />
      </head>
      <body className={inter.className} suppressHydrationWarning={true}>
        {children}
      </body>
    </html>
  );
}

