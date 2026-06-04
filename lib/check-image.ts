export interface ImageIssue {
  code: 'DARK' | 'BRIGHT' | 'BLUR' | 'BLANK' | 'SMALL'
  message: string
}

export interface ImageQualityResult {
  ok: boolean
  issues: ImageIssue[]
}

export async function checkImageQuality(file: File): Promise<ImageQualityResult> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      const issues: ImageIssue[] = []

      if (img.naturalWidth < 300 || img.naturalHeight < 300) {
        issues.push({ code: 'SMALL', message: 'Foto terlalu kecil, gunakan kamera utama' })
      }

      const SIZE = 150
      const canvas = document.createElement('canvas')
      canvas.width = SIZE
      canvas.height = SIZE
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, SIZE, SIZE)

      const data = ctx.getImageData(0, 0, SIZE, SIZE).data
      const total = SIZE * SIZE

      // Luminance per pixel
      const lumas: number[] = []
      for (let i = 0; i < data.length; i += 4) {
        lumas.push(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2])
      }

      const avgLuma = lumas.reduce((a, b) => a + b, 0) / total

      if (avgLuma < 40) {
        issues.push({ code: 'DARK', message: 'Foto terlalu gelap, coba tambah pencahayaan' })
      } else if (avgLuma > 220) {
        issues.push({ code: 'BRIGHT', message: 'Foto terlalu terang / silau' })
      }

      // Blank check: std dev luminance
      if (!issues.some((i) => i.code === 'DARK' || i.code === 'BRIGHT')) {
        const variance = lumas.reduce((sum, l) => sum + (l - avgLuma) ** 2, 0) / total
        if (Math.sqrt(variance) < 10) {
          issues.push({ code: 'BLANK', message: 'Foto terlihat kosong atau tidak ada objek' })
        }
      }

      // Blur check: Laplacian variance on grayscale
      if (!issues.some((i) => i.code === 'BLANK' || i.code === 'DARK' || i.code === 'BRIGHT')) {
        const lap: number[] = []
        for (let y = 1; y < SIZE - 1; y++) {
          for (let x = 1; x < SIZE - 1; x++) {
            const idx = y * SIZE + x
            lap.push(
              -lumas[idx - SIZE] +
                -lumas[idx - 1] +
                4 * lumas[idx] +
                -lumas[idx + 1] +
                -lumas[idx + SIZE]
            )
          }
        }
        const lapMean = lap.reduce((a, b) => a + b, 0) / lap.length
        const lapVar = lap.reduce((sum, l) => sum + (l - lapMean) ** 2, 0) / lap.length
        if (lapVar < 100) {
          issues.push({ code: 'BLUR', message: 'Foto buram atau tidak fokus' })
        }
      }

      URL.revokeObjectURL(url)
      resolve({ ok: issues.length === 0, issues })
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve({ ok: true, issues: [] })
    }

    img.src = url
  })
}
