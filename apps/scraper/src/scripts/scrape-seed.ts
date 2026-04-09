import { db } from '../db/client.js'
import { divisions } from '../schema/index.js'

async function seedDivisions() {
  console.log('Seeding divisions...')

  // Division A
  await db
    .insert(divisions)
    .values({
      name: 'Primera División',
      shortName: 'A',
      teamCount: 16,
      hasIntermedio: true,
    })
    .onConflictDoNothing()

  // Division B
  await db
    .insert(divisions)
    .values({
      name: 'Primera B',
      shortName: 'B',
      teamCount: 14,
      hasIntermedio: false,
    })
    .onConflictDoNothing()

  console.log('Divisions seeded successfully')
}

seedDivisions().catch(console.error)
