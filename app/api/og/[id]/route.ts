import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { KATEGORI_LABEL, KATEGORI_EMOJI, STATUS_LABEL, STATUS_COLOR, formatTanggal } from '@/lib/utils'
import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const fontPath = resolve(
  require.resolve('@fontsource/plus-jakarta-sans/package.json'),
  '../files/plus-jakarta-sans-latin-700-normal.woff'
)
const font = readFileSync(fontPath)

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const laporan = await prisma.laporan.findFirst({
    where: { OR: [{ tiketId: id }, { id }] },
  })

  if (!laporan) {
    return new Response('Not found', { status: 404 })
  }

  const statusColor = STATUS_COLOR[laporan.status]
  const emoji = KATEGORI_EMOJI[laporan.kategori]
  const kategoriLabel = KATEGORI_LABEL[laporan.kategori]
  const statusLabel = STATUS_LABEL[laporan.status]

  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          width: '1200px',
          height: '630px',
          background: '#1B4332',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px',
          fontFamily: 'Plus Jakarta Sans',
        },
        children: [
          {
            type: 'div',
            props: {
              style: { display: 'flex', flexDirection: 'column', gap: '16px' },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      color: '#F5C842',
                      fontSize: '20px',
                      fontWeight: 700,
                      letterSpacing: '2px',
                      textTransform: 'uppercase',
                    },
                    children: 'Tagih Supen',
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: { color: '#ffffff', fontSize: '72px' },
                    children: emoji,
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: { color: '#ffffff', fontSize: '48px', fontWeight: 700 },
                    children: kategoriLabel,
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: { color: '#d1fae5', fontSize: '28px' },
                    children: `📍 ${laporan.lokasi}`,
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      marginTop: '8px',
                    },
                    children: [
                      {
                        type: 'div',
                        props: {
                          style: {
                            background: statusColor,
                            color: '#ffffff',
                            fontSize: '20px',
                            fontWeight: 700,
                            padding: '8px 20px',
                            borderRadius: '100px',
                          },
                          children: statusLabel,
                        },
                      },
                      {
                        type: 'div',
                        props: {
                          style: { color: '#86efac', fontSize: '20px' },
                          children: laporan.tiketId,
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
          {
            type: 'div',
            props: {
              style: {
                color: '#6ee7b7',
                fontSize: '18px',
                display: 'flex',
                justifyContent: 'space-between',
              },
              children: [
                { type: 'div', props: { children: `tagihsupen.id · Sungai Penuh Juara` } },
                {
                  type: 'div',
                  props: { children: formatTanggal(laporan.createdAt) },
                },
              ],
            },
          },
        ],
      },
    },
    {
      width: 1200,
      height: 630,
      fonts: [{ name: 'Plus Jakarta Sans', data: font, weight: 700 }],
    }
  )

  const resvg = new Resvg(svg)
  const png = resvg.render().asPng()

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
