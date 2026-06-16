import { GlassCard, Badge, Button } from 'ionic'

const Surface = ({ children }: any) => (
  <div
    className="dark"
    style={{
      background: 'hsl(var(--background))',
      color: 'hsl(var(--foreground))',
      padding: 32,
      display: 'flex',
      gap: 20,
      flexWrap: 'wrap',
    }}
  >
    {children}
  </div>
)

const muted = { color: 'hsl(var(--muted-foreground))' }

export const ListingCard = () => (
  <Surface>
    <GlassCard style={{ padding: 24, width: 340 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, margin: 0 }}>
            Helios Ventures II
          </h3>
          <p style={{ ...muted, fontSize: 13, margin: '4px 0 0' }}>Series B · Climate Tech</p>
        </div>
        <Badge tone="typePrimary">Primary</Badge>
      </div>
      <p style={{ ...muted, fontSize: 14, lineHeight: 1.5, margin: '0 0 16px' }}>
        $40M target raise. Lead allocation open to accredited investors through Q3.
      </p>
      <Button variant="primary" style={{ width: '100%' }}>
        Place Bid
      </Button>
    </GlassCard>
  </Surface>
)

export const Interactive = () => (
  <Surface>
    <GlassCard interactive style={{ padding: 20, width: 280 }}>
      <p style={{ margin: 0, fontWeight: 500 }}>Northwind Secondary</p>
      <p style={{ ...muted, fontSize: 13, margin: '4px 0 0' }}>
        Hover to lift — interactive cards add a chromatic glow.
      </p>
    </GlassCard>
  </Surface>
)
