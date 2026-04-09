// src/utils/team-logos.ts

const LOGO_URLS: Record<string, string> = {
  penarol:
    'https://www.thesportsdb.com/images/media/team/badge/uuwpux1473541171.png',
  'club atltico penarol':
    'https://www.thesportsdb.com/images/media/team/badge/uuwpux1473541171.png',
  nacional:
    'https://www.thesportsdb.com/images/media/team/badge/rzuvtp1514031632.png',
  'club nacional de football':
    'https://www.thesportsdb.com/images/media/team/badge/rzuvtp1514031632.png',
  'racing club montevideo':
    'https://www.thesportsdb.com/images/media/team/badge/ysixtw1513874368.png',
  racing:
    'https://www.thesportsdb.com/images/media/team/badge/ysixtw1513874368.png',
  'montevideo wanderers':
    'https://www.thesportsdb.com/images/media/team/badge/k1yyu11513874982.png',
  wanderers:
    'https://www.thesportsdb.com/images/media/team/badge/k1yyu11513874982.png',
  'liverpool fc':
    'https://www.thesportsdb.com/images/media/team/badge/yxcxxl1513869882.png',
  liverpool:
    'https://www.thesportsdb.com/images/media/team/badge/yxcxxl1513869882.png',
  'defensor sporting':
    'https://www.thesportsdb.com/images/media/team/badge/r2swtx1513874245.png',
  defensor:
    'https://www.thesportsdb.com/images/media/team/badge/r2swtx1513874245.png',
  cerro:
    'https://www.thesportsdb.com/images/media/team/badge/wd2wuu1513874161.png',
  'cerro largo':
    'https://www.thesportsdb.com/images/media/team/badge/xs6w721513873892.png',
  'danubio fc':
    'https://www.thesportsdb.com/images/media/team/badge/yhkozx1514031545.png',
  danubio:
    'https://www.thesportsdb.com/images/media/team/badge/yhkozx1514031545.png',
  'boston river':
    'https://www.thesportsdb.com/images/media/team/badge/wxvrpx1513874141.png',
  progreso:
    'https://www.thesportsdb.com/images/media/team/badge/uvsrxr1514031582.png',
  juventud:
    'https://www.thesportsdb.com/images/media/team/badge/rrdngz1514031601.png',
  'deportivo maldonado':
    'https://www.thesportsdb.com/images/media/team/badge/qr3w7x1514031763.png',
  maldonado:
    'https://www.thesportsdb.com/images/media/team/badge/qr3w7x1514031763.png',
  'central espanol':
    'https://www.thesportsdb.com/images/media/team/badge/u4pyqw1514031663.png',
  'central espaa':
    'https://www.thesportsdb.com/images/media/team/badge/u4pyqw1514031663.png',
  albion:
    'https://www.thesportsdb.com/images/media/team/badge/qr3w7x1514031763.png',
  'albion fc':
    'https://www.thesportsdb.com/images/media/team/badge/qr3w7x1514031763.png',
  'montevideo city torque':
    'https://www.thesportsdb.com/images/media/team/badge/dqvlv41554035503.png',
  torque:
    'https://www.thesportsdb.com/images/media/team/badge/dqvlv41554035503.png',
}

export function getTeamLogo(teamName: string): string | null {
  if (!teamName) return null

  const normalized = teamName.toLowerCase().trim()

  // Direct match
  if (LOGO_URLS[normalized]) {
    return LOGO_URLS[normalized]
  }

  // Partial match
  for (const [key, url] of Object.entries(LOGO_URLS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return url
    }
  }

  return null
}
