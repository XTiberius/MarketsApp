import { Textarea, Label } from 'ionic'

const Surface = ({ children }: any) => (
  <div className="dark" style={{ background: 'hsl(var(--background))', padding: 32, width: 420 }}>
    {children}
  </div>
)

export const Default = () => (
  <Surface>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <Label htmlFor="memo">Investment memo</Label>
      <Textarea id="memo" rows={4} placeholder="Share the thesis behind your bid…" />
    </div>
  </Surface>
)

export const WithValue = () => (
  <Surface>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <Label htmlFor="notes">Diligence notes</Label>
      <Textarea
        id="notes"
        rows={4}
        defaultValue={'Strong revenue retention (>120% NDR). Confirm cap table before allocation.'}
      />
    </div>
  </Surface>
)
