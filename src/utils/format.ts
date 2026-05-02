import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

/** "15 Jun 2024" */
export function formatDate(iso: string): string {
  return dayjs(iso).format("DD MMM YYYY");
}

/** "15 Jun 2024, 2:30 PM" */
export function formatDateTime(iso: string): string {
  return dayjs(iso).format("DD MMM YYYY, h:mm A");
}

/** "2 hours ago" */
export function formatRelative(iso: string): string {
  return dayjs(iso).fromNow();
}

/** "2.3 MB" */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** "₹4,500.00" */
export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** "+91 98765 43210" → display format */
export function formatPhone(phone: string): string {
  if (phone.startsWith("+91") && phone.length === 13) {
    return `+91 ${phone.slice(3, 8)} ${phone.slice(8)}`;
  }
  return phone;
}

/** Mask phone for display: "+91 XXXXX 43210" */
export function maskPhone(phone: string): string {
  if (phone.length < 6) return phone;
  const visible = phone.slice(-5);
  const masked = "X".repeat(phone.length - 5);
  return masked + visible;
}

/** "COMMUNITY_ADMIN" → "Community Admin" */
export function formatRole(role: string): string {
  return role
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

/** "IN_PROGRESS" → "In Progress" */
export function formatStatus(status: string): string {
  return status
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}
