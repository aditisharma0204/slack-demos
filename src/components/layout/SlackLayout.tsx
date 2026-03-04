import type { Persona } from '@/types'
import { ChannelSidebar } from './ChannelSidebar'
import { TopBar } from './TopBar'

interface SlackLayoutProps {
  persona?: Persona
  workspaceName?: string
  channels?: string[]
  dms?: string[]
  selectedChannel?: string
  selectedDm?: string
  searchPlaceholder?: string
  children: React.ReactNode
}

export function SlackLayout({
  workspaceName = 'Acme Inc',
  channels = ['#q3-priorities', '#Project 2', '#project 1'],
  dms = [],
  selectedChannel,
  selectedDm,
  searchPlaceholder,
  children,
}: SlackLayoutProps) {
  return (
    <div className="slack-layout flex flex-col h-screen w-full overflow-hidden bg-[var(--slack-main-bg)]">
      <TopBar searchPlaceholder={searchPlaceholder ?? `Search ${workspaceName}`} />
      <div className="flex flex-1 overflow-hidden">
        <ChannelSidebar
          workspaceName={workspaceName}
          channels={channels}
          dms={dms}
          selectedChannel={selectedChannel}
          selectedDm={selectedDm}
        />
        <div className="slack-main-content flex-1 flex overflow-hidden bg-[var(--slack-main-bg)]">
          {children}
        </div>
      </div>
    </div>
  )
}
