import { Trash2, Wrench, Droplets, Lightbulb, ShoppingBag, MoreHorizontal } from 'lucide-react'
import type { Kategori } from '@prisma/client'
import type { LucideProps } from 'lucide-react'
import type { ComponentType } from 'react'

export const KATEGORI_ICON: Record<Kategori, ComponentType<LucideProps>> = {
  SAMPAH: Trash2,
  JALAN: Wrench,
  DRAINASE: Droplets,
  PENERANGAN: Lightbulb,
  PASAR: ShoppingBag,
  LAINNYA: MoreHorizontal,
}
