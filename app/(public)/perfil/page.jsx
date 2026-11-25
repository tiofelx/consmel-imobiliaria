import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/auth';
import ProfileContent from './ProfileContent';

export default async function ProfilePage() {
    const session = await verifySession();

    if (!session) {
        redirect('/login');
    }

    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: {
            name: true,
            email: true,
            role: true,
            twoFactorEnabled: true,
            password: true,
        },
    });

    if (!user) {
        redirect('/login');
    }

    // O hash não vai para o navegador: só a informação de que há senha.
    const { password, ...profile } = user;
    return <ProfileContent user={{ ...profile, hasPassword: Boolean(password) }} />;
}
