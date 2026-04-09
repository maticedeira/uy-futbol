import { db } from '../db/client.js'

const LOGO_MAP: Record<string, string> = {
  Peñarol:
    'https://www.thesportsdb.com/images/media/team/badge/uuwpux1473541171.png',
  Nacional:
    'https://www.thesportsdb.com/images/media/team/badge/rzuvtp1514031632.png',
  'Racing Club Montevideo':
    'https://www.thesportsdb.com/images/media/team/badge/ysixtw1513874368.png',
  'Montevideo Wanderers':
    'https://www.thesportsdb.com/images/media/team/badge/k1yyu11513874982.png',
  'Liverpool FC':
    'https://www.thesportsdb.com/images/media/team/badge/yxcxxl1513869882.png',
  'Defensor Sporting':
    'https://www.thesportsdb.com/images/media/team/badge/r2swtx1513874245.png',
  Cerro:
    'https://www.thesportsdb.com/images/media/team/badge/wd2wuu1513874161.png',
  'Cerro Largo':
    'https://www.thesportsdb.com/images/media/team/badge/xs6w721513873892.png',
  'Danubio FC':
    'https://www.thesportsdb.com/images/media/team/badge/yhkozx1514031545.png',
  'Boston River':
    'https://www.thesportsdb.com/images/media/team/badge/wxvrpx1513874141.png',
  Progreso:
    'https://www.thesportsdb.com/images/media/team/badge/uvsrxr1514031582.png',
  Juventud:
    'https://www.thesportsdb.com/images/media/team/badge/rrdngz1514031601.png',
  'Deportivo Maldonado':
    'https://www.thesportsdb.com/images/media/team/badge/qr3w7x1514031763.png',
  'Central Español':
    'https://www.thesportsdb.com/images/media/team/badge/u4pyqw1514031663.png',
  Albion:
    'https://www.thesportsdb.com/images/media/team/badge/qr3w7x1514031763.png',
  'Montevideo City Torque':
    'https://www.thesportsdb.com/images/media/team/badge/dqvlv41554035503.png',
}

async function main() {
  console.log('Actualizando logos de equipos...')

  for (const [teamName, logoUrl] of Object.entries(LOGO_MAP)) {
    await db.execute(`
      UPDATE teams SET logo_url = '${logoUrl}' WHERE name = '${teamName}'
    `)
    console.log(`✓ ${teamName}`)
  }

  console.log('¡Listo!')
}

main().catch(console.error)
