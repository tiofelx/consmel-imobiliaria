import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import ProfileContent from '@/app/(public)/perfil/ProfileContent';

export default async function AdminProfile() {
    const session = await requireAdmin();
    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { name: true, email: true, role: true, twoFactorEnabled: true, password: true },
    });

    // O hash não vai para o navegador: só a informação de que há senha.
    const { password, ...profile } = user;
    return <ProfileContent user={{ ...profile, hasPassword: Boolean(password) }} />;
}
