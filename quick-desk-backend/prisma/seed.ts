import { PrismaClient } from "@prisma/client";
import { hash } from "bcrypt";

const prisma = new PrismaClient();

async function seed() {
    console.log('Seeding default users');
    const defaultPassword = await hash('123456', 10);

    await prisma.user.upsert({
        where: { email: 'agent@gmail.com' },
        update: {},
        create: {
            email: 'agent@gmail.com',
            password: defaultPassword,
            firstName: 'Agent',
            lastName: 'One',
            role: 'AGENT'
        }
    });
    await prisma.user.upsert({
        where: { email: 'emp@gmail.com' },
        update: {},
        create: {
            email: 'emp@gmail.com',
            password: defaultPassword,
            firstName: 'Employee',
            lastName: 'One',
            role: 'EMPLOYEE'
        }
    });
}
seed().then(() => {
    console.log("Seeding complete");
}).catch((e) => {
    console.error(e);
    process.exit(1);
}).finally(async () => {
    await prisma.$disconnect();
});