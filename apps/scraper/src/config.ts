export const PROMIEDOS_BASE_URL = 'https://www.promiedos.com.ar'
export const TRANSFERMARKT_BASE_URL = 'https://www.transfermarkt.com'

export const SCRAPING_DELAY_MS = 2000
export const MAX_RETRIES = 3

export const TOURNAMENTS = {
  A: {
    APERTURA: 'apertura',
    CLAUSURA: 'clausura',
    INTERMEDIO: 'intermedio',
    ANUAL: 'anual',
    DESCENSO: 'descenso',
  },
  B: {
    COMPETENCIA: 'competencia',
    APERTURA: 'apertura',
    CLAUSURA: 'clausura',
    ANUAL: 'anual',
    DESCENSO: 'descenso',
  },
} as const
