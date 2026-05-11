/**
 * Guard / Security app theme — Purple palette
 * #49225B · #6E3482 · #A56ABD · #E7DBEF · #F5EBFA
 */
export const guardTheme = {
  colors: {
    primary:       "#6E3482",   // medium purple — buttons, accents
    primaryDark:   "#49225B",   // dark purple   — gradient start, header
    primaryMid:    "#6E3482",   // mid purple    — gradient middle
    primaryLight:  "#A56ABD",   // light purple  — tints, icons
    secondary:     "#A56ABD",   // light purple  — secondary actions
    accent:        "#CE93D8",   // soft violet   — highlights
    success:       "#43A047",
    danger:        "#E53935",
    warning:       "#FB8C00",
    info:          "#8E24AA",
    background:    "#EDE0F5",   // page background — between E7DBEF and F5EBFA
    surface:       "#F5EBFA",   // card / surface
    border:        "#E7DBEF",   // very light purple border
    textPrimary:   "#49225B",   // dark purple text
    textSecondary: "#7B5A8A",   // medium muted purple
    textDisabled:  "#B89EC5",   // light muted purple
    tabActive:     "#6E3482",
    tabInactive:   "#A56ABD",
    headerBg:      "#49225B",
    headerText:    "#FFFFFF",
  },

  status: {
    NEW:         "#7B1FA2",
    ASSIGNED:    "#6E3482",
    IN_PROGRESS: "#FB8C00",
    RESOLVED:    "#43A047",
    CLOSED:      "#78909C",
    PENDING:     "#FB8C00",
    CONFIRMED:   "#43A047",
    REJECTED:    "#E53935",
    CANCELLED:   "#78909C",
    COMPLETED:   "#00897B",
    APPROVED:    "#43A047",
    CHECKED_IN:  "#6E3482",
    CHECKED_OUT: "#78909C",
    AUTO_CLOSED: "#B0BEC5",
    PAID:        "#43A047",
    OVERDUE:     "#E53935",
    WAIVED:      "#78909C",
    LOW:         "#43A047",
    MEDIUM:      "#FB8C00",
    HIGH:        "#EF6C00",
    CRITICAL:    "#E53935",
    SENT:        "#7B1FA2",
    DELIVERED:   "#43A047",
    READ:        "#00897B",
    FAILED:      "#E53935",
  },

  priority: {
    LOW:      "#43A047",
    MEDIUM:   "#FB8C00",
    HIGH:     "#EF6C00",
    CRITICAL: "#E53935",
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
    xs:      11,
    sm:      13,
    md:      15,
    lg:      17,
    xl:      20,
    xxl:     24,
    xxxl:    30,
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
      shadowColor: "#6E3482",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.10,
      shadowRadius: 3,
      elevation: 2,
    },
    md: {
      shadowColor: "#49225B",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.14,
      shadowRadius: 6,
      elevation: 4,
    },
    lg: {
      shadowColor: "#49225B",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.20,
      shadowRadius: 12,
      elevation: 8,
    },
  },
};

export type GuardTheme = typeof guardTheme;
