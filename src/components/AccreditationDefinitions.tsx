'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

/** SEC accredited-investor criteria, shown next to each attestation checkbox so
 *  the user can read the definition before attesting. Reused for both the
 *  individual and entity attestations. */
export function AccreditationDefinitions() {
  return (
    <div className="rounded-xl border border-border bg-[hsl(var(--background)/0.3)] px-4">
      <Accordion type="single" collapsible>
        <AccordionItem value="defs">
          <AccordionTrigger className="text-sm">
            What is an accredited investor?
          </AccordionTrigger>
          <AccordionContent className="space-y-3">
            <p>
              Under SEC Rule 501 of Regulation D, you generally qualify as an
              accredited investor if you meet at least one of the following:
            </p>
            <div>
              <p className="font-medium text-foreground">Individuals</p>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                <li>
                  Net worth over $1,000,000, alone or with a spouse/partner
                  (excluding the value of your primary residence); or
                </li>
                <li>
                  Income over $200,000 ($300,000 with a spouse/partner) in each
                  of the prior two years, with the same expected this year; or
                </li>
                <li>
                  Hold a Series 7, 65, or 82 license in good standing.
                </li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-foreground">Entities</p>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                <li>
                  Total assets exceeding $5,000,000 and not formed for the
                  specific purpose of this investment; or
                </li>
                <li>
                  An entity in which all equity owners are accredited investors;
                  or
                </li>
                <li>
                  Certain banks, investment companies, and other institutional
                  investors as defined by the SEC.
                </li>
              </ul>
            </div>
            <p className="text-xs">
              This summary is for convenience only and is not legal advice. The
              full definition governs.
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
