/** Plain-language definitions shown in place (Term) and on the Help page. */
export interface GlossaryEntry {
  id: string;
  term: string;
  definition: string;
}

export const GLOSSARY: GlossaryEntry[] = [
  {
    id: "ccn",
    term: "CCN",
    definition:
      "CMS Certification Number: the six-character ID CMS gives each hospital. The first two digits are a state code, which is how this tool knows each hospital's state.",
  },
  {
    id: "measure",
    term: "Measure",
    definition:
      "One quality indicator CMS publishes for hospitals, such as heart failure 30-day mortality or communication with nurses. Measures reported by 100 or fewer hospitals are dropped.",
  },
  {
    id: "standardized",
    term: "Standardized score",
    definition:
      "A score rescaled so the national mean is 0 and the standard deviation is 1 (a z-score). +1 means one standard deviation better than average. Measures where lower is better are flipped, so higher always means better.",
  },
  {
    id: "measure-group",
    term: "Measure group",
    definition:
      "Measures are sorted into five groups: Mortality, Safety of Care, Readmission, Patient Experience, and Timely & Effective Care.",
  },
  {
    id: "group-score",
    term: "Group score",
    definition:
      "The average of a hospital's standardized measures within one measure group, standardized again across hospitals.",
  },
  {
    id: "summary-score",
    term: "Summary score",
    definition:
      "The weighted average of a hospital's five group scores: 22% each for Mortality, Safety, Readmission and Patient Experience, 12% for Timely & Effective Care. A missing group's weight is shared among the others.",
  },
  {
    id: "thresholds",
    term: "Reporting thresholds",
    definition:
      "A hospital is rated only if at least 3 measure groups have 3 or more measures each, and Mortality or Safety of Care is one of them.",
  },
  {
    id: "peer-group",
    term: "Peer group",
    definition:
      "Rated hospitals are split by how many measure groups they report: 3, 4 or 5. Stars are assigned within each peer group, so hospitals are compared with similar reporters.",
  },
  {
    id: "star-rating",
    term: "Star rating",
    definition:
      "1 to 5 stars. Within each peer group, k-means clustering sorts summary scores into five groups, and the lowest group gets 1 star.",
  },
  {
    id: "national-average",
    term: "National average",
    definition:
      "The mean score across hospitals. For group scores it uses hospitals with at least 3 measures in that group. For the summary score it uses rated hospitals.",
  },
  {
    id: "sas-parity",
    term: "SAS parity",
    definition:
      "Every output of the Python pipeline compared value by value with the official SAS outputs for the July 2025 input. A difference above 0.000001 counts as a mismatch.",
  },
  {
    id: "run",
    term: "Run",
    definition:
      "One pass of Programs 0, 1 and 2 over an input file. Runs are saved on the server with their outputs and a record of the code version.",
  },
  {
    id: "fingerprint",
    term: "Input fingerprint",
    definition:
      "A SHA-256 hash of the input file. Two runs with the same fingerprint scored exactly the same file.",
  },
];

export const GLOSSARY_BY_ID = Object.fromEntries(GLOSSARY.map((g) => [g.id, g]));
