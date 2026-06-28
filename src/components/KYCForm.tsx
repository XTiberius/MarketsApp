'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, CheckCircle2, Plus, Trash2 } from 'lucide-react'
import type { AccountType, EntityType, KycStatus } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AccreditationDefinitions } from '@/components/AccreditationDefinitions'

interface Props {
  userId: string
  kycStatus: KycStatus
  firstName?: string | null
  lastName?: string | null
}

const ENTITY_TYPES: EntityType[] = ['LLC', 'Corp', 'Fund', 'Trust', 'Partnership', 'Other']

type IndividualForm = {
  first_name: string
  last_name: string
  dob: string
  address: string
  phone: string
  occupation: string
  residence: string
  primary_citizenship: string
  ssn_last4: string
  origin_of_funds: string
  accredited_investor: boolean
}

type EntityForm = {
  entity_name: string
  entity_type: EntityType
  ein: string
  incorporation_location: string
  address: string
  phone: string
  owner_name: string
  owner_title: string
  signatory_name: string
  signatory_title: string
  origin_of_funds: string
  accredited_investor: boolean
}

function emptyEntity(): EntityForm {
  return {
    entity_name: '',
    entity_type: 'LLC',
    ein: '',
    incorporation_location: '',
    address: '',
    phone: '',
    owner_name: '',
    owner_title: '',
    signatory_name: '',
    signatory_title: '',
    origin_of_funds: '',
    accredited_investor: false,
  }
}

export function KYCForm({ kycStatus, firstName, lastName }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [accountType, setAccountType] = useState<AccountType | ''>('')
  const [individual, setIndividual] = useState<IndividualForm>({
    first_name: firstName ?? '',
    last_name: lastName ?? '',
    dob: '',
    address: '',
    phone: '',
    occupation: '',
    residence: '',
    primary_citizenship: '',
    ssn_last4: '',
    origin_of_funds: '',
    accredited_investor: false,
  })
  const [entities, setEntities] = useState<EntityForm[]>([emptyEntity()])

  if (kycStatus === 'pending') {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-[hsl(var(--warning)/0.3)] bg-[hsl(var(--warning)/0.08)] p-6 text-center">
        <Clock className="size-7 text-warning" />
        <p className="font-display font-semibold text-foreground">KYC Under Review</p>
        <p className="text-sm text-muted-foreground">
          Your KYC submission is being reviewed. You&apos;ll be notified once approved.
        </p>
      </div>
    )
  }

  if (kycStatus === 'approved') {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-[hsl(var(--success)/0.3)] bg-[hsl(var(--success)/0.08)] p-6 text-center">
        <CheckCircle2 className="size-7 text-success" />
        <p className="font-display font-semibold text-foreground">KYC Approved</p>
        <p className="text-sm text-muted-foreground">
          You are verified as an accredited investor.
        </p>
      </div>
    )
  }

  const includeIndividual = accountType === 'individual' || accountType === 'both'
  const includeEntity = accountType === 'entity' || accountType === 'both'

  function updateIndividual(field: keyof IndividualForm, value: string | boolean) {
    setIndividual((prev) => ({ ...prev, [field]: value }))
  }

  function updateEntity(index: number, field: keyof EntityForm, value: string | boolean) {
    setEntities((prev) =>
      prev.map((e, i) => (i === index ? { ...e, [field]: value } : e))
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!accountType) {
      setError('Please choose how you are investing.')
      return
    }
    setLoading(true)
    setError(null)

    const payload = {
      account_type: accountType,
      individual: includeIndividual ? individual : undefined,
      entities: includeEntity
        ? entities.map((en) => ({
            entity_name: en.entity_name,
            entity_type: en.entity_type,
            ein: en.ein,
            incorporation_location: en.incorporation_location,
            address: en.address,
            phone: en.phone,
            owner_info: { name: en.owner_name, title: en.owner_title },
            signatory_info: { name: en.signatory_name, title: en.signatory_title },
            origin_of_funds: en.origin_of_funds,
            accredited_investor: en.accredited_investor,
          }))
        : undefined,
    }

    const res = await fetch('/api/kyc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const data = await res.json().catch(() => null)

    if (!res.ok) {
      setError(data?.error ?? 'Unable to submit KYC')
      setLoading(false)
      return
    }

    router.refresh()
  }

  const individualFields: { id: keyof IndividualForm; label: string; type?: string }[] = [
    { id: 'first_name', label: 'First Name' },
    { id: 'last_name', label: 'Last Name' },
    { id: 'dob', label: 'Date of Birth', type: 'date' },
    { id: 'address', label: 'Address' },
    { id: 'phone', label: 'Phone Number', type: 'tel' },
    { id: 'occupation', label: 'Occupation' },
    { id: 'residence', label: 'Country of Residence' },
    { id: 'primary_citizenship', label: 'Primary Citizenship' },
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* ── Step 1: how are you investing? ── */}
      <fieldset className="space-y-3">
        <legend className="font-display text-base font-semibold text-foreground">
          How are you investing?
        </legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {(
            [
              { value: 'individual', label: 'Individual', hint: 'As yourself' },
              { value: 'entity', label: 'Entity', hint: 'Company, fund, or trust' },
              { value: 'both', label: 'Both', hint: 'Individual and entity' },
            ] as { value: AccountType; label: string; hint: string }[]
          ).map((opt) => (
            <label
              key={opt.value}
              className={`flex cursor-pointer flex-col gap-1 rounded-xl border p-4 text-sm transition-colors ${
                accountType === opt.value
                  ? 'border-primary bg-[hsl(var(--primary)/0.08)]'
                  : 'border-border hover:bg-muted/40'
              }`}
            >
              <span className="flex items-center gap-2 font-medium text-foreground">
                <input
                  type="radio"
                  name="account_type"
                  value={opt.value}
                  checked={accountType === opt.value}
                  onChange={() => setAccountType(opt.value)}
                  className="size-4 accent-[hsl(var(--primary))]"
                />
                {opt.label}
              </span>
              <span className="pl-6 text-xs text-muted-foreground">{opt.hint}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* ── Step 2: individual details ── */}
      {includeIndividual && (
        <section className="space-y-5">
          <h3 className="font-display text-base font-semibold text-foreground">
            Individual details
          </h3>
          <div className="grid gap-5 sm:grid-cols-2">
            {individualFields.map(({ id, label, type = 'text' }) => (
              <div key={id} className="space-y-2">
                <Label htmlFor={`ind-${id}`}>{label}</Label>
                <Input
                  id={`ind-${id}`}
                  type={type}
                  required
                  value={individual[id] as string}
                  onChange={(e) => updateIndividual(id, e.target.value)}
                />
              </div>
            ))}
            <div className="space-y-2">
              <Label htmlFor="ind-ssn_last4">Last 4 digits of SSN</Label>
              <Input
                id="ind-ssn_last4"
                type="text"
                inputMode="numeric"
                required
                maxLength={4}
                pattern="\d{4}"
                placeholder="1234"
                value={individual.ssn_last4}
                onChange={(e) =>
                  updateIndividual('ssn_last4', e.target.value.replace(/\D/g, '').slice(0, 4))
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ind-origin_of_funds">Origin of funds</Label>
            <Textarea
              id="ind-origin_of_funds"
              required
              placeholder="Describe the source of the funds you intend to invest (e.g. employment income, sale of a business, inheritance)."
              value={individual.origin_of_funds}
              onChange={(e) => updateIndividual('origin_of_funds', e.target.value)}
            />
          </div>
          <AccreditationDefinitions />
          <label className="flex items-start gap-3 rounded-xl border border-border bg-[hsl(var(--background)/0.3)] p-4 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={individual.accredited_investor}
              onChange={(e) => updateIndividual('accredited_investor', e.target.checked)}
              required
              className="mt-0.5 size-4 shrink-0 accent-[hsl(var(--primary))]"
            />
            <span className="text-foreground">
              I certify that I am an accredited investor as defined by the SEC.
            </span>
          </label>
        </section>
      )}

      {/* ── Step 3: entity details (one or more) ── */}
      {includeEntity && (
        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-foreground">
              Entity details
            </h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEntities((prev) => [...prev, emptyEntity()])}
            >
              <Plus className="size-4" /> Add entity
            </Button>
          </div>

          {entities.map((entity, index) => (
            <div key={index} className="space-y-5 rounded-2xl border border-border p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">
                  Entity {index + 1}
                </p>
                {entities.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setEntities((prev) => prev.filter((_, i) => i !== index))
                    }
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-danger"
                  >
                    <Trash2 className="size-3.5" /> Remove
                  </button>
                )}
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`ent-name-${index}`}>Company / Entity Name</Label>
                  <Input
                    id={`ent-name-${index}`}
                    required
                    value={entity.entity_name}
                    onChange={(e) => updateEntity(index, 'entity_name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`ent-type-${index}`}>Entity Type</Label>
                  <Select
                    value={entity.entity_type}
                    onValueChange={(v) => updateEntity(index, 'entity_type', v as EntityType)}
                  >
                    <SelectTrigger id={`ent-type-${index}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ENTITY_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`ent-ein-${index}`}>EIN</Label>
                  <Input
                    id={`ent-ein-${index}`}
                    required
                    placeholder="12-3456789"
                    value={entity.ein}
                    onChange={(e) => updateEntity(index, 'ein', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`ent-incorp-${index}`}>Location of Incorporation</Label>
                  <Input
                    id={`ent-incorp-${index}`}
                    required
                    placeholder="e.g. Delaware, USA"
                    value={entity.incorporation_location}
                    onChange={(e) =>
                      updateEntity(index, 'incorporation_location', e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`ent-address-${index}`}>Business Address</Label>
                  <Input
                    id={`ent-address-${index}`}
                    required
                    value={entity.address}
                    onChange={(e) => updateEntity(index, 'address', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`ent-phone-${index}`}>Phone Number</Label>
                  <Input
                    id={`ent-phone-${index}`}
                    type="tel"
                    required
                    value={entity.phone}
                    onChange={(e) => updateEntity(index, 'phone', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`ent-owner-name-${index}`}>Beneficial Owner Name</Label>
                  <Input
                    id={`ent-owner-name-${index}`}
                    required
                    value={entity.owner_name}
                    onChange={(e) => updateEntity(index, 'owner_name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`ent-owner-title-${index}`}>Beneficial Owner Title</Label>
                  <Input
                    id={`ent-owner-title-${index}`}
                    required
                    value={entity.owner_title}
                    onChange={(e) => updateEntity(index, 'owner_title', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`ent-sig-name-${index}`}>Authorized Signatory Name</Label>
                  <Input
                    id={`ent-sig-name-${index}`}
                    required
                    value={entity.signatory_name}
                    onChange={(e) => updateEntity(index, 'signatory_name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`ent-sig-title-${index}`}>Authorized Signatory Title</Label>
                  <Input
                    id={`ent-sig-title-${index}`}
                    required
                    value={entity.signatory_title}
                    onChange={(e) => updateEntity(index, 'signatory_title', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`ent-origin-${index}`}>Origin of funds</Label>
                <Textarea
                  id={`ent-origin-${index}`}
                  required
                  placeholder="Describe the source of the funds this entity intends to invest."
                  value={entity.origin_of_funds}
                  onChange={(e) => updateEntity(index, 'origin_of_funds', e.target.value)}
                />
              </div>

              <label className="flex items-start gap-3 rounded-xl border border-border bg-[hsl(var(--background)/0.3)] p-4 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={entity.accredited_investor}
                  onChange={(e) => updateEntity(index, 'accredited_investor', e.target.checked)}
                  required
                  className="mt-0.5 size-4 shrink-0 accent-[hsl(var(--primary))]"
                />
                <span className="text-foreground">
                  I certify that this entity is an accredited investor as defined by the SEC.
                </span>
              </label>
            </div>
          ))}

          {!includeIndividual && <AccreditationDefinitions />}
        </section>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        disabled={loading || !accountType}
        className="w-full"
      >
        {loading ? 'Submitting…' : 'Submit KYC'}
      </Button>
    </form>
  )
}
