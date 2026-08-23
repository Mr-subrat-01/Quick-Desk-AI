import { PrismaClient } from "@prisma/client";
import { hash } from "bcrypt";

const prisma = new PrismaClient();

async function seed() {
    console.log('Seeding default users');
    const defaultPassword = await hash('123456', 10);

    const usersToSeed = [
        { email: 'agent@gmail.com', firstName: 'Amit', lastName: 'Sharma', role: 'AGENT' },
        { email: 'agent2@gmail.com', firstName: 'Vikram', lastName: 'Singh', role: 'AGENT' },
        { email: 'agent3@gmail.com', firstName: 'Priya', lastName: 'Sen', role: 'AGENT' },
        { email: 'agent4@gmail.com', firstName: 'Neha', lastName: 'Gupta', role: 'AGENT' },

        { email: 'emp@gmail.com', firstName: 'Rohan', lastName: 'Patel', role: 'EMPLOYEE' },
        { email: 'emp2@gmail.com', firstName: 'Aarav', lastName: 'Joshi', role: 'EMPLOYEE' },
        { email: 'emp3@gmail.com', firstName: 'Kshitij', lastName: 'Iyer', role: 'EMPLOYEE' },
        { email: 'emp4@gmail.com', firstName: 'Deepa', lastName: 'Nair', role: 'EMPLOYEE' },
        { email: 'emp5@gmail.com', firstName: 'Subrat', lastName: 'Mishra', role: 'EMPLOYEE' },
    ];

    for (const u of usersToSeed) {
        await prisma.user.upsert({
            where: { email: u.email },
            update: {},
            create: {
                email: u.email,
                password: defaultPassword,
                firstName: u.firstName,
                lastName: u.lastName,
                role: u.role
            }
        });
    }
}
seed().then(() => {
    console.log("Seeding complete");
}).catch((e) => {
    console.error(e);
    process.exit(1);
}).finally(async () => {
    await prisma.$disconnect();
});