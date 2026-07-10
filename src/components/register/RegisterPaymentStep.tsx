import type { ChangeEvent } from 'react'
import type { TranslationKey } from '../../lib/i18n'
import {
  MEMBERSHIP_BASE_FEE,
  MEMBERSHIP_MANUAL_PAYMENT_DETAILS,
  MEMBERSHIP_PAYMENT_QR_IMAGE_PATH,
  MEMBERSHIP_RECEIPT_MAX_SIZE_LABEL,
  type MembershipPayment,
  formatMembershipMoney,
} from '../../lib/membership-fee'
import type {
  FieldErrors,
  FormField,
  RegisterFormState,
} from '../../lib/register.validation'
import { FormSection } from './RegisterFormShell'

export function RegisterPaymentStep({
  title,
  description,
  form,
  fieldErrors,
  locked,
  paymentReceiptLocked,
  photo,
  photoSrc,
  paymentReceipt,
  existingMembershipPayment,
  t,
  updateField,
  handlePhotoChange,
  handlePaymentReceiptChange,
  getDescriptionIds,
}: {
  title: string
  description: string
  form: RegisterFormState
  fieldErrors: FieldErrors
  locked: boolean
  paymentReceiptLocked: boolean
  photo: File | null
  photoSrc: string | null
  paymentReceipt: File | null
  existingMembershipPayment: MembershipPayment | null
  t: (key: TranslationKey) => string
  updateField: <K extends keyof RegisterFormState>(
    field: K,
    value: RegisterFormState[K],
  ) => void
  handlePhotoChange: (event: ChangeEvent<HTMLInputElement>) => void
  handlePaymentReceiptChange: (event: ChangeEvent<HTMLInputElement>) => void
  getDescriptionIds: (field: FormField, hasHint?: boolean) => string | undefined
}) {
  return (
    <FormSection title={title} description={description}>
      <div className="reg-photo-row">
        <div className="reg-photo-preview">
          {photoSrc ? (
            <img
              src={photoSrc}
              alt={t('register.photo.alt')}
              className="reg-photo-img"
            />
          ) : (
            <div className="reg-photo-placeholder" aria-hidden="true">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
              <span>{t('register.photo.none')}</span>
            </div>
          )}
        </div>

        <div className="reg-photo-upload">
          <label
            className={`reg-upload-btn ${
              locked ? 'is-disabled' : 'cursor-pointer'
            }`}
            htmlFor="photo"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            {photo ? photo.name : t('register.photo.choose')}
          </label>

          <input
            id="photo"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handlePhotoChange}
            disabled={locked}
            className="reg-sr-only"
            aria-invalid={Boolean(fieldErrors.photo)}
            aria-describedby={getDescriptionIds('photo', true)}
          />

          <p id="photo-hint" className="reg-upload-hint">
            {t('register.photo.hint')}
          </p>

          {fieldErrors.photo ? (
            <p id="photo-error" className="reg-error-text">
              {fieldErrors.photo}
            </p>
          ) : null}
        </div>
      </div>

      <div className="reg-payment-panel rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        <p className="reg-payment-title font-black">
          {t('register.fee.notice')
            .replace('{amount}', formatMembershipMoney(MEMBERSHIP_BASE_FEE))
            .replace('{charges}', t('signup.fee.processingCharges'))}
        </p>
        <p className="reg-payment-instruction mt-1 text-amber-800">
          {t('register.fee.manualInstruction')
            .replace('{bank}', MEMBERSHIP_MANUAL_PAYMENT_DETAILS.bankName)
            .replace('{account}', MEMBERSHIP_MANUAL_PAYMENT_DETAILS.accountNumber)}
        </p>

        <div className="reg-payment-layout mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(260px,340px)]">
          <div className="reg-payment-details grid gap-3 rounded-2xl bg-white/80 p-4 text-slate-900 ring-1 ring-amber-100 sm:grid-cols-2">
            <div className="reg-payment-detail">
              <p className="text-[0.68rem] font-black uppercase tracking-wide text-slate-500">
                {t('register.payment.bankName')}
              </p>
              <p className="mt-1 font-black">{MEMBERSHIP_MANUAL_PAYMENT_DETAILS.bankName}</p>
            </div>
            <div className="reg-payment-detail">
              <p className="text-[0.68rem] font-black uppercase tracking-wide text-slate-500">
                {t('register.payment.accountTitle')}
              </p>
              <p className="mt-1 font-black">{MEMBERSHIP_MANUAL_PAYMENT_DETAILS.accountTitle}</p>
            </div>
            <div className="reg-payment-detail">
              <p className="text-[0.68rem] font-black uppercase tracking-wide text-slate-500">
                {t('register.payment.accountNo')}
              </p>
              <p className="mt-1 font-black">{MEMBERSHIP_MANUAL_PAYMENT_DETAILS.accountNumber}</p>
            </div>
            <div className="reg-payment-detail">
              <p className="text-[0.68rem] font-black uppercase tracking-wide text-slate-500">
                {t('register.payment.iban')}
              </p>
              <p className="mt-1 break-all font-black">{MEMBERSHIP_MANUAL_PAYMENT_DETAILS.iban}</p>
            </div>
            <div className="reg-payment-detail">
              <p className="text-[0.68rem] font-black uppercase tracking-wide text-slate-500">
                {t('register.payment.network')}
              </p>
              <p className="mt-1 font-black">{MEMBERSHIP_MANUAL_PAYMENT_DETAILS.paymentNetwork}</p>
            </div>
            <div className="reg-payment-detail">
              <p className="text-[0.68rem] font-black uppercase tracking-wide text-slate-500">
                {t('register.payment.tillId')}
              </p>
              <p className="mt-1 font-black">{MEMBERSHIP_MANUAL_PAYMENT_DETAILS.tillId}</p>
            </div>
          </div>

          <div className="reg-payment-qr overflow-hidden rounded-2xl border border-amber-200 bg-white p-3 text-center shadow-sm">
            <img
              src={MEMBERSHIP_PAYMENT_QR_IMAGE_PATH}
              alt="Membership fee payment QR code"
              className="reg-payment-qr-img mx-auto w-full max-w-[300px] rounded-xl object-contain"
              loading="lazy"
            />
            <p className="mt-3 text-sm font-bold text-slate-900">
              {t('register.payment.qrHelp')
                .replace('{network}', MEMBERSHIP_MANUAL_PAYMENT_DETAILS.paymentNetwork)
                .replace('{tillId}', MEMBERSHIP_MANUAL_PAYMENT_DETAILS.tillId)}
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              {t('register.payment.afterPayment')}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <label
            className={`reg-upload-btn reg-payment-upload ${
              paymentReceiptLocked ? 'is-disabled' : 'cursor-pointer'
            }`}
            htmlFor="paymentReceipt"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            {paymentReceipt
              ? paymentReceipt.name
              : existingMembershipPayment?.receipt_file_name ||
                (existingMembershipPayment?.receipt_path
                  ? t('register.payment.receiptUploaded')
                  : t('register.payment.uploadReceipt'))}
          </label>

          <input
            id="paymentReceipt"
            type="file"
            accept="image/png,image/jpeg,image/webp,application/pdf"
            onChange={handlePaymentReceiptChange}
            disabled={paymentReceiptLocked}
            className="reg-sr-only"
            aria-invalid={Boolean(fieldErrors.paymentReceipt)}
            aria-describedby={getDescriptionIds('paymentReceipt', true)}
          />

          <p id="paymentReceipt-hint" className="reg-upload-hint mt-2">
            {t('register.payment.receiptHint').replace('{size}', MEMBERSHIP_RECEIPT_MAX_SIZE_LABEL)}
          </p>

          {paymentReceiptLocked ? (
            <p className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800">
              {t('register.payment.receiptLocked')}
            </p>
          ) : null}

          {fieldErrors.paymentReceipt ? (
            <p id="paymentReceipt-error" className="reg-error-text">
              {fieldErrors.paymentReceipt}
            </p>
          ) : null}
        </div>
      </div>

      <label
        className={`reg-declaration ${
          form.declarationAccepted ? 'reg-declaration--checked' : ''
        }`}
      >
        <input
          type="checkbox"
          checked={form.declarationAccepted}
          onChange={(event) => updateField('declarationAccepted', event.target.checked)}
          disabled={locked}
          className="reg-checkbox"
          aria-invalid={Boolean(fieldErrors.declarationAccepted)}
          aria-describedby={getDescriptionIds('declarationAccepted')}
        />
        <span>{t('register.declaration')}</span>
      </label>

      {fieldErrors.declarationAccepted ? (
        <p id="declarationAccepted-error" className="reg-error-text">
          {fieldErrors.declarationAccepted}
        </p>
      ) : null}
    </FormSection>
  )
}
