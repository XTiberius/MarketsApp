import { Skeleton, GlassCard } from 'ionic'

const Surface = ({ children }: any) => (
  <div className="dark" style={{ background: 'hsl(var(--background))', padding: 32 }}>
    {children}
  </div>
)

export const Lines = () => (
  <Surface>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: 320 }}>
      <Skeleton style={{ height: 16, width: '70%' }} />
      <Skeleton style={{ height: 16, width: '90%' }} />
      <Skeleton style={{ height: 16, width: '50%' }} />
    </div>
  </Surface>
)

export const ListingCardLoading = () => (
  <Surface>
    <GlassCard style={{ padding: 24, width: 320, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Skeleton style={{ height: 22, width: '60%' }} />
      <Skeleton style={{ height: 14, width: '40%' }} />
      <Skeleton style={{ height: 60, width: '100%' }} />
      <Skeleton style={{ height: 40, width: '100%' }} />
    </GlassCard>
  </Surface>
)
