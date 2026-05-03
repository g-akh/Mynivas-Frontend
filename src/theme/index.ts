export const theme = {
  colors: {
    primary:       "#1B4F72",
    primaryLight:  "#2E86C1",
    secondary:     "#2E86C1",
    accent:        "#F39C12",
    success:       "#27AE60",
    danger:        "#E74C3C",
    warning:       "#F39C12",
    info:          "#2980B9",
    background:    "#F8F9FA",
    surface:       "#FFFFFF",
    border:        "#DEE2E6",
    textPrimary:   "#212529",
    textSecondary: "#6C757D",
    textDisabled:  "#ADB5BD",
    tabActive:     "#1B4F72",
    tabInactive:   "#95A5A6",
    headerBg:      "#1B4F72",
    headerText:    "#FFFFFF",
  },

  status: {
    // Complaints
    NEW:         "#3498DB",
    ASSIGNED:    "#9B59B6",
    IN_PROGRESS: "#F39C12",
    RESOLVED:    "#27AE60",
    CLOSED:      "#95A5A6",
    // Bookings / Amenities
    PENDING:     "#F39C12",
    CONFIRMED:   "#27AE60",
    REJECTED:    "#E74C3C",
    CANCELLED:   "#95A5A6",
    COMPLETED:   "#1ABC9C",
    // Visitors
    APPROVED:    "#27AE60",
    CHECKED_IN:  "#3498DB",
    CHECKED_OUT: "#95A5A6",
    AUTO_CLOSED: "#BDC3C7",
    // Billing
    PAID:        "#27AE60",
    OVERDUE:     "#E74C3C",
    WAIVED:      "#95A5A6",
    // Priority
    LOW:         "#27AE60",
    MEDIUM:      "#F39C12",
    HIGH:        "#E67E22",
    CRITICAL:    "#E74C3C",
    // Notification
    SENT:        "#3498DB",
    DELIVERED:   "#27AE60",
    READ:        "#1ABC9C",
    FAILED:      "#E74C3C",
  },

  priority: {
    LOW:      "#27AE60",
    MEDIUM:   "#F39C12",
    HIGH:     "#E67E22",
    CRITICAL: "#E74C3C",
  },

  spacing: {
    xs:   4,
    sm:   8,
    md:   16,
    lg:   24,
    xl:   32,
    xxl:  48,
    xxxl: 64,
  },

  borderRadius: {
    xs:   2,
    sm:   4,
    md:   8,
    lg:   12,
    xl:   16,
    xxl:  24,
    full: 9999,
  },

  fontSize: {
    xs:    11,
    sm:    13,
    md:    15,
    lg:    17,
    xl:    20,
    xxl:   24,
    xxxl:  30,
    display: 36,
  },

  fontWeight: {
    regular:  "400" as const,
    medium:   "500" as const,
    semibold: "600" as const,
    bold:     "700" as const,
  },

  shadow: {
    sm: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 4,
      elevation: 4,
    },
    lg: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.16,
      shadowRadius: 8,
      elevation: 8,
    },
  },
};

export type Theme = typeof theme;
export type StatusKey = keyof typeof theme.status;
export type PriorityKey = keyof typeof theme.priority;
