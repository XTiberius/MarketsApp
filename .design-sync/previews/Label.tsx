import { Label, Input } from 'ionic'

const Surface = ({ children }: any) => (
  <div className="dark" style={{ background: 'hsl(var(--background))', padding: 32, width: 360 }}>
    {children}
  </div>
)

export const WithInput = () => (
  <Surface>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <Label htmlFor="firm">Firm name</Label>
      <Input id="firm" placeholder="Acme Capital Partners" />
    </div>
  </Surface>
)

export const Standalone = () => (
  <Surface>
    <Label>Accredited investor status</Label>
  </Surface>
)
