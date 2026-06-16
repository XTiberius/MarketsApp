import { Badge } from 'ionic'

const Surface = ({ children }: any) => (
  <div
    className="dark"
    style={{
      background: 'hsl(var(--background))',
      padding: 32,
      display: 'flex',
      flexWrap: 'wrap',
      gap: 10,
      alignItems: 'center',
    }}
  >
    {children}
  </div>
)

export const Tones = () => (
  <Surface>
    <Badge tone="neutral">Draft</Badge>
    <Badge tone="typePrimary">Primary</Badge>
    <Badge tone="typeSecondary">Secondary</Badge>
    <Badge tone="success">Published</Badge>
    <Badge tone="warning">Pending</Badge>
    <Badge tone="danger">Closed</Badge>
    <Badge tone="info">Accepted</Badge>
  </Surface>
)
