import type { ReactNode } from 'react'
import type { TranslationKey } from '../../lib/i18n'
import {
  MEMBERSHIP_BASE_FEE,
  MEMBERSHIP_MANUAL_PAYMENT_DETAILS,
  formatMembershipMoney,
} from '../../lib/membership-fee'
import type { FormField } from '../../lib/register.validation'

export function MembershipFeeSummary({ t }: { t: (key: TranslationKey) => string }) {
  return (
    <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-left text-sm text-amber-950 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">
        {t('signup.fee.label')}
      </p>
      <p className="mt-2 text-base font-black text-amber-950">
        {formatMembershipMoney(MEMBERSHIP_BASE_FEE)} + {t('signup.fee.processingCharges')}
      </p>
      <p className="mt-1 leading-6 text-amber-800">
        {t('register.fee.payVia').replace('{bank}', MEMBERSHIP_MANUAL_PAYMENT_DETAILS.bankName)}
      </p>
    </div>
  )
}

export function FormSection({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section className="reg-section">
      <div className="reg-section-header">
        <div>
          <h2 className="reg-section-title">{title}</h2>
          <p className="reg-section-desc">{description}</p>
        </div>
      </div>

      <div className="reg-section-body">{children}</div>
    </section>
  )
}

export function Field({
  name,
  label,
  children,
  required,
  hint,
  error,
  className = '',
}: {
  name: FormField
  label: string
  children: ReactNode
  required?: boolean
  hint?: string
  error?: string
  className?: string
}) {
  return (
    <div className={`reg-field ${className}`}>
      <label htmlFor={name} className="reg-label">
        {label}
        {required ? (
          <span className="reg-required" aria-hidden="true">
            {' '}
            *
          </span>
        ) : null}
      </label>

      {hint ? (
        <span id={`${name}-hint`} className="reg-hint">
          {hint}
        </span>
      ) : null}

      {children}

      {error ? (
        <p id={`${name}-error`} className="reg-error-text">
          {error}
        </p>
      ) : null}
    </div>
  )
}
