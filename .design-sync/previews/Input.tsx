import { Input, Label } from 'ionic'

const Field = ({ children }: any) => (
  <div
    className="dark"
    style={{ background: 'hsl(var(--background))', padding: 32, width: 360 }}
  >
    {children}
  </div>
)

export const Default = () => (
  <Field>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <Label htmlFor="email">Work email</Label>
      <Input id="email" type="email" placeholder="investor@fund.com" />
    </div>
  </Field>
)

export const WithValue = () => (
  <Field>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <Label htmlFor="amount">Bid amount (USD)</Label>
      <Input id="amount" defaultValue="2,500,000" />
    </div>
  </Field>
)

export const Disabled = () => (
  <Field>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <Label htmlFor="locked">Allocation</Label>
      <Input id="locked" defaultValue="Closed" disabled />
    </div>
  </Field>
)
