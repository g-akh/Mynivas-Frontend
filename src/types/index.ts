// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  tenantId: string;
  communityId: string;
  roles: UserRole[];
  phone: string;
  name: string;
}

export type UserRole =
  | "SUPER_ADMIN"
  | "SUPERADMIN"
  | "TENANT_ADMIN"
  | "COMMUNITY_ADMIN"
  | "FM"
  | "TECHNICIAN"
  | "GUARD"
  | "RESIDENT";

// ─── API Error ────────────────────────────────────────────────────────────────

export interface ApiErrorDetail {
  field?: string;
  issue: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: ApiErrorDetail[];
}

// ─── Complaints ───────────────────────────────────────────────────────────────

export type ComplaintStatus = "NEW" | "ASSIGNED" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
export type ComplaintPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface Complaint {
  id: string;
  community_id: string;
  unit_id: string;
  category: string;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  description: string;
  created_by: string;
  assigned_to: string | null;
  sla_due_at: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Visitors ─────────────────────────────────────────────────────────────────

export type VisitorType = "GUEST" | "COURIER" | "SERVICE" | "VENDOR";
export type VisitorStatus =
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "CHECKED_IN"
  | "CHECKED_OUT"
  | "AUTO_CLOSED";

export interface Visitor {
  id: string;
  community_id: string;
  unit_id: string;
  visitor_name: string;
  visitor_phone: string | null;
  visitor_type: VisitorType;
  status: VisitorStatus;
  entry_at: string | null;
  exit_at: string | null;
  created_at: string;
}

export interface VisitorPass {
  id: string;
  unit_id: string;
  resident_id: string;
  visitor_name: string;
  expected_at: string;
  expires_at: string;
  created_via: "WHATSAPP" | "ADMIN";
  created_at: string;
}

// ─── Announcements ────────────────────────────────────────────────────────────

export type AnnouncementPriority = "NORMAL" | "IMPORTANT" | "EMERGENCY";
export type AnnouncementType = "NOTICE" | "POLL" | "EMERGENCY";
export type AnnouncementStatus = "DRAFT" | "SENT" | "CLOSED";

export interface Announcement {
  id: string;
  tenant_id: string;
  community_id: string;
  title: string;
  body: string;
  priority: AnnouncementPriority;
  type: AnnouncementType;
  status: AnnouncementStatus;
  audience_scope: "ALL" | "BUILDING" | "FLOOR" | "UNITS";
  required_ack: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Work Orders ──────────────────────────────────────────────────────────────

export type WorkOrderStatus = "OPEN" | "ASSIGNED" | "IN_PROGRESS" | "BLOCKED" | "COMPLETED";
export type WorkOrderType = "PPM" | "COMPLAINT" | "REACTIVE";
export type WorkOrderPriority = "LOW" | "MEDIUM" | "HIGH";

export interface WorkOrder {
  id: string;
  community_id: string;
  type: WorkOrderType;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  assigned_to: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

// ─── Amenities ────────────────────────────────────────────────────────────────

export type BookingStatus = "PENDING" | "CONFIRMED" | "REJECTED" | "CANCELLED" | "COMPLETED";

export interface Amenity {
  id: string;
  community_id: string;
  name: string;
  description: string | null;
  capacity: number;
  location: string | null;
  requires_approval: boolean;
  active: boolean;
  slots: AmenitySlot[];
}

export interface AmenitySlot {
  id: string;
  amenity_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  max_concurrent_bookings: number;
  active: boolean;
}

export interface Booking {
  id: string;
  amenity_id: string;
  slot_id: string;
  unit_id: string;
  booked_by: string;
  date: string;
  status: BookingStatus;
  notes: string | null;
  reject_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface SlotAvailability {
  date: string;
  slots: {
    slot_id: string;
    start_time: string;
    end_time: string;
    available_capacity: number;
    available: boolean;
  }[];
}

// ─── Documents ────────────────────────────────────────────────────────────────

export interface DocumentCategory {
  id: string;
  community_id: string;
  name: string;
  description: string | null;
  access_roles: string[];
  created_by: string | null;
  created_at: string;
}

export interface Document {
  id: string;
  community_id: string;
  category_id: string;
  name: string;
  description: string | null;
  file_key: string;
  file_url: string;
  mime_type: string;
  size_bytes: number;
  uploaded_by: string;
  unit_id: string | null;
  is_community_doc: boolean;
  active: boolean;
  current_version: number;
  expires_at: string | null;
  created_at: string;
}

// ─── Billing ──────────────────────────────────────────────────────────────────

export type LedgerStatus = "PENDING" | "PAID" | "OVERDUE" | "WAIVED";

export interface LedgerEntry {
  id: string;
  unit_id: string;
  community_id: string;
  charge_def_id: string;
  period: string;
  amount: number;
  due_date: string;
  status: LedgerStatus;
  created_at: string;
}

export interface Receipt {
  id: string;
  payment_id: string;
  receipt_no: string;
  issued_at: string;
  pdf_url: string | null;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardData {
  complaints: {
    open_count: number;
    breaching_sla_count: number;
  };
  visitors: {
    pending_approval_count: number;
    currently_checked_in_count: number;
  };
  work_orders: {
    unassigned_count: number;
    blocked_count: number;
  };
  ppm: {
    overdue_count: number;
  };
  announcements: {
    pending_ack_count: number;
  };
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}
