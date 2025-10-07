// prisma/seed.ts

import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

async function main(){
  await prisma.author.createMany({
    data: [
      { name: 'Amina Diop', email: 'amina@example.com' },
      { name: 'Jean Paul', email: 'jean@example.com' },
      { name: 'Fatou K.', email: 'fatou@example.com' }
    ],
    // skipDuplicates: true
  })

  // const authors = await prisma.author.findMany()

  // Création d'un admin (email: admin@example.com / motdepasse: admin123)
  const existingAdmin = await prisma.user.findUnique({ where: { email: 'admin@example.com' } })
  if (!existingAdmin) {
    const hashed = await bcrypt.hash('admin123', 10)
    await prisma.user.create({
      data: {
        name: 'Admin',
        email: 'admin@example.com',
        password: hashed,
        role: 'ADMIN'
      }
    })
  }

  await prisma.project.createMany({
    data: [
      {
        title: 'Portail de paiement local',
        description: 'Intégration mobile-money + stablecoin pour transferts intra-Afrique.',
        status: 'IN_PROGRESS',
        dueDate: new Date(Date.now() + 1000*60*60*24*30)
      },
      {
        title: 'Dashboard RH',
        description: 'Tableau de bord pour la gestion des congés et des paies.',
        status: 'IDEA'
      }
    ],
    // skipDuplicates: true
  })

  // lier auteurs aux projets de façon simple si nécessaire (optionnel)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
