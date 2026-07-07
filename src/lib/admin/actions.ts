// src/lib/admin/actions.ts
import { createServerFn } from "@tanstack/react-start";
import { createSupabaseAdminClient } from "../supabase/admin";
import {
  MEMBERSHIP_BASE_FEE,
  MEMBERSHIP_FEE_CURRENCY,
  MEMBERSHIP_RECEIPT_ALLOWED_TYPES,
  MEMBERSHIP_RECEIPT_MAX_SIZE_BYTES,
  type MembershipPayment,
  type MembershipPaymentStatus,
} from "../membership-fee";

const MIN_REJECTION_REASON_LENGTH = 10;
const MAX_REJECTION_REASON_LENGTH = 500;

const MEMBERSHIP_REVIEW_ROLES: Array<
  "admin" | "super_admin" | "membership_admin"
> = ["admin", "super_admin", "membership_admin"];

type MemberStatus = "pending" | "approved" | "rejected";

type AdminActionInput = {
  memberId: string;
  accessToken: string;
};

type RejectMemberInput = AdminActionInput & {
  rejectionReason: string;
};

type MemberReviewRow = {
  id: string;
  user_id: string;
  full_name: string;
  status: MemberStatus;
  member_no: string | null;
};

type AdminMemberEditPayload = {
  full_name: string;
  father_name: string;
  cnic: string;
  mobile: string;
  district: string;
  taluka: string | null;
  address: string;
  date_of_birth: string | null;
  gender: string | null;
  education: string | null;
  blood_group: string | null;
  profession: string | null;
  caste_branch: string | null;
  emergency_contact_name: string | null;
  emergency_contact_relation: string | null;
  emergency_contact_mobile: string | null;
  declaration_accepted: boolean;
  photo_url: string;
};

type UpdateMemberApplicationInput = AdminActionInput & {
  payload: AdminMemberEditPayload;
};

type UpdateMembershipPaymentStatusInput = AdminActionInput & {
  paymentId: string;
  status: MembershipPaymentStatus;
  adminNote: string | null;
};

type SaveMembershipReceiptInput = AdminActionInput & {
  paymentId?: string | null;
  receipt: {
    receipt_path: string;
    receipt_file_name: string;
    receipt_mime_type: string;
    receipt_size_bytes: number;
    receipt_uploaded_at: string;
  };
};

type AdminActor = Awaited<ReturnType<typeof requireMembershipReviewer>>["user"];

type AuditAction = "insert" | "update" | "delete";

type AuditLogInput = {
  actor: AdminActor;
  action: AuditAction;
  actionLabel: string;
  moduleKey: string;
  entityTable: string;
  entityId: string | null;
  recordLabel: string | null;
  oldData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
  changedData?: Record<string, unknown> | null;
};

const MEMBERSHIP_PAYMENT_STATUSES: MembershipPaymentStatus[] = [
  "pending",
  "paid",
  "failed",
  "cancelled",
  "refunded",
  "waived",
];

const ADMIN_NOTE_MAX_LENGTH = 500;
const MAX_TEXT_FIELD_LENGTH = 250;
const MAX_ADDRESS_LENGTH = 600;
const MAX_RECEIPT_FILE_NAME_LENGTH = 180;
const MAX_RECEIPT_PATH_LENGTH = 500;

const MEMBER_EDIT_AUDIT_FIELDS = [
  "full_name",
  "father_name",
  "cnic",
  "mobile",
  "district",
  "taluka",
  "address",
  "date_of_birth",
  "gender",
  "education",
  "blood_group",
  "profession",
  "caste_branch",
  "emergency_contact_name",
  "emergency_contact_relation",
  "emergency_contact_mobile",
  "declaration_accepted",
  "photo_url",
] as const;

const PAYMENT_AUDIT_FIELDS = [
  "status",
  "admin_note",
  "paid_at",
  "receipt_path",
  "receipt_file_name",
  "receipt_mime_type",
  "receipt_size_bytes",
  "receipt_uploaded_at",
  "updated_at",
] as const;

function toErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(data: Record<string, unknown>, fieldName: string) {
  const value = data[fieldName];

  if (typeof value !== "string") {
    throw new Error(`${fieldName} must be a string.`);
  }

  const normalized = value.trim();

  if (!normalized) {
    throw new Error(`${fieldName} is required.`);
  }

  return normalized;
}

function requireUuid(value: string, fieldName: string) {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(value)) {
    throw new Error(`${fieldName} is not valid.`);
  }

  return value;
}

function normalizeRejectionReason(value: string) {
  const normalized = value.trim().replace(/\s+/g, " ");

  if (normalized.length < MIN_REJECTION_REASON_LENGTH) {
    throw new Error(
      `Rejection reason must be at least ${MIN_REJECTION_REASON_LENGTH} characters.`,
    );
  }

  if (normalized.length > MAX_REJECTION_REASON_LENGTH) {
    throw new Error(
      `Rejection reason must be less than ${MAX_REJECTION_REASON_LENGTH} characters.`,
    );
  }

  return normalized;
}

function validateApproveInput(data: unknown): AdminActionInput {
  if (!isRecord(data)) {
    throw new Error("Invalid approval request.");
  }

  const memberId = requireUuid(readString(data, "memberId"), "Member ID");
  const accessToken = readString(data, "accessToken");

  return {
    memberId,
    accessToken,
  };
}

function validateRejectInput(data: unknown): RejectMemberInput {
  if (!isRecord(data)) {
    throw new Error("Invalid rejection request.");
  }

  const memberId = requireUuid(readString(data, "memberId"), "Member ID");
  const accessToken = readString(data, "accessToken");
  const rejectionReason = normalizeRejectionReason(
    readString(data, "rejectionReason"),
  );

  return {
    memberId,
    accessToken,
    rejectionReason,
  };
}

function validateMemberEditInput(data: unknown): UpdateMemberApplicationInput {
  if (!isRecord(data)) {
    throw new Error("Invalid member update request.");
  }

  const memberId = requireUuid(readString(data, "memberId"), "Member ID");
  const accessToken = readString(data, "accessToken");
  const rawPayload = data.payload;

  if (!isRecord(rawPayload)) {
    throw new Error("Application data is required.");
  }

  const payload: AdminMemberEditPayload = {
    full_name: normalizeLimitedText(
      rawPayload.full_name,
      "Full name",
      MAX_TEXT_FIELD_LENGTH,
    ),
    father_name: normalizeLimitedText(
      rawPayload.father_name,
      "Father name",
      MAX_TEXT_FIELD_LENGTH,
    ),
    cnic: normalizeLimitedText(rawPayload.cnic, "CNIC", 30),
    mobile: normalizeLimitedText(rawPayload.mobile, "Mobile", 30),
    district: normalizeLimitedText(
      rawPayload.district,
      "District",
      MAX_TEXT_FIELD_LENGTH,
    ),
    taluka: normalizeOptionalLimitedText(
      rawPayload.taluka,
      "Taluka",
      MAX_TEXT_FIELD_LENGTH,
    ),
    address: normalizeLimitedText(
      rawPayload.address,
      "Address",
      MAX_ADDRESS_LENGTH,
    ),
    date_of_birth: normalizeOptionalDate(
      rawPayload.date_of_birth,
      "Date of birth",
    ),
    gender: normalizeOptionalLimitedText(rawPayload.gender, "Gender", 50),
    education: normalizeOptionalLimitedText(
      rawPayload.education,
      "Education",
      MAX_TEXT_FIELD_LENGTH,
    ),
    blood_group: normalizeOptionalLimitedText(
      rawPayload.blood_group,
      "Blood group",
      20,
    ),
    profession: normalizeOptionalLimitedText(
      rawPayload.profession,
      "Profession",
      MAX_TEXT_FIELD_LENGTH,
    ),
    caste_branch: normalizeOptionalLimitedText(
      rawPayload.caste_branch,
      "Caste / branch",
      MAX_TEXT_FIELD_LENGTH,
    ),
    emergency_contact_name: normalizeOptionalLimitedText(
      rawPayload.emergency_contact_name,
      "Emergency contact name",
      MAX_TEXT_FIELD_LENGTH,
    ),
    emergency_contact_relation: normalizeOptionalLimitedText(
      rawPayload.emergency_contact_relation,
      "Emergency contact relation",
      MAX_TEXT_FIELD_LENGTH,
    ),
    emergency_contact_mobile: normalizeOptionalLimitedText(
      rawPayload.emergency_contact_mobile,
      "Emergency contact mobile",
      30,
    ),
    declaration_accepted: readBoolean(rawPayload, "declaration_accepted"),
    photo_url:
      normalizeOptionalLimitedText(
        rawPayload.photo_url,
        "Photo path",
        MAX_RECEIPT_PATH_LENGTH,
      ) ?? "",
  };

  return {
    memberId,
    accessToken,
    payload,
  };
}

function validatePaymentStatusInput(
  data: unknown,
): UpdateMembershipPaymentStatusInput {
  if (!isRecord(data)) {
    throw new Error("Invalid payment status request.");
  }

  const memberId = requireUuid(readString(data, "memberId"), "Member ID");
  const paymentId = requireUuid(readString(data, "paymentId"), "Payment ID");
  const accessToken = readString(data, "accessToken");
  const status = readString(data, "status") as MembershipPaymentStatus;

  if (!MEMBERSHIP_PAYMENT_STATUSES.includes(status)) {
    throw new Error("Payment status is not valid.");
  }

  return {
    memberId,
    paymentId,
    accessToken,
    status,
    adminNote: normalizeOptionalLimitedText(
      data.adminNote,
      "Admin note",
      ADMIN_NOTE_MAX_LENGTH,
    ),
  };
}

function validateReceiptInput(data: unknown): SaveMembershipReceiptInput {
  if (!isRecord(data)) {
    throw new Error("Invalid payment receipt request.");
  }

  const memberId = requireUuid(readString(data, "memberId"), "Member ID");
  const accessToken = readString(data, "accessToken");
  const paymentId =
    typeof data.paymentId === "string" && data.paymentId.trim()
      ? requireUuid(data.paymentId.trim(), "Payment ID")
      : null;
  const rawReceipt = data.receipt;

  if (!isRecord(rawReceipt)) {
    throw new Error("Receipt metadata is required.");
  }

  const receiptMimeType = normalizeLimitedText(
    rawReceipt.receipt_mime_type,
    "Receipt type",
    100,
  );

  if (!MEMBERSHIP_RECEIPT_ALLOWED_TYPES.includes(receiptMimeType)) {
    throw new Error("Receipt file type is not allowed.");
  }

  const receiptSizeBytes = readPositiveInteger(
    rawReceipt.receipt_size_bytes,
    "Receipt size",
  );

  if (receiptSizeBytes > MEMBERSHIP_RECEIPT_MAX_SIZE_BYTES) {
    throw new Error("Receipt file is too large.");
  }

  return {
    memberId,
    paymentId,
    accessToken,
    receipt: {
      receipt_path: normalizeLimitedText(
        rawReceipt.receipt_path,
        "Receipt path",
        MAX_RECEIPT_PATH_LENGTH,
      ),
      receipt_file_name: normalizeLimitedText(
        rawReceipt.receipt_file_name,
        "Receipt file name",
        MAX_RECEIPT_FILE_NAME_LENGTH,
      ),
      receipt_mime_type: receiptMimeType,
      receipt_size_bytes: receiptSizeBytes,
      receipt_uploaded_at: normalizeIsoDateTime(
        rawReceipt.receipt_uploaded_at,
        "Receipt uploaded time",
      ),
    },
  };
}

function normalizeLimitedText(
  value: unknown,
  fieldName: string,
  maxLength: number,
) {
  if (typeof value !== "string") {
    throw new Error(`${fieldName} must be a string.`);
  }

  const normalized = value.trim().replace(/\s+/g, " ");

  if (!normalized) {
    throw new Error(`${fieldName} is required.`);
  }

  if (normalized.length > maxLength) {
    throw new Error(`${fieldName} must be ${maxLength} characters or less.`);
  }

  return normalized;
}

function normalizeOptionalLimitedText(
  value: unknown,
  fieldName: string,
  maxLength: number,
) {
  if (value === null || value === undefined) return null;

  if (typeof value !== "string") {
    throw new Error(`${fieldName} must be a string.`);
  }

  const normalized = value.trim().replace(/\s+/g, " ");

  if (!normalized) return null;

  if (normalized.length > maxLength) {
    throw new Error(`${fieldName} must be ${maxLength} characters or less.`);
  }

  return normalized;
}

function normalizeOptionalDate(value: unknown, fieldName: string) {
  const normalized = normalizeOptionalLimitedText(value, fieldName, 20);
  if (!normalized) return null;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw new Error(`${fieldName} must be a valid date.`);
  }

  return normalized;
}

function normalizeIsoDateTime(value: unknown, fieldName: string) {
  const normalized = normalizeLimitedText(value, fieldName, 80);
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`${fieldName} must be a valid date/time.`);
  }

  return date.toISOString();
}

function readBoolean(data: Record<string, unknown>, fieldName: string) {
  const value = data[fieldName];

  if (typeof value !== "boolean") {
    throw new Error(`${fieldName} must be true or false.`);
  }

  return value;
}

function readPositiveInteger(value: unknown, fieldName: string) {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${fieldName} must be a positive number.`);
  }

  return value;
}

async function requireMembershipReviewer(accessToken: string) {
  const supabaseAdmin = createSupabaseAdminClient();

  const { data: userData, error: userError } =
    await supabaseAdmin.auth.getUser(accessToken);

  if (userError) {
    throw new Error(userError.message);
  }

  if (!userData.user) {
    throw new Error("Invalid or expired session.");
  }

  const { data: role, error: roleError } = await supabaseAdmin
    .from("user_roles")
    .select("id, role")
    .eq("user_id", userData.user.id)
    .in("role", MEMBERSHIP_REVIEW_ROLES)
    .limit(1)
    .maybeSingle();

  if (roleError) {
    throw new Error(roleError.message);
  }

  if (!role) {
    throw new Error("Membership admin access required.");
  }

  return {
    supabaseAdmin,
    user: userData.user,
  };
}

async function getMemberForReview(
  supabaseAdmin: ReturnType<typeof createSupabaseAdminClient>,
  memberId: string,
) {
  const { data, error } = await supabaseAdmin
    .from("members")
    .select("id, user_id, full_name, status, member_no")
    .eq("id", memberId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Member record not found.");
  }

  return data as MemberReviewRow;
}

function requirePendingMember(
  member: MemberReviewRow,
  action: "approve" | "reject",
) {
  if (member.status === "approved") {
    throw new Error(
      `${member.full_name} is already approved. This application cannot be ${action}d again.`,
    );
  }

  if (member.status === "rejected") {
    throw new Error(
      `${member.full_name} is already rejected. Ask the member to update and resubmit the application first.`,
    );
  }

  if (member.status !== "pending") {
    throw new Error("Only pending applications can be reviewed.");
  }
}

async function writeAdminAuditLog(
  supabaseAdmin: ReturnType<typeof createSupabaseAdminClient>,
  input: AuditLogInput,
) {
  const { error } = await supabaseAdmin.from("audit_logs" as never).insert({
    actor_user_id: input.actor.id,
    actor_email: input.actor.email ?? null,
    action: input.action,
    action_label: input.actionLabel,
    module_key: input.moduleKey,
    entity_schema: "public",
    entity_table: input.entityTable,
    entity_id: input.entityId,
    record_label: input.recordLabel,
    old_data: input.oldData ?? null,
    new_data: input.newData ?? null,
    changed_data: input.changedData ?? null,
  } as never);

  if (error) {
    throw new Error(`Action was saved but audit log failed: ${error.message}`);
  }
}

function pickAuditFields<T extends readonly string[]>(
  row: Record<string, unknown> | null | undefined,
  fields: T,
) {
  if (!row) return null;

  const picked: Record<string, unknown> = {};

  for (const field of fields) {
    picked[field] = redactAuditValue(field, row[field]);
  }

  return picked;
}

function buildAuditDiff(
  oldRow: Record<string, unknown> | null | undefined,
  newRow: Record<string, unknown> | null | undefined,
  fields: readonly string[],
) {
  const changed: Record<string, { from: unknown; to: unknown }> = {};

  for (const field of fields) {
    const previous = redactAuditValue(field, oldRow?.[field]);
    const next = redactAuditValue(field, newRow?.[field]);

    if (JSON.stringify(previous ?? null) !== JSON.stringify(next ?? null)) {
      changed[field] = { from: previous ?? null, to: next ?? null };
    }
  }

  return changed;
}

function redactAuditValue(field: string, value: unknown) {
  if (value === undefined) return null;

  if (typeof value !== "string") return value ?? null;

  if (field === "cnic") return maskValue(value, 2, 2);

  if (field === "mobile" || field === "emergency_contact_mobile") {
    return maskValue(value, 4, 2);
  }

  if (field === "photo_url" || field === "receipt_path") {
    return value ? "[stored-file]" : null;
  }

  return value;
}

function maskValue(value: string, visibleStart: number, visibleEnd: number) {
  const normalized = value.trim();
  if (normalized.length <= visibleStart + visibleEnd) return "***";
  return `${normalized.slice(0, visibleStart)}***${normalized.slice(-visibleEnd)}`;
}

function paymentRecordLabel(row: Record<string, unknown> | null | undefined) {
  const memberId = row?.member_id;
  return typeof memberId === "string"
    ? `Membership payment · ${memberId}`
    : "Membership payment";
}

async function fetchPaymentForAdmin(
  supabaseAdmin: ReturnType<typeof createSupabaseAdminClient>,
  paymentId: string,
  memberId: string,
) {
  const { data, error } = await supabaseAdmin
    .from("membership_payments" as never)
    .select("*")
    .eq("id" as never, paymentId as never)
    .eq("member_id" as never, memberId as never)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Payment record not found.");

  return data as unknown as MembershipPayment;
}

export const approveMemberAction = createServerFn({ method: "POST" })
  .inputValidator(validateApproveInput)
  .handler(async ({ data }) => {
    try {
      const { supabaseAdmin, user } = await requireMembershipReviewer(
        data.accessToken,
      );

      const member = await getMemberForReview(supabaseAdmin, data.memberId);
      requirePendingMember(member, "approve");

      const { data: approved, error } = await supabaseAdmin.rpc(
        "approve_member",
        {
          _member_id: data.memberId,
          _reviewed_by: user.id,
        },
      );

      if (error) {
        throw new Error(error.message);
      }

      return {
        ok: true,
        action: "approved" as const,
        memberId: data.memberId,
        reviewedBy: user.id,
        result: approved,
      };
    } catch (error) {
      throw new Error(toErrorMessage(error, "Failed to approve member."));
    }
  });

export const rejectMemberAction = createServerFn({ method: "POST" })
  .inputValidator(validateRejectInput)
  .handler(async ({ data }) => {
    try {
      const { supabaseAdmin, user } = await requireMembershipReviewer(
        data.accessToken,
      );

      const member = await getMemberForReview(supabaseAdmin, data.memberId);
      requirePendingMember(member, "reject");

      const { data: rejected, error } = await supabaseAdmin.rpc(
        "reject_member",
        {
          _member_id: data.memberId,
          _rejection_reason: data.rejectionReason,
          _reviewed_by: user.id,
        },
      );

      if (error) {
        throw new Error(error.message);
      }

      return {
        ok: true,
        action: "rejected" as const,
        memberId: data.memberId,
        reviewedBy: user.id,
        rejectionReason: data.rejectionReason,
        result: rejected,
      };
    } catch (error) {
      throw new Error(toErrorMessage(error, "Failed to reject member."));
    }
  });

export const updateMemberApplicationAction = createServerFn({ method: "POST" })
  .inputValidator(validateMemberEditInput)
  .handler(async ({ data }) => {
    try {
      const { supabaseAdmin, user } = await requireMembershipReviewer(
        data.accessToken,
      );
      const member = await getMemberForReview(supabaseAdmin, data.memberId);

      const { data: before, error: beforeError } = await supabaseAdmin
        .from("members")
        .select("*")
        .eq("id", data.memberId)
        .maybeSingle();

      if (beforeError) throw new Error(beforeError.message);
      if (!before) throw new Error("Member record not found.");

      const { data: updated, error } = await supabaseAdmin
        .from("members")
        .update(data.payload as never)
        .eq("id", data.memberId)
        .select("*")
        .maybeSingle();

      if (error) throw new Error(error.message);
      if (!updated) throw new Error("Application could not be updated.");

      const oldData = pickAuditFields(
        before as Record<string, unknown>,
        MEMBER_EDIT_AUDIT_FIELDS,
      );
      const newData = pickAuditFields(
        updated as Record<string, unknown>,
        MEMBER_EDIT_AUDIT_FIELDS,
      );
      const changedData = buildAuditDiff(
        before as Record<string, unknown>,
        updated as Record<string, unknown>,
        MEMBER_EDIT_AUDIT_FIELDS,
      );

      await writeAdminAuditLog(supabaseAdmin, {
        actor: user,
        action: "update",
        actionLabel: "Admin updated member application",
        moduleKey: "membership",
        entityTable: "members",
        entityId: data.memberId,
        recordLabel: member.member_no || member.full_name,
        oldData,
        newData,
        changedData,
      });

      return {
        ok: true,
        action: "member_updated" as const,
        memberId: data.memberId,
        updatedBy: user.id,
        member: updated,
      };
    } catch (error) {
      throw new Error(
        toErrorMessage(error, "Failed to update application details."),
      );
    }
  });

export const saveMembershipReceiptAction = createServerFn({ method: "POST" })
  .inputValidator(validateReceiptInput)
  .handler(async ({ data }) => {
    try {
      const { supabaseAdmin, user } = await requireMembershipReviewer(
        data.accessToken,
      );
      const member = await getMemberForReview(supabaseAdmin, data.memberId);
      const now = new Date().toISOString();

      let before: MembershipPayment | null = null;
      let savedPayment: MembershipPayment | null = null;
      let auditAction: AuditAction = "update";

      if (data.paymentId) {
        before = await fetchPaymentForAdmin(
          supabaseAdmin,
          data.paymentId,
          data.memberId,
        );

        if (before.status !== "pending" && before.status !== "failed") {
          throw new Error(
            "Only pending or failed payment records can receive replacement receipts.",
          );
        }

        const nextStatus =
          before.status === "failed" ? "pending" : before.status;

        const { data: updated, error } = await supabaseAdmin
          .from("membership_payments" as never)
          .update({
            ...data.receipt,
            status: nextStatus,
            updated_at: now,
          } as never)
          .eq("id" as never, data.paymentId as never)
          .eq("member_id" as never, data.memberId as never)
          .select("*")
          .maybeSingle();

        if (error) throw new Error(error.message);
        if (!updated) throw new Error("Payment record could not be updated.");

        savedPayment = updated as unknown as MembershipPayment;
      } else {
        auditAction = "insert";

        const { data: inserted, error } = await supabaseAdmin
          .from("membership_payments" as never)
          .insert({
            member_id: data.memberId,
            user_id: member.user_id,
            base_amount: MEMBERSHIP_BASE_FEE,
            tax_amount: 0,
            total_amount: MEMBERSHIP_BASE_FEE,
            currency: MEMBERSHIP_FEE_CURRENCY,
            status: "pending",
            payment_method: "bank",
            gateway_provider: "manual_mobilink_microfinance_bank",
            gateway_reference: null,
            admin_note: null,
            paid_at: null,
            ...data.receipt,
            created_at: now,
            updated_at: now,
          } as never)
          .select("*")
          .maybeSingle();

        if (error) throw new Error(error.message);
        if (!inserted) throw new Error("Payment record could not be created.");

        savedPayment = inserted as unknown as MembershipPayment;
      }

      await writeAdminAuditLog(supabaseAdmin, {
        actor: user,
        action: auditAction,
        actionLabel:
          auditAction === "insert"
            ? "Admin created membership payment receipt"
            : "Admin updated membership payment receipt",
        moduleKey: "membership",
        entityTable: "membership_payments",
        entityId: savedPayment.id,
        recordLabel: paymentRecordLabel(savedPayment),
        oldData: pickAuditFields(before, PAYMENT_AUDIT_FIELDS),
        newData: pickAuditFields(savedPayment, PAYMENT_AUDIT_FIELDS),
        changedData:
          auditAction === "insert"
            ? pickAuditFields(savedPayment, PAYMENT_AUDIT_FIELDS)
            : buildAuditDiff(before, savedPayment, PAYMENT_AUDIT_FIELDS),
      });

      return {
        ok: true,
        action: "receipt_saved" as const,
        memberId: data.memberId,
        updatedBy: user.id,
        payment: savedPayment,
      };
    } catch (error) {
      throw new Error(toErrorMessage(error, "Failed to save payment receipt."));
    }
  });

export const updateMembershipPaymentStatusAction = createServerFn({
  method: "POST",
})
  .inputValidator(validatePaymentStatusInput)
  .handler(async ({ data }) => {
    try {
      const { supabaseAdmin, user } = await requireMembershipReviewer(
        data.accessToken,
      );
      const before = await fetchPaymentForAdmin(
        supabaseAdmin,
        data.paymentId,
        data.memberId,
      );
      const now = new Date().toISOString();
      const nextPaidAt =
        data.status === "paid" || data.status === "waived"
          ? typeof before.paid_at === "string" && before.paid_at
            ? before.paid_at
            : now
          : null;

      const { data: updated, error } = await supabaseAdmin
        .from("membership_payments" as never)
        .update({
          status: data.status,
          admin_note: data.adminNote,
          paid_at: nextPaidAt,
          updated_at: now,
        } as never)
        .eq("id" as never, data.paymentId as never)
        .eq("member_id" as never, data.memberId as never)
        .select("*")
        .maybeSingle();

      if (error) throw new Error(error.message);
      if (!updated) throw new Error("Payment record could not be updated.");

      const updatedRow = updated as unknown as MembershipPayment;

      await writeAdminAuditLog(supabaseAdmin, {
        actor: user,
        action: "update",
        actionLabel: "Admin updated membership payment status",
        moduleKey: "membership",
        entityTable: "membership_payments",
        entityId: data.paymentId,
        recordLabel: paymentRecordLabel(updatedRow),
        oldData: pickAuditFields(before, PAYMENT_AUDIT_FIELDS),
        newData: pickAuditFields(updatedRow, PAYMENT_AUDIT_FIELDS),
        changedData: buildAuditDiff(before, updatedRow, PAYMENT_AUDIT_FIELDS),
      });

      return {
        ok: true,
        action: "payment_status_updated" as const,
        memberId: data.memberId,
        paymentId: data.paymentId,
        updatedBy: user.id,
        payment: updatedRow,
      };
    } catch (error) {
      throw new Error(
        toErrorMessage(error, "Failed to update membership fee status."),
      );
    }
  });
