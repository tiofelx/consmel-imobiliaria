const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export default function robots() {
    return {
        rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api', '/perfil', '/login', '/esqueci-senha'] },
        sitemap: `${BASE_URL}/sitemap.xml`,
    };
}
