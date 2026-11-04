import type { Vendor } from "../types";

// One line of the sheet as it will go to the API, or why it cannot.
export type NewItemRow = {
  code: string;
  name: string;
  size: string;
  form: string;
  price: string;
  vendorId: number;
  quantity: number;
  batchNumber: string;
  unitPrice?: string;
};

export type ParsedRow = {
  line: number;
  raw: string[];
  item: NewItemRow | null;
  errors: string[];
};

export const COLUMNS = [
  "code",
  "name",
  "size",
  "form",
  "vendor",
  "price",
  "quantity",
  "batch",
  "unit",
] as const;

// Today as MMDD, for batch numbers the sheet leaves blank: RE30-0115.
function todayMMDD() {
  const now = new Date();
  return `${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
}

// Split one line on the delimiter, honouring double quotes so a name like
// "GHK-Cu, copper" survives. Tabs win over commas when the line has any,
// which is what a paste from a spreadsheet looks like.
export function splitLine(line: string): string[] {
  const delimiter = line.includes("\t") ? "\t" : ",";
  const cells: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === delimiter) {
      cells.push(cell);
      cell = "";
    } else {
      cell += ch;
    }
  }
  cells.push(cell);
  return cells.map((c) => c.trim());
}

// A first line that names the columns is skipped; a sheet without one is
// read as data from line 1.
function isHeader(cells: string[]) {
  const lower = cells.map((c) => c.toLowerCase());
  return lower.includes("name") && lower.includes("code");
}

export function parseSheet(
  text: string,
  options: { forms: string[]; vendors: Vendor[] },
): ParsedRow[] {
  const forms = new Set(options.forms.map((f) => f.toLowerCase()));
  const vendorByName = new Map(
    options.vendors.flatMap((v) => [
      [v.name.toLowerCase(), v.publicId] as const,
      ...(v.shortName
        ? [[v.shortName.toLowerCase(), v.publicId] as const]
        : []),
    ]),
  );
  const vendorIds = new Set(options.vendors.map((v) => v.publicId));

  const lines = text.split(/\r?\n/);
  const rows: ParsedRow[] = [];
  lines.forEach((line, index) => {
    if (!line.trim()) return;
    const raw = splitLine(line);
    if (rows.length === 0 && index === lines.findIndex((l) => l.trim()) && isHeader(raw)) {
      return;
    }
    const [code, name, size, form, vendor, price, quantity, batch, unit] = raw;
    const errors: string[] = [];

    if (!code) errors.push("code is missing");
    if (!name) errors.push("name is missing");
    if (!size || !/^\d+(\.\d+)?$/.test(size)) errors.push("size must be a number");
    if (!form || !forms.has(form.toLowerCase()))
      errors.push(`form must be one of ${options.forms.join(", ")}`);

    let vendorId: number | null = null;
    if (!vendor) errors.push("vendor is missing");
    else if (/^\d+$/.test(vendor) && vendorIds.has(Number(vendor)))
      vendorId = Number(vendor);
    else if (vendorByName.has(vendor.toLowerCase()))
      vendorId = vendorByName.get(vendor.toLowerCase())!;
    else errors.push(`unknown vendor "${vendor}"`);

    const cleanPrice = (price ?? "").replace(/^\$/, "");
    if (!/^\d+(\.\d{1,2})?$/.test(cleanPrice))
      errors.push("price must be like 150.00");
    if (!/^\d+$/.test(quantity ?? "")) errors.push("quantity must be a whole number");
    const cleanUnit = (unit ?? "").replace(/^\$/, "");
    if (cleanUnit && !/^\d+(\.\d{1,2})?$/.test(cleanUnit))
      errors.push("unit price must be like 40.00");

    const upperCode = (code ?? "").toUpperCase();
    const batchNumber = batch || `${upperCode}${size ?? ""}-${todayMMDD()}`;

    rows.push({
      line: index + 1,
      raw,
      errors,
      item:
        errors.length === 0 && vendorId !== null
          ? {
              code: upperCode,
              name,
              size,
              form: form.toLowerCase(),
              price: Number(cleanPrice).toFixed(2),
              vendorId,
              quantity: Number(quantity),
              batchNumber,
              ...(cleanUnit ? { unitPrice: Number(cleanUnit).toFixed(2) } : {}),
            }
          : null,
    });
  });
  return rows;
}
