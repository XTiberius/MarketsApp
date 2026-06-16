import { Button } from 'ionic'

const Surface = ({ children }: any) => (
  <div
    className="dark"
    style={{
      background: 'hsl(var(--background))',
      padding: 32,
      display: 'flex',
      flexWrap: 'wrap',
      gap: 14,
      alignItems: 'center',
    }}
  >
    {children}
  </div>
)

export const Variants = () => (
  <Surface>
    <Button variant="primary">Place Bid</Button>
    <Button variant="glass">View Listing</Button>
    <Button variant="outline">Save Draft</Button>
    <Button variant="ghost">Cancel</Button>
    <Button variant="destructive">Withdraw</Button>
    <Button variant="link">Learn more</Button>
  </Surface>
)

export const Sizes = () => (
  <Surface>
    <Button size="sm">Small</Button>
    <Button size="md">Medium</Button>
    <Button size="lg">Large</Button>
  </Surface>
)

export const Disabled = () => (
  <Surface>
    <Button disabled>Submitting…</Button>
    <Button variant="outline" disabled>
      Unavailable
    </Button>
  </Surface>
)
