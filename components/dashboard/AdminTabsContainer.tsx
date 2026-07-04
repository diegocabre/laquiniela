'use client'

import { useState } from 'react'
import { Competition, Phase, Match } from '@/types'
import AdminEntriesTable from './AdminEntriesTable'
import AdminCompetitionsTab from './AdminCompetitionsTab'
import AdminPhasesTab from './AdminPhasesTab'
import AdminMatchesTab from './AdminMatchesTab'

interface AdminTabsContainerProps {
  entries: any[]
  competitions: Competition[]
  phases: Phase[]
  matches: Match[]
}

type TabType = 'entries' | 'competitions' | 'phases' | 'matches'

export default function AdminTabsContainer({
  entries,
  competitions,
  phases,
  matches,
}: AdminTabsContainerProps) {
  const [activeTab, setActiveTab] = useState<TabType>('entries')

  const tabClass = (tab: TabType) =>
    `px-4 py-2.5 text-sm font-semibold border-b-2 transition cursor-pointer whitespace-nowrap ${
      activeTab === tab
        ? 'border-emerald-500 text-emerald-400'
        : 'border-transparent text-zinc-400 hover:text-white'
    }`

  return (
    <div className="space-y-6">
      {/* Selector de pestañas */}
      <div className="flex border-b border-zinc-900 overflow-x-auto">
        <button onClick={() => setActiveTab('entries')} className={tabClass('entries')}>
          💵 Inscripciones
        </button>
        <button onClick={() => setActiveTab('competitions')} className={tabClass('competitions')}>
          🏆 Competiciones
        </button>
        <button onClick={() => setActiveTab('phases')} className={tabClass('phases')}>
          📅 Fases
        </button>
        <button onClick={() => setActiveTab('matches')} className={tabClass('matches')}>
          ⚽ Partidos y Marcadores
        </button>
      </div>

      {/* Contenido de pestañas */}
      <div>
        {activeTab === 'entries' && <AdminEntriesTable initialEntries={entries} />}
        {activeTab === 'competitions' && <AdminCompetitionsTab initialCompetitions={competitions} />}
        {activeTab === 'phases' && <AdminPhasesTab competitions={competitions} initialPhases={phases} />}
        {activeTab === 'matches' && <AdminMatchesTab phases={phases} initialMatches={matches} />}
      </div>
    </div>
  )
}
