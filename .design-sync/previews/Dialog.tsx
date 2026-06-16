import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, Button, Input, Label } from 'ionic'

// Rendered open (controlled) so the modal shows statically inside the card.
export const PlaceBid = () => (
  <div className="dark" style={{ position: 'relative', minHeight: 520, background: 'hsl(var(--background))' }}>
    <Dialog open modal={false}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Place a bid</DialogTitle>
          <DialogDescription>
            Helios Ventures II · Series B. Bids are reviewed by an admin before allocation.
          </DialogDescription>
        </DialogHeader>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Label htmlFor="bid">Bid amount (USD)</Label>
          <Input id="bid" defaultValue="2,500,000" />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
          <Button variant="ghost">Cancel</Button>
          <Button variant="primary">Submit bid</Button>
        </div>
      </DialogContent>
    </Dialog>
  </div>
)
