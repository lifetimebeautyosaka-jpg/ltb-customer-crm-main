export const BG = `
linear-gradient(135deg, #ffffff 0%, #f8fafc 32%, #eef2f7 62%, #e2e8f0 100%)
`;

export const GLASS =
  "linear-gradient(135deg, rgba(255,255,255,0.92), rgba(248,250,252,0.72))";

export const CARD = {
  background: GLASS,
  border: "1px solid rgba(255,255,255,0.95)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  boxShadow:
    "0 18px 40px rgba(15,23,42,0.06), inset 0 1px 0 rgba(255,255,255,0.98)",
  borderRadius: "24px",
};

export const BUTTON_PRIMARY = {
  background: "linear-gradient(135deg, #8b5e3c 0%, #c49a6c 100%)",
  color: "#fff",
  border: "none",
  borderRadius: "12px",
  fontWeight: 700,
  cursor: "pointer",
};
