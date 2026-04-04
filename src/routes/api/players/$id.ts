import { db } from '#/db'
import { players, teams } from '#/db/schema'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/players/$id')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const playerId = parseInt(params.id as string)

        const player = await db.query.players.findFirst({
          where: (players, { eq }) => eq(players.id, playerId),
          with: {
            team: true,
          },
        })

        if (!player) {
          return Response.json({ error: 'Player not found' }, { status: 404 })
        }

        return Response.json({
          player: {
            ...player,
            transfermarktUrl: player.transfermarktId
              ? `https://www.transfermarkt.com/profil/spieler/${player.transfermarktId}`
              : null,
          },
        })
      },
    },
  },
})
