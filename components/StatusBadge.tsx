import { Status } from '@prisma/client'
import { STATUS_COLOR, STATUS_LABEL } from '@/lib/utils'

export default function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className="text-xs font-bold px-2.5 py-1 rounded-full text-white"
      style={{ backgroundColor: STATUS_COLOR[status] }}
    >
      {STATUS_LABEL[status]}
    </span>
  )
}
