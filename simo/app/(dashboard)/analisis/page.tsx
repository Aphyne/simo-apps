'use client'

import { useState } from 'react'
import { useAnalisisPerbandingan, AnalisisDetail } from '@/hooks/useAnalisis'
import AnalisisStatCards from '@/components/analisis/AnalisisStatCards'
import AnalisisChart from '@/components/analisis/AnalisisChart'
import AnalisisTable from '@/components/analisis/AnalisisTable'
import AnalisisDetailModal from '@/components/analisis/AnalisisDetailModal'

export default function AnalisisPage() {
  const { data, isLoading } = useAnalisisPerbandingan()
  const [selectedItem, setSelectedItem] = useState<AnalisisDetail | null>(null)

  const ringkasan = data?.ringkasan
  const detail = data?.detail ?? []

  return (
    <div className="space-y-6">
      {selectedItem && (
        <AnalisisDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}

      <AnalisisStatCards ringkasan={ringkasan} isLoading={isLoading} />

      <AnalisisChart detail={detail} isLoading={isLoading} />

      <AnalisisTable
        detail={detail}
        ringkasan={ringkasan}
        isLoading={isLoading}
        onSelectItem={setSelectedItem}
      />
    </div>
  )
}
