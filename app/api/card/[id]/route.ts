import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { KATEGORI_LABEL, KATEGORI_EMOJI, formatTanggal } from '@/lib/utils'
import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import { readFileSync } from 'fs'
import { join } from 'path'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const pkgDir = join(require.resolve('@fontsource/plus-jakarta-sans/package.json'), '..')
const fontBold = readFileSync(join(pkgDir, 'files/plus-jakarta-sans-latin-700-normal.woff'))
const fontRegular = readFileSync(join(pkgDir, 'files/plus-jakarta-sans-latin-400-normal.woff'))

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const laporan = await prisma.laporan.findFirst({
    where: { OR: [{ tiketId: id }, { id }] },
  })

  if (!laporan) return new Response('Not found', { status: 404 })

  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  const wargaKe = await prisma.laporan.count({
    where: { status: { not: 'MENUNGGU_WA' }, createdAt: { gte: startOfDay } },
  })

  const emoji = KATEGORI_EMOJI[laporan.kategori]
  const kategoriLabel = KATEGORI_LABEL[laporan.kategori]

  // satori accepts plain objects but its types expect ReactNode
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const node: any = {
    type: 'div',
      props: {
        style: {
          width: '800px',
          height: '800px',
          background: '#0A1F14',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'Plus Jakarta Sans',
          padding: '0px',
          overflow: 'hidden',
        },
        children: [
          // Top bar
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '32px 48px 24px',
                borderBottom: '1px solid #1B4332',
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      color: '#F5C842',
                      fontSize: '22px',
                      fontWeight: 700,
                      letterSpacing: '3px',
                    },
                    children: 'TAGIH SUPEN',
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      color: '#6EE7B7',
                      fontSize: '16px',
                      fontWeight: 400,
                    },
                    children: 'Sungai Penuh Juara',
                  },
                },
              ],
            },
          },

          // Hero: suara ke-N
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                gap: '0px',
                padding: '32px 48px',
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      color: '#6EE7B7',
                      fontSize: '18px',
                      fontWeight: 400,
                      letterSpacing: '4px',
                      textTransform: 'uppercase',
                    },
                    children: 'SUARA KE-',
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      color: '#F5C842',
                      fontSize: '180px',
                      fontWeight: 700,
                      lineHeight: '1',
                      marginTop: '-8px',
                    },
                    children: String(wargaKe),
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      color: '#86EFAC',
                      fontSize: '20px',
                      fontWeight: 400,
                      marginTop: '4px',
                    },
                    children: 'hari ini',
                  },
                },
              ],
            },
          },

          // Divider
          {
            type: 'div',
            props: {
              style: {
                height: '1px',
                background: '#1B4332',
                margin: '0 48px',
              },
            },
          },

          // Laporan detail
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                flexDirection: 'column',
                padding: '28px 48px 24px',
                gap: '10px',
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      color: '#FFFFFF',
                      fontSize: '38px',
                      fontWeight: 700,
                    },
                    children: `${emoji}  ${kategoriLabel}`,
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      color: '#86EFAC',
                      fontSize: '24px',
                      fontWeight: 400,
                    },
                    children: `📍  ${laporan.lokasi}`,
                  },
                },
              ],
            },
          },

          // Footer
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '20px 48px 32px',
                borderTop: '1px solid #1B4332',
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: { display: 'flex', flexDirection: 'column', gap: '4px' },
                    children: [
                      {
                        type: 'div',
                        props: {
                          style: { color: '#6EE7B7', fontSize: '14px', letterSpacing: '2px' },
                          children: laporan.tiketId,
                        },
                      },
                      {
                        type: 'div',
                        props: {
                          style: { color: '#4ADE80', fontSize: '13px' },
                          children: formatTanggal(laporan.createdAt),
                        },
                      },
                    ],
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      color: '#F5C842',
                      fontSize: '18px',
                      fontWeight: 700,
                      letterSpacing: '1px',
                    },
                    children: 'tagihsupen.id',
                  },
                },
              ],
            },
          },
        ],
      },
    },
  }

  const svg = await satori(node, {
    width: 800,
    height: 800,
    fonts: [
      { name: 'Plus Jakarta Sans', data: fontBold, weight: 700 },
      { name: 'Plus Jakarta Sans', data: fontRegular, weight: 400 },
    ],
  })

  const resvg = new Resvg(svg)
  const png = resvg.render().asPng()

  return new Response(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=60',
    },
  })
}
