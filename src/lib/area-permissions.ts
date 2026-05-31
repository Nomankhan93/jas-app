import { supabase } from './supabase/client'

export type AreaPermissionModule =
  | 'all'
  | 'membership'
  | 'education'
  | 'health'
  | 'welfare'
  | 'employment'
  | 'finance'
  | 'reports'

export type AreaPermissionScope = 'all' | 'district' | 'taluka'
export type AreaPermissionAction = 'view' | 'review' | 'approve'

export type AreaPermissionUser = {
  user_id: string
  email: string | null
  roles: string[]
  member_id: string | null
  member_no: string | null
  full_name: string | null
  father_name: string | null
  district: string | null
  taluka: string | null
  active_permissions_count: number
}

export type AdminAreaPermission = {
  id: string
  user_id: string
  module_key: AreaPermissionModule
  scope: AreaPermissionScope
  district: string | null
  taluka: string | null
  can_view: boolean
  can_review: boolean
  can_approve: boolean
  is_active: boolean
  notes: string | null
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
}

export type AreaPermissionFormInput = {
  id?: string | null
  userId: string
  moduleKey: AreaPermissionModule
  scope: AreaPermissionScope
  district?: string | null
  taluka?: string | null
  canView: boolean
  canReview: boolean
  canApprove: boolean
  isActive: boolean
  notes?: string | null
}

export const areaPermissionModuleOptions: Array<{
  value: AreaPermissionModule
  label: string
  description: string
}> = [
  { value: 'all', label: 'All Modules', description: 'Applies to all area-sensitive admin modules.' },
  { value: 'membership', label: 'Membership', description: 'Member applications and member records.' },
  { value: 'education', label: 'Education', description: 'Education support and scholarship applications.' },
  { value: 'health', label: 'Health', description: 'Medical assistance cases.' },
  { value: 'welfare', label: 'Welfare', description: 'Welfare case management.' },
  { value: 'employment', label: 'Employment', description: 'Job seeker and CV database.' },
  { value: 'finance', label: 'Finance', description: 'Finance/donation records by area when linked.' },
  { value: 'reports', label: 'Reports', description: 'Area-scoped reports and summaries.' },
]

export const areaPermissionScopeOptions: Array<{
  value: AreaPermissionScope
  label: string
  description: string
}> = [
  { value: 'all', label: 'All Sindh', description: 'No district/taluka restriction.' },
  { value: 'district', label: 'District', description: 'Access limited to one district.' },
  { value: 'taluka', label: 'Taluka', description: 'Access limited to one taluka inside a district.' },
]

export function getAreaPermissionModuleLabel(moduleKey: AreaPermissionModule | string) {
  return areaPermissionModuleOptions.find((item) => item.value === moduleKey)?.label ?? moduleKey
}

export function getAreaPermissionScopeLabel(scope: AreaPermissionScope | string) {
  return areaPermissionScopeOptions.find((item) => item.value === scope)?.label ?? scope
}

export function describeAreaPermission(permission: Pick<AdminAreaPermission, 'scope' | 'district' | 'taluka'>) {
  if (permission.scope === 'all') return 'All Sindh'
  if (permission.scope === 'district') return permission.district || 'District not set'
  return [permission.taluka, permission.district].filter(Boolean).join(', ') || 'Taluka not set'
}

export function getPermissionActionText(permission: Pick<AdminAreaPermission, 'can_view' | 'can_review' | 'can_approve'>) {
  const actions: string[] = []
  if (permission.can_view) actions.push('View')
  if (permission.can_review) actions.push('Review')
  if (permission.can_approve) actions.push('Approve')
  return actions.length ? actions.join(' / ') : 'No actions'
}

export async function currentUserCanManageAreaPermissions() {
  const { data, error } = await supabase.rpc('current_user_is_super_admin' as never)
  if (error) throw error
  return Boolean(data)
}

export async function searchUsersForAreaPermissions(query: string) {
  const { data, error } = await supabase.rpc('search_users_for_area_permissions' as never, {
    _query: query.trim(),
    _limit: 25,
  } as never)

  if (error) throw error
  return ((data ?? []) as unknown as AreaPermissionUser[]).map((item) => ({
    ...item,
    active_permissions_count: Number(item.active_permissions_count ?? 0),
    roles: Array.isArray(item.roles) ? item.roles : [],
  }))
}

export async function fetchAreaPermissionsForUser(userId: string) {
  const { data, error } = await supabase.rpc('get_area_permissions_for_user' as never, {
    _user_id: userId,
  } as never)

  if (error) throw error
  return (data ?? []) as unknown as AdminAreaPermission[]
}

export async function fetchMyAreaPermissions() {
  const { data, error } = await supabase.rpc('get_my_area_permissions' as never)
  if (error) throw error
  return (data ?? []) as unknown as AdminAreaPermission[]
}

export async function saveAreaPermission(input: AreaPermissionFormInput) {
  const district = input.scope === 'all' ? null : input.district?.trim() || null
  const taluka = input.scope === 'taluka' ? input.taluka?.trim() || null : null

  const { data, error } = await supabase.rpc('upsert_admin_area_permission' as never, {
    _permission_id: input.id ?? null,
    _user_id: input.userId,
    _module_key: input.moduleKey,
    _scope: input.scope,
    _district: district,
    _taluka: taluka,
    _can_view: input.canView,
    _can_review: input.canReview,
    _can_approve: input.canApprove,
    _is_active: input.isActive,
    _notes: input.notes?.trim() || null,
  } as never)

  if (error) throw error
  return data as unknown as AdminAreaPermission
}

export async function removeAreaPermission(permissionId: string) {
  const { error } = await supabase.rpc('delete_admin_area_permission' as never, {
    _permission_id: permissionId,
  } as never)

  if (error) throw error
}

export function canAccessArea(
  permissions: AdminAreaPermission[],
  moduleKey: AreaPermissionModule,
  district: string | null | undefined,
  taluka: string | null | undefined,
  action: AreaPermissionAction = 'view',
) {
  return permissions.some((permission) => {
    if (!permission.is_active) return false
    if (permission.module_key !== 'all' && permission.module_key !== moduleKey) return false

    const canAction =
      action === 'view'
        ? permission.can_view
        : action === 'review'
          ? permission.can_review
          : permission.can_approve

    if (!canAction) return false
    if (permission.scope === 'all') return true
    if (permission.scope === 'district') return permission.district === district
    return permission.district === district && permission.taluka === taluka
  })
}
