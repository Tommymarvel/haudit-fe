const COUNTRY_CODE_OVERRIDES: Record<string, string> = {
  UK: "United Kingdom",
  EL: "Greece",
  XK: "Kosovo",
  TL: "Timor-Leste",
};

const regionDisplay =
  typeof Intl !== "undefined" && typeof Intl.DisplayNames !== "undefined"
    ? new Intl.DisplayNames(["en"], { type: "region" })
    : null;

export function getCountryDisplayName(value: string) {
  const trimmed = value?.trim?.() ?? "";
  if (!trimmed || trimmed === "-") {
    return "-";
  }

  const code = trimmed.toUpperCase();

  if (COUNTRY_CODE_OVERRIDES[code]) {
    return COUNTRY_CODE_OVERRIDES[code];
  }

  if (/^[A-Z]{2}$/.test(code) && regionDisplay) {
    const resolved = regionDisplay.of(code);
    if (resolved && resolved !== code) {
      return resolved;
    }
  }

  return trimmed;
}
