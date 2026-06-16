import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from 'ionic'

const Surface = ({ children }: any) => (
  <div className="dark" style={{ background: 'hsl(var(--background))', padding: 32, width: 480 }}>
    {children}
  </div>
)

const muted = { color: 'hsl(var(--muted-foreground))' }

export const FAQ = () => (
  <Surface>
    <Accordion type="single" collapsible defaultValue="nda">
      <AccordionItem value="nda">
        <AccordionTrigger>Why do I need to sign an NDA?</AccordionTrigger>
        <AccordionContent>
          Listings contain confidential fund terms and portfolio data. Signing the NDA unlocks the full
          data room and lets you place a bid.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="bid">
        <AccordionTrigger>How are bids reviewed?</AccordionTrigger>
        <AccordionContent>
          An admin reviews each bid for allocation fit. You'll be notified when your bid is accepted and
          payment instructions are issued.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="secondary">
        <AccordionTrigger>What's a secondary listing?</AccordionTrigger>
        <AccordionContent>
          A secondary listing offers existing LP interests for sale, rather than a primary commitment into
          a new fund vehicle.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  </Surface>
)
