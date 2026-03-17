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
        },
    });

    if (!user) {
        redirect('/login');
    }

    return <ProfileContent user={user} />;
}
