import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, Label } from 'ionic'

// The open listbox is interaction-driven (Radix portal + popper positioning),
// so the card shows the styled trigger with a selected value — how it appears
// at rest in a form. Options are composed for real usage.
export const Default = () => (
  <div className="dark" style={{ background: 'hsl(var(--background))', padding: 32, width: 360 }}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <Label htmlFor="ltype">Listing type</Label>
      <Select defaultValue="primary">
        <SelectTrigger id="ltype">
          <SelectValue placeholder="Select a type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="primary">Primary</SelectItem>
          <SelectItem value="secondary">Secondary</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>
)

export const Placeholder = () => (
  <div className="dark" style={{ background: 'hsl(var(--background))', padding: 32, width: 360 }}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <Label htmlFor="status">Bid status</Label>
      <Select>
        <SelectTrigger id="status">
          <SelectValue placeholder="Filter by status…" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="placed">Placed</SelectItem>
          <SelectItem value="accepted">Accepted</SelectItem>
          <SelectItem value="invested">Invested</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>
)
