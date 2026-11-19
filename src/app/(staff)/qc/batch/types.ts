// A batch as GET /batches answers it.
export type Batch = {
  id: number;
  itemId: string | null;
  batchNumber: string;
  quantity: number | null;
  manufacturer: number;
  itemCodeId: string;
  capColor: string | null;
  crimpColor: string | null;
  manufacturerDisclosed: boolean | null;
  sku: string | null;
  // How many lab reports the batch has, and the labs that wrote them.
  reports: number;
  labIds: string[];
  // What each vial's label claims, e.g. 60 and "mg". Mass readings are
  // judged against it.
  labelAmount: number | null;
  labelUnit: string | null;
  // Readings that miss their test's standard, and ones that cannot be held
  // to it yet (a mass reading on a batch with no label amount).
  flags: number;
  unjudged: number;
};

// A batch with the names the table shows, looked up on the server.
export type BatchRow = Batch & {
  productTitle: string | null;
  productCode: string | null;
  manufacturerLabel: string;
};

export type Lab = {
  id: string;
  name: string | null;
  verificationUrl?: string | null;
};

// A lab report as GET /batch/:id/coa answers it.
export type LabReport = {
  id: string;
  publicId: string;
  title: string;
  // mass_purity, endotoxin, lcms or sterility; null when none was recorded.
  testType: string | null;
  testedAt: string | null;
  labId: string | null;
  // The vials this report covers.
  sampleIds: string[];
  resultUrl: string | null;
};

// A test the lab can run, as GET /assays answers it.
export type Assay = {
  assay_def_id: number;
  name: string;
  result_type: "numeric" | "bounded_numeric" | "enum" | "structured_list";
  default_unit: string | null;
  // The standard its readings are held to; all optional. Numbers arrive as
  // text from the API.
  spec_min: string | null;
  spec_max: string | null;
  spec_expected: string | null;
  spec_vs_label: boolean;
};

// Whether a reading meets its test's standard, worked out by the API.
export type Verdict =
  | { status: "pass" }
  | { status: "flag"; reason: string }
  | { status: "unjudged"; reason: string };

// One reading on a vial. `result` is the stored shape for its result_type.
export type SampleResult = {
  assayDefId: number;
  assay: string;
  resultType: Assay["result_type"];
  defaultUnit: string | null;
  result: unknown;
  // null when the test has no standard.
  verdict: Verdict | null;
};

// A vial on a report, as GET /coa/:id/samples answers it.
export type ReportSample = {
  id: string;
  code: string;
  results: SampleResult[];
};
