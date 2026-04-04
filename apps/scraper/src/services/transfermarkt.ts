import axios from 'axios'
import { load } from 'cheerio'
import { transfermarktClient } from '../utils/http.js'
import { db } from '../db/client.js'
import { players } from '../schema/index.js'
import { eq } from 'drizzle-orm'

interface TransfermarktPlayer {
  id: string
  name: string
  photoUrl: string
  position: string
  stats: {
    marketValue: string
    appearances: number
    goals: number
    assists: number
  }
}

export async function fetchPlayerFromTransfermarkt(
  transfermarktId: string,
): Promise<TransfermarktPlayer | null> {
  try {
    const html = await transfermarktClient.get<string>(
      `/profil/spieler/${transfermarktId}`,
    )
    const $ = load(html)

    const name = $('h1[data-player-name]').text().trim()
    const photoUrl = $('.data-header__profile-image').attr('src') || ''
    const position = $('.data-header__position span').first().text().trim()

    const marketValue =
      $('.data-header__market-value-wrapper').attr('data-market-value') || ''
    const appearances =
      parseInt(
        $('[data-stat="appearances"] .data-header__statistic').text().trim(),
      ) || 0
    const goals =
      parseInt(
        $('[data-stat="goals"] .data-header__statistic').text().trim(),
      ) || 0
    const assists =
      parseInt(
        $('[data-stat="assists"] .data-header__statistic').text().trim(),
      ) || 0

    return {
      id: transfermarktId,
      name,
      photoUrl,
      position,
      stats: {
        marketValue,
        appearances,
        goals,
        assists,
      },
    }
  } catch (error) {
    console.error(`Failed to fetch player ${transfermarktId}:`, error)
    return null
  }
}

export async function getOrFetchPlayerPhoto(
  playerId: number,
): Promise<string | null> {
  const player = await db.query.players.findFirst({
    where: (players, { eq }) => eq(players.id, playerId),
  })

  if (!player) return null

  if (player.photoUrl) return player.photoUrl

  if (player.transfermarktId) {
    const data = await fetchPlayerFromTransfermarkt(player.transfermarktId)
    if (data?.photoUrl) {
      await db
        .update(players)
        .set({ photoUrl: data.photoUrl })
        .where(eq(players.id, playerId))
      return data.photoUrl
    }
  }

  return null
}
