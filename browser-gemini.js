const REPORT_FIELDS = [
  "patientName",
  "patientAge",
  "patientSex",
  "patientUhid",
  "presentingComplaint",
  "historyOfPresentIllness",
  "pastMedicalHistory",
  "allergies",
  "familyHistory",
  "personalHistory",
  "examinationFindings",
  "reviewOfInvestigations",
  "currentMedication",
  "provisionalDiagnosis",
  "treatmentPlan",
  "prescription"
];

const REPORT_FIELD_DESCRIPTIONS = {
  patientName: "Patient name exactly as spoken, otherwise NIL.",
  patientAge: "Patient age exactly as spoken, otherwise NIL.",
  patientSex: "Patient sex or gender exactly as spoken, otherwise NIL.",
  patientUhid: "UHID exactly as spoken, otherwise NIL.",
  presentingComplaint: "Concise reason for today's encounter after cross-referencing the complete conversation: the main current complaints, referral reason, second-opinion request, review purpose, and any explicitly dictated investigation finding that the conversation clearly establishes as the reason for consultation. Preserve onset, duration, or reported interval change when spoken. Do not create a complaint from an isolated report or medicine. Use NIL when unsupported.",
  historyOfPresentIllness: "Clinically coherent, problem-oriented synthesis of the explicitly supported clinical course behind today's encounter. Include relevant onset, progression, associated symptoms, pertinent negatives, investigations, procedures, treatment, and response when spoken. Exclude unrelated remarks and symptoms unless the conversation clearly connects them. Never invent clinical relevance or causal links. Use NIL when unsupported.",
  pastMedicalHistory: "Established previous or chronic medical conditions, surgeries, admissions, or major past illnesses explicitly stated or clearly expressed in colloquial language anywhere in the conversation. Normalize colloquial condition names into standard clinical English only when context clearly indicates an established history. Do not infer diagnoses from symptoms, medicines, family history, or laboratory values. Use NIL when unsupported.",
  allergies: "Allergies explicitly spoken in the audio, otherwise NIL.",
  familyHistory: "Family history explicitly spoken in the audio, otherwise NIL.",
  personalHistory: "Personal history explicitly spoken in the audio, otherwise NIL.",
  examinationFindings: "Examination findings explicitly dictated by the doctor, otherwise NIL.",
  reviewOfInvestigations: "Only investigation reports and values explicitly spoken, otherwise NIL.",
  currentMedication: "Only medicines described as already being taken, one numbered medicine per line, otherwise NIL.",
  provisionalDiagnosis: "Most likely working or provisional diagnosis clearly supported by the complete consultation, investigation review, or doctor assessment. It need not be introduced by the words provisional diagnosis. Do not guess from isolated symptoms, medications, or general medical knowledge. Use NIL when unsupported.",
  treatmentPlan: "Plan, advice, orders, referral, follow-up, monitoring, reassurance, conservative management, investigations, or non-medicine instructions clearly supported by the consultation. It need not be introduced by the words treatment plan. Never invent drug changes, doses, procedures, investigations, or follow-up, and never copy current medicines as new advice. Use NIL when unsupported.",
  prescription: "During ambient or visit-note transcription, fill this field whenever the doctor dictates prescribed medicines in the same recording. Include only medicines explicitly prescribed, started, changed, stopped, dose-adjusted, or continued by the doctor in this encounter. Format as a plain text prescription: each medicine as a numbered entry, medicine name/dose on the first line, English patient instruction on the next line, Malayalam matching instruction on the next line. Put non-medicine prescription advice under Advice / Instructions. Use NIL only when no prescribed medicine or prescription advice is supported."
};

const REPORT_SCHEMA = {
  type: "object",
  properties: Object.fromEntries(
    REPORT_FIELDS.map(field => [
      field,
      {
        type: "string",
        description: REPORT_FIELD_DESCRIPTIONS[field]
      }
    ])
  ),
  required: REPORT_FIELDS
};

const DICTATION_SCHEMA = {
  type: "object",
  properties: {
    text: {
      type: "string",
      description: "Faithful transcription of only the clearly spoken medical dictation, with grammar and punctuation corrected but no facts added or removed."
    }
  },
  required: ["text"]
};

const PRESCRIPTION_FIELDS = [
  "date",
  "patientName",
  "patientAge",
  "patientSex",
  "patientUhid",
  "medicationsAdvised"
];

const PRESCRIPTION_SCHEMA = {
  type: "object",
  properties: {
    date: { type: "string", description: "Dictated prescription date, or today's date when none was dictated." },
    patientName: { type: "string", description: "Patient name exactly as spoken, otherwise NIL." },
    patientAge: { type: "string", description: "Patient age exactly as spoken, otherwise NIL." },
    patientSex: { type: "string", description: "Patient sex or gender exactly as spoken, otherwise NIL." },
    patientUhid: { type: "string", description: "UHID exactly as spoken, otherwise NIL." },
    medicationsAdvised: { type: "string", description: "Only explicitly dictated medications, advice, investigations, and follow-up, one numbered item per line. Never infer missing details." }
  },
  required: PRESCRIPTION_FIELDS
};

const MEDICAL_CERTIFICATE_FIELDS = [
  "date",
  "patientName",
  "patientAge",
  "patientSex",
  "patientUhid",
  "certificateBody"
];

const MEDICAL_CERTIFICATE_SCHEMA = {
  type: "object",
  properties: {
    date: { type: "string", description: "Dictated certificate date, or today's date when none was dictated." },
    patientName: { type: "string", description: "Patient name exactly as spoken, otherwise NIL." },
    patientAge: { type: "string", description: "Patient age exactly as spoken, otherwise NIL." },
    patientSex: { type: "string", description: "Patient sex or gender exactly as spoken, otherwise NIL." },
    patientUhid: { type: "string", description: "UHID exactly as spoken, otherwise NIL." },
    certificateBody: { type: "string", description: "Only the facts dictated for the medical certificate, with grammar and spelling corrected but no facts added, removed, or inferred." }
  },
  required: MEDICAL_CERTIFICATE_FIELDS
};

function buildVisitNotePrompt(mode = "ambient") {
  const dictationVisitMode = mode === "visitDictation";
  const visitFields = dictationVisitMode
    ? `Use this output meaning:
- patientName: Name.
- patientAge: Age.
- patientSex: Sex.
- patientUhid: UHID.
- presentingComplaint: Chief Complaints.
- historyOfPresentIllness: History of Present Illness.
- examinationFindings: Physical Examination.
- provisionalDiagnosis: Diagnosis.
- reviewOfInvestigations: Review of Investigations.
- allergies: Allergies.
- currentMedication: Current Medications.
- treatmentPlan: Orders.
- prescription: Prescription.
- Use NIL for pastMedicalHistory, familyHistory, and personalHistory unless the
  doctor explicitly dictates them.`
    : "";
  return `
You are an expert neurology OPD medical scribe. Convert the recorded Malayalam,
English, or Kerala Manglish consultation into professional clinical English.

Accuracy rules:
- Return only the requested JSON object.
- Work in strict extractive mode: every clinical statement in the output must
  be directly supported by clearly audible words in the recording.
- Before filling any field, review the complete recording and internally
  identify the explicitly supported encounter purpose, active clinical
  problems, established past conditions, relevant investigations, procedures,
  current medicines, and final plan. Do not output this internal evidence map.
- Cross-reference those supported facts so presentingComplaint,
  historyOfPresentIllness, pastMedicalHistory, reviewOfInvestigations,
  currentMedication, provisionalDiagnosis, and treatmentPlan are mutually
  consistent and do not contradict one another.
- An explicitly dictated investigation finding may clarify the name and status
  of the active problem in presentingComplaint or historyOfPresentIllness only
  when the conversation clearly establishes that finding as the reason for
  consultation, referral, second opinion, review, or follow-up.
- Never create a presenting complaint, diagnosis, or past condition from an
  isolated abnormal investigation, a medication name, or general medical
  knowledge. Current medicines may provide spelling context only; they are not
  proof of a diagnosis.
- Keep detailed report measurements and findings in reviewOfInvestigations.
  Mention only the clinically central, explicitly supported finding or interval
  change in presentingComplaint or historyOfPresentIllness when needed to
  explain today's encounter.
- Write every value only in English using Latin letters, numbers, and standard
  punctuation. Translate Malayalam clinical content and transliterate names.
- Preserve explicitly stated temporal relationships, onset, duration,
  progression, relevant negatives, medicines with dose/frequency/duration,
  investigations, examination, diagnoses, and advice exactly as spoken.
- Never invent, infer, assume, recommend, or complete missing information.
- Do not use medical knowledge, typical clinical patterns, normal values, or
  surrounding context to complete an unclear word, number, diagnosis,
  medication, investigation, or plan.
- If any detail is unclear, partially audible, contradictory, or uncertain,
  omit that detail. If a whole section is unsupported, write "NIL".
- Never replace an uncertain spoken detail with a medically plausible detail.
- Do not add normal findings, relevant negatives, diagnoses, medication
  instructions, investigations, advice, or follow-up unless explicitly spoken.
- Distinguish patient statements, old diagnoses, possibilities discussed,
  examination findings, and the doctor's final assessment.
- Determine presentingComplaint only after considering the complete recording.
  It must concisely state why the patient is consulting today: the principal
  active complaint or complaints, an explicitly stated referral reason,
  second-opinion request, or review/follow-up purpose.
- Preserve the separately spoken onset or duration of each principal complaint.
  Do not merge different durations into one duration.
- Put older, resolved, incidental, or background symptoms in
  historyOfPresentIllness when relevant; do not list them as presenting
  complaints unless the conversation clearly establishes that they are part of
  the reason for today's visit.
- Use conversational emphasis and the explicitly stated purpose of the visit
  to summarize the presenting complaint. Do not decide importance from medical
  knowledge, severity assumptions, or an inferred diagnosis.
- If no reason for today's encounter is clearly supported, use "NIL" rather
  than selecting a medically plausible complaint.
- Determine historyOfPresentIllness after considering the complete recording.
  Write a concise, clinically coherent, problem-oriented account of the history
  supporting today's presenting complaint or consultation purpose; do not
  transcribe every remark in the order it was spoken.
- For each active problem, include only clearly supported onset, duration,
  course or progression, associated symptoms, pertinent negatives, relevant
  previous evaluation or treatment, and response. Preserve stated timing and
  do not merge timelines belonging to different problems.
- Exclude casual conversation, repetitions, incidental symptoms, and unrelated
  complaints unless the recording itself clearly establishes their relevance
  to today's active problem. Do not use medical knowledge to create relevance,
  causation, associations, or missing transitions.
- When multiple active problems are clearly relevant to today's encounter,
  describe each separately in a logical order. Do not omit a clearly relevant
  problem merely to make the narrative shorter.
- Determine pastMedicalHistory after considering the complete recording, not
  only statements introduced as "past history". Include established previous
  or chronic conditions, important surgeries, admissions, and major illnesses
  explicitly supported anywhere in the conversation.
- Normalize clearly expressed colloquial condition names into standard clinical
  English when context indicates an established diagnosis or history. Examples:
  "sugar" or "sugar disease" -> Diabetes mellitus; "pressure", "BP", or
  "blood pressure problem" -> Hypertension; "cholesterol problem" ->
  Dyslipidemia.
- Do not apply these mappings when the word refers only to a test, reading,
  transient symptom, family history, uncertainty, or a denied condition.
  Preserve statements such as "possible", "being evaluated", or "no history"
  without converting them into confirmed diagnoses.
- Never infer past medical history from medication names, investigation
  results, examination findings, risk factors, or general medical knowledge.
- Fill patientName, patientAge, patientSex, and patientUhid only when each is
  explicitly dictated. Otherwise use "NIL". Preserve the UHID exactly.
- Fill provisionalDiagnosis with the most likely working or provisional
  diagnosis when it is clearly supported by the complete consultation,
  investigation review, doctor's assessment, or explicitly discussed clinical
  problem. The doctor does not need to say the words "provisional diagnosis".
  If the diagnosis remains uncertain or unsupported, use "NIL".
- Fill treatmentPlan with non-medicine plan, advice, orders, referral,
  follow-up, monitoring, reassurance, or conservative management when it is
  clearly supported by the consultation or doctor's discussion. Put prescribed
  medicines in prescription, not treatmentPlan. The doctor does not need to say
  the words "treatment plan".
- Do not move current medications into treatmentPlan. Do not convert old or
  current medicines into new advice. If the doctor only lists current medicines
  and no future action, medication change, review, reassurance, or management
  direction is supported, treatmentPlan must be "NIL".
- Never repeat a medication list in treatmentPlan. If uncertain whether a
  medicine is current or newly advised, keep it in currentMedication and write
  "NIL" in treatmentPlan.
- Never invent drug changes, doses, procedures, investigations, referrals, or
  follow-up from medical knowledge. Use only what is supported by the recording.
- Fill reviewOfInvestigations only when the doctor dictates investigation
  reports, scan findings, lab reports, EEG/NCV/EMG, Doppler, Holter, ECG,
  imaging, or blood investigation values.
- In reviewOfInvestigations, number each investigation/report heading and put
  each report one below another:
  1. Investigation Name (date if dictated)
  - Finding 1.
  - Finding 2.
- Use only these numbers inside reviewOfInvestigations. Do not number the main
  visit-note sections when copying or composing other fields, except for the
  required medicine and advice numbering inside prescription.
- For blood reports, use the heading "Blood Reports" with the date if
  dictated, and give it its own number. Include dictated blood values as
  separate bullets, strictly one value per line.
- Add standard units for blood values when the unit is not dictated:
  Hemoglobin g/dL; total count /uL; platelet count lakh/uL; ESR mm/hr;
  HbA1c %; fasting glucose/fasting sugar/FBS/RBS/PPBS mg/dL;
  total cholesterol/triglycerides/HDL/LDL mg/dL; urea mg/dL;
  creatinine mg/dL; sodium mmol/L; potassium mmol/L;
  chloride mmol/L; calcium mg/dL; TSH uIU/mL; vitamin B12 pg/mL;
  vitamin D ng/mL.
- If no blood report is dictated, do not create Blood Reports and do not add
  NIL blood investigations.
- Do not add "NIL", "not available", or missing blood-test names inside
  reviewOfInvestigations. Include only investigation values and report findings
  that were actually dictated.
- Put medicines already being taken in currentMedication. Put newly prescribed
  medicines in prescription. Put non-medicine plans, investigations, review,
  precautions, and advice in treatmentPlan.
- In currentMedication, write each medication on a separate numbered line:
  1. Medicine name dose frequency/timing
  2. Medicine name dose frequency/timing
  Keep the medicine, dose, frequency, and timing on the same line. Do not write
  current medicines in a single paragraph.
- In treatmentPlan or orders, write each non-medicine advice item on a separate
  line when multiple items are dictated.
- Fill prescription only with medicines that the doctor explicitly prescribes,
  starts, changes, stops, dose-adjusts, or continues. Do not include medicines
  merely mentioned as history, current medicines, or medicines advised by
  another doctor.
- In prescription, correct spelling and grammar and obvious medical spelling
  errors, but do not add, infer, assume, remove, or hallucinate any medicine or
  instruction.
- Format every prescribed medicine in prescription exactly like this:
  1. Tablet/Cap/Syrup/Inj brand name dose
     Clear English patient instruction without repeating the medicine name.
     Malayalam patient instruction without repeating the medicine name.
- Always write tablet medicines as "Tablet", not "Tab". Preserve dictated
  brand name, dose, route, frequency, food timing, SOS/as-needed instruction,
  and duration exactly. Keep medicine names and doses in English in the
  numbered medicine line.
- The English and Malayalam instruction lines must not repeat the medicine
  name. Do not write the word "Malayalam" before the Malayalam text. Put the
  Malayalam instruction directly below the English instruction.
- Malayalam must exactly match the English instruction. If unsure, keep the
  Malayalam instruction short or leave it blank. Do not invent frequency or
  duration.
- Use the same frequency in Malayalam as the English line:
  BID/twice daily -> ദിവസം രണ്ട് പ്രാവശ്യം.
  once daily -> ദിവസം ഒരു പ്രാവശ്യം.
  at night -> രാത്രി.
  before food -> ഭക്ഷണത്തിന് മുമ്പ്.
  after food -> ഭക്ഷണത്തിന് ശേഷം.
  IV -> IV ആയി.
- If the doctor says SOS, as needed, when required, or as and when required,
  write exactly: "Take 1 tablet SOS/as needed." The Malayalam line should mean
  only: take one tablet only when needed. Never convert SOS/as-needed into a
  fixed schedule.
- Write duration in numeric form only, for example 1 month, 10 days, 2 weeks.
  When a specific clock time is dictated, keep it. If only "evening" is
  dictated without a clock time, write it as night. Do not use labels like
  morning:, noon:, night:, bedtime:, Duration:, or Instructions:.
- In Malayalam patient instruction lines, spell general counts and durations
  in Malayalam words when possible, for example ഒരു ഗുളിക, പത്ത് ദിവസം,
  ഇരുപത് ദിവസം, ഒരു മാസം, രണ്ട് ആഴ്ച.
- For tapering or step-down prescriptions, create one numbered medicine entry
  for each step. Write the same medicine name once in each numbered medicine
  line. Write the phase clearly in the English instruction below it and put the
  Malayalam version directly below it.
- If advice, investigations, review plans, certificates, precautions, or
  non-medicine instructions are dictated as part of the prescription, place
  them after the medicines under:
  Advice / Instructions:
  1. ...
  2. ...
- Use "NIL" for every section that was not mentioned.
- Use polished clinical prose without adding information.
${visitFields}
`.trim();
}

function buildDictationPrompt() {
  return `
You are an expert medical transcription assistant. Convert the recorded
Malayalam, English, or Kerala Manglish dictation into clear professional
clinical English suitable for pasting into an existing review note.

Rules:
- Return only the requested JSON object.
- Put the complete result in the text field as normal paragraphs.
- Preserve all clinical facts, chronology, medicines, doses, investigations,
  examination findings, assessment, advice, and follow-up exactly as dictated.
- Translate Malayalam clinical content and transliterate names into English.
- Correct grammar and punctuation, but never invent, infer, recommend, or add
  information that was not spoken.
- Do not split the result into a visit-note template or add section headings
  unless the doctor explicitly requests them.
`.trim();
}

function buildPrescriptionPrompt() {
  return `
You are a clinical prescription assistant helping a doctor structure a dictated
prescription.

Correct spelling and grammar. Correct obvious medical spelling errors.
Do not add, infer, assume, or hallucinate medicines or instructions.
Do not remove any dictated medicine or instruction.

Return a single plain text prescription only.
Do not return JSON.
Do not use markdown fences.

Rules:
- Include only medicines that the doctor explicitly prescribes, starts,
  changes, stops, dose-adjusts, or continues.
- Do not include medicines merely mentioned as history, current medicines, or
  medicines advised by another doctor.
- Format every prescribed medicine as a numbered list, one medicine entry at a
  time:
  1. Tablet/Cap/Syrup/Inj brand name dose
     Clear English patient instruction without repeating the medicine name.
     Malayalam patient instruction without repeating the medicine name.
- Always write tablet medicines as "Tablet", not "Tab".
- Preserve the dictated brand name, dose, route, frequency, food timing,
  SOS/as-needed instruction, and duration exactly.
- Keep medicine names and doses in English in the numbered medicine line.
- The English instruction must not repeat the medicine name.
- The Malayalam instruction must not repeat the medicine name.
- Do not write the word "Malayalam" before the Malayalam text.
- Put the Malayalam instruction directly below the English instruction.
- Malayalam must exactly match the English instruction.
- If unsure, keep the Malayalam instruction short or leave it blank. Do not
  invent frequency or duration.
- Use the same frequency in Malayalam as the English line:
  BID/twice daily -> ദിവസം രണ്ട് പ്രാവശ്യം.
  once daily -> ദിവസം ഒരു പ്രാവശ്യം.
  at night -> രാത്രി.
  before food -> ഭക്ഷണത്തിന് മുമ്പ്.
  after food -> ഭക്ഷണത്തിന് ശേഷം.
  IV -> IV ആയി.
- If the doctor says SOS, as needed, when required, or as and when required,
  write exactly: Take 1 tablet SOS/as needed.
- The Malayalam line should mean only: take one tablet only when needed.
- Never convert SOS/as-needed into daily, twice daily, morning, night, or a
  fixed schedule.
- Write duration in numeric form only, for example 1 month, 10 days, 2 weeks.
- Do not write vague phrases like "one more month" or "more".
- When a specific clock time is dictated, keep it, for example: Take 1 tablet
  at 7 AM before food.
- If only "evening" is dictated without a clock time, write it as night.
- Do not use internal labels like morning:, noon:, night:, bedtime:,
  Duration:, or Instructions:.
- In Malayalam patient instruction lines, spell general counts and durations
  in Malayalam words when possible: ഒരു ഗുളിക, പത്ത് ദിവസം, ഇരുപത് ദിവസം,
  ഒരു മാസം, രണ്ട് ആഴ്ച.
- Keep drug names and doses in English/numerals inside Malayalam instruction
  lines only if they are needed for clarity.
- For tapering or step-down prescriptions, create one numbered medicine entry
  for each step.
- Write the same medicine name once in each numbered medicine line.
- Write the phase clearly in the English instruction below it.
- Put the Malayalam version directly below each English tapering instruction.
- If advice, investigations, review plans, certificates, precautions, or
  non-medicine instructions are dictated, place them after the medicines under:
  Advice / Instructions:
  1. ...
  2. ...
`.trim();
}

function buildMedicalCertificatePrompt() {
  return `
You are an expert medical certificate transcription assistant. Convert the
recorded Malayalam, English, or Kerala Manglish medical certificate dictation
into a clean professional medical certificate.

Rules:
- Return only the requested JSON object.
- Fill date only if dictated. If not dictated, use today's date.
- Fill patientName, patientAge, patientSex, and patientUhid only when each is
  explicitly dictated. Otherwise use "NIL". Preserve the UHID exactly.
- Put the certificate wording in certificateBody.
- The certificateBody must begin with "This is to certify that" and should be
  written as one or more clear paragraphs.
- If patient identifiers are dictated, include them naturally in the first
  sentence of certificateBody, for example patient name, age, sex/gender, and
  UHID. Do not include any identifier that was not dictated.
- Correct grammar, spelling, punctuation, and sentence flow.
- Do not add, remove, infer, recommend, or hallucinate any medical detail,
  diagnosis, duration, leave period, fitness status, date, restriction, or
  instruction that was not dictated.
- Do not convert uncertain words into new medical facts. Keep the dictated
  meaning intact.
- Do not include "To whomsoever it may concern", "Thank you", doctor
  credentials, or a signature inside certificateBody; those are added by the
  app layout.
`.trim();
}

function buildTaskPrompt(mode) {
  if (mode === "reviewDictation") {
    return "Transcribe this recording faithfully into the requested JSON. Correct only grammar, spelling, and punctuation. Do not add, remove, or infer clinical content.";
  }
  if (mode === "prescription") {
    return "Create the plain text prescription only from the clearly dictated prescription. Preserve every drug name, dose, frequency, duration, and instruction exactly.";
  }
  if (mode === "medicalCertificate") {
    return "Convert only the clearly dictated facts into the requested medical-certificate JSON. Correct grammar and spelling without adding, removing, or inferring facts.";
  }
  if (mode === "visitDictation") {
    return "Organize only the clearly dictated clinical information into the requested visit-note JSON. If medicines are prescribed in the same dictation, put them in the prescription field as a separate prescription box and keep them out of treatmentPlan. Use NIL for every unsupported field.";
  }
  return "Review the complete doctor-patient recording, cross-reference all clearly supported clinical details, and produce a mutually consistent structured visit note. If medicines are prescribed in the same recording, put them in the prescription field as a separate prescription box and keep them out of treatmentPlan. Never infer missing details. Use NIL for every unsupported field.";
}

function extractJson(payload) {
  const text = payload.candidates?.[0]?.content?.parts
    ?.map(part => part.text || "")
    .join("")
    .trim();
  if (!text) throw new Error("The AI returned an empty response.");

  return JSON.parse(text);
}

function extractPlainText(payload) {
  const text = payload.candidates?.[0]?.content?.parts
    ?.map(part => part.text || "")
    .join("")
    .trim();
  if (!text) throw new Error("The AI returned an empty response.");
  return text.replace(/^```(?:text)?\s*/i, "").replace(/\s*```$/i, "").trim();
}

function normalizeBloodUnits(text) {
  if (!text || text === "NIL") return text;
  const unitRules = [
    ["Hemoglobin", "g/dL"],
    ["Total count", "/uL"],
    ["Platelet count", "lakh/uL"],
    ["TLC", "lakh/uL"],
    ["ESR", "mm/hr"],
    ["HbA1c", "%"],
    ["Fasting", "mg/dL"],
    ["Fasting Sugar", "mg/dL"],
    ["Fasting Glucose", "mg/dL"],
    ["FBS", "mg/dL"],
    ["RBS", "mg/dL"],
    ["PPBS", "mg/dL"],
    ["Total Cholesterol", "mg/dL"],
    ["Triglycerides", "mg/dL"],
    ["HDL", "mg/dL"],
    ["LDL", "mg/dL"],
    ["SGOT", "U/L"],
    ["SGPT", "U/L"],
    ["ALP", "U/L"],
    ["Total bilirubin", "mg/dL"],
    ["Albumin", "g/dL"],
    ["Total protein", "g/dL"],
    ["CRP", "mg/L"],
    ["RF Factor", "IU/mL"],
    ["Calcium", "mg/dL"],
    ["TSH", "uIU/mL"],
    ["Vitamin B12", "pg/mL"],
    ["Vitamin D", "ng/mL"],
    ["Urea", "mg/dL"],
    ["Creatinine", "mg/dL"],
    ["Sodium", "mmol/L"],
    ["Potassium", "mmol/L"],
    ["Chloride", "mmol/L"]
  ];
  const withUnits = unitRules.reduce((current, [label, unit]) => {
    const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const escapedUnit = unit.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`\\b(${escapedLabel})(:?\\s+)(\\d+(?:\\.\\d+)?)(?!\\d)(?!\\.\\d)(?:\\s*${escapedUnit})?`, "gi");
    return current.replace(pattern, (_, matchedLabel, separator, value) => {
      const labelText = matchedLabel.replace(/\b\w/g, character => character.toUpperCase());
      return `${labelText}: ${value}${unit === "%" ? "%" : ` ${unit}`}`;
    });
  }, text);
  return withUnits
    .replace(/\s+\/uL\b/g, "/uL")
    .replace(/\s+%/g, "%");
}

function formatMedicationLikeText(text) {
  if (!text || text === "NIL") return text;
  return text
    .replace(/([a-z)])(\d+[\.)])(?=\s*[A-Z])/g, "$1\n$2")
    .replace(/\)(?=[A-Z])/g, ")\n")
    .replace(/\.(?=\s*[A-Z][A-Za-z0-9-]*(?:\s+\d|\s+\(|\s+-|\s+one|\s+half|\s+two|\s+three|\s+four|\s+tablet|\s+capsule))/g, ".\n")
    .replace(/\s*(?=\b(?:Tab|Tablet|Cap|Capsule|Inj|Injection|Syp|Syrup)\s+[A-Z])/g, "\n")
    .split(/\n|;|,(?=\s*[A-Z][A-Za-z0-9-]+\s+\d)/)
    .map(line => line
      .trim()
      .replace(/^\d+[\.)]\s*/, "")
      .replace(/^[-•]\s*/, "")
      .replace(/\s*\d+[\.)]\s*$/, "")
      .trim())
    .filter(Boolean)
    .join("\n");
}

function numberMedicationItems(text) {
  const formatted = formatMedicationLikeText(text);
  if (!formatted || formatted === "NIL") return formatted;
  return formatted
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean)
    .map((line, index) => `${index + 1}. ${line}`)
    .join("\n");
}

function numberPrescriptionItems(text) {
  const formatted = formatMedicationLikeText(text);
  if (!formatted || formatted === "NIL") return formatted;
  return formatted
    .replace(/([a-z)])(\d+[\.)])(?=\s*[A-Z])/g, "$1\n$2")
    .split("\n")
    .map(line => line
      .trim()
      .replace(/^\d+[\.)]\s*/, "")
      .replace(/^[-•]\s*/, "")
      .replace(/\s*\d+[\.)]\s*$/, "")
      .trim())
    .filter(Boolean)
    .map((line, index) => `${index + 1}. ${line}`)
    .join("\n");
}

function formatCurrentMedication(text) {
  return numberMedicationItems(text);
}

function formatTreatmentPlan(text) {
  return formatMedicationLikeText(text);
}

const PRESCRIPTION_LINE_PATTERN = /^(?:\d+[\.)]\s*)?(?:tablet|tab|capsule|cap|syrup|inj(?:ection)?|drops?|ointment|cream|gel|spray|solution)\b/i;

function isNilText(value) {
  return !value || value.trim().toUpperCase() === "NIL";
}

function normalizePrescriptionMedicineLine(line) {
  return line
    .trim()
    .replace(/^\d+[\.)]\s*/, "")
    .replace(/^[-•]\s*/, "")
    .replace(/\bTab\b\.?/i, "Tablet")
    .replace(/\bCapsule\b/i, "Cap")
    .replace(/\bInjection\b/i, "Inj")
    .replace(/\.$/, "")
    .trim();
}

function prescriptionFallbackFromLines(lines) {
  return lines
    .map(normalizePrescriptionMedicineLine)
    .filter(Boolean)
    .map((line, index) => `${index + 1}. ${line}`)
    .join("\n");
}

function movePrescriptionOutOfTreatmentPlan(report) {
  if (isNilText(report.treatmentPlan)) return report;
  const lines = report.treatmentPlan
    .split(/\n+/)
    .map(line => line.trim())
    .filter(Boolean);
  const prescriptionLines = lines.filter(line => PRESCRIPTION_LINE_PATTERN.test(line));
  if (!prescriptionLines.length) return report;

  const treatmentLines = lines.filter(line => !PRESCRIPTION_LINE_PATTERN.test(line));
  const existingPrescription = isNilText(report.prescription) ? "" : report.prescription.trim();
  const movedPrescription = prescriptionFallbackFromLines(prescriptionLines);
  return {
    ...report,
    treatmentPlan: treatmentLines.length ? treatmentLines.join("\n") : "NIL",
    prescription: [existingPrescription, movedPrescription].filter(Boolean).join("\n")
  };
}

function splitInvestigationFindings(line) {
  const trimmed = line.replace(/^[-•]\s*/, "").trim();
  if (!trimmed) return [];
  const bloodLabel = "(?:Hemoglobin|Total count|Platelet count|TLC|ESR|HbA1c|Fasting|Fasting Sugar|Fasting Glucose|FBS|RBS|PPBS|Total Cholesterol|Triglycerides|HDL|LDL|SGOT|SGPT|ALP|Total bilirubin|Albumin|Total protein|CRP|RF Factor|Calcium|TSH|Vitamin B12|Vitamin D|Urea|Creatinine|Sodium|Potassium|Chloride)";
  return trimmed
    .replace(new RegExp(`\\s*-\\s*(?=${bloodLabel}\\b)`, "gi"), "\n")
    .replace(/\s+-\s+(?=[A-Za-z][A-Za-z0-9 /()%+-]{1,40}:)/g, "\n")
    .replace(/\.\s+(?=[A-Za-z][A-Za-z0-9 /()%+-]{1,40}:)/g, "\n")
    .split("\n")
    .map(item => item.trim().replace(/^[-•]\s*/, ""))
    .filter(Boolean)
    .map(item => `- ${item.replace(/\.$/, "")}.`);
}

function formatReviewOfInvestigations(text) {
  if (!text || text === "NIL") return text;
  const reportHeading = "(?:mri|ct|eeg|ncv|emg|doppler|carotid|usg|ecg|echo|holter|blood reports?|blood investigations?|x[- ]?ray|mra|mrv|pet|spect)";
  const normalizedText = text
    .replace(/\b(?:NIL|not available)\.?\s*(?=\d+\.\s*[A-Za-z])/gi, "\n")
    .replace(/(\d+\.\s*[A-Za-z][A-Za-z ]+\([^)]+\))\s*-\s*/g, "$1\n- ")
    .replace(/\s*-\s*(?=[A-Za-z][A-Za-z0-9 /()%+-]{1,40}:)/g, "\n- ")
    .replace(new RegExp(`\\s*(?=\\d+\\.\\s+${reportHeading}\\b)`, "gi"), "\n");
  const lines = normalizedText.split("\n").map(line => line.trim()).filter(Boolean);
  const sections = [];
  let currentSection = null;
  lines.forEach(line => {
    let cleaned = line.replace(/^•\s*/, "- ").replace(/^[-•]\s*/, "- ").trim();
    if (/^-\s*[^:]{1,45}:\s*(?:NIL|not available)?\.?$/i.test(cleaned)) return;
    const numberedHeading = cleaned.match(new RegExp(`^\\d+\\.\\s*(${reportHeading}\\b.*)$`, "i"));
    if (numberedHeading) {
      currentSection = { heading: numberedHeading[1].replace(/:$/, "").trim(), items: [] };
      sections.push(currentSection);
      return;
    }
    if (new RegExp(`^${reportHeading}\\b`, "i").test(cleaned)) {
      currentSection = { heading: cleaned.replace(/:$/, ""), items: [] };
      sections.push(currentSection);
      return;
    }
    if (!cleaned.startsWith("- ")) cleaned = `- ${cleaned}`;
    if (!currentSection) {
      currentSection = { heading: "", items: [] };
      sections.push(currentSection);
    }
    currentSection.items.push(...splitInvestigationFindings(cleaned));
  });
  const output = sections
    .filter(section => section.items.length || !section.heading)
    .flatMap((section, index) => section.heading ? [`${index + 1}. ${section.heading}`, ...section.items] : section.items);
  return output.length ? output.join("\n") : "NIL";
}

function sanitizeTreatmentPlan(report) {
  const plan = report.treatmentPlan || "NIL";
  if (plan === "NIL") return report;
  const lower = plan.toLowerCase();
  const advisedCount = (lower.match(/\badvised to take\b/g) || []).length;
  const currentMedication = (report.currentMedication || "").toLowerCase();
  const planLines = lower.split(/\n+|\. /).map(line => line.trim()).filter(Boolean);
  const overlapCount = planLines.filter(line => (
    line.length > 8 && currentMedication.includes(line.replace(/^advised to take\s+/, ""))
  )).length;
  const managementLanguage = /\b(treatment plan|plan|advised|prescribed|start|stop|increase|decrease|continue|follow[- ]?up|review|refer|physiotherapy|investigation|repeat|avoid|monitor|observe|reassure|conservative|admission|surgery|procedure|exercise|lifestyle|diet|return|come back)\b/i.test(plan);

  if ((advisedCount >= 4 && overlapCount >= 1) || overlapCount >= 2) {
    return { ...report, treatmentPlan: "NIL" };
  }
  if (!managementLanguage && planLines.length > 3) {
    return { ...report, treatmentPlan: "NIL" };
  }
  return report;
}

function extractReport(payload) {
  const parsed = extractJson(payload);
  const report = Object.fromEntries(
    REPORT_FIELDS.map(field => [
      field,
      typeof parsed[field] === "string" && parsed[field].trim()
        ? parsed[field].trim()
        : "NIL"
    ])
  );
  report.reviewOfInvestigations = formatReviewOfInvestigations(normalizeBloodUnits(report.reviewOfInvestigations));
  report.currentMedication = formatCurrentMedication(report.currentMedication);
  report.treatmentPlan = formatTreatmentPlan(report.treatmentPlan);
  return movePrescriptionOutOfTreatmentPlan(sanitizeTreatmentPlan(report));
}

function extractDictation(payload) {
  const parsed = extractJson(payload);
  if (typeof parsed.text !== "string" || !parsed.text.trim()) {
    throw new Error("The AI returned an empty transcription.");
  }
  return parsed.text.trim();
}

function extractPrescription(payload) {
  return {
    date: new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      timeZone: "Asia/Kolkata"
    }),
    patientName: "NIL",
    patientAge: "NIL",
    patientSex: "NIL",
    patientUhid: "NIL",
    medicationsAdvised: extractPlainText(payload)
  };
}

function extractMedicalCertificate(payload) {
  const parsed = extractJson(payload);
  const certificate = Object.fromEntries(
    MEDICAL_CERTIFICATE_FIELDS.map(field => [
      field,
      typeof parsed[field] === "string" && parsed[field].trim()
        ? parsed[field].trim()
        : "NIL"
    ])
  );
  if (!certificate.date || certificate.date === "NIL") {
    certificate.date = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      timeZone: "Asia/Kolkata"
    });
  }
  return certificate;
}

async function callGemini({ apiKey, model, audioBase64, mimeType, mode }) {
  const reviewDictationMode = mode === "reviewDictation";
  const prescriptionMode = mode === "prescription";
  const medicalCertificateMode = mode === "medicalCertificate";
  const schema = medicalCertificateMode
    ? MEDICAL_CERTIFICATE_SCHEMA
    : prescriptionMode
    ? PRESCRIPTION_SCHEMA
    : reviewDictationMode
      ? DICTATION_SCHEMA
      : REPORT_SCHEMA;
  const prompt = medicalCertificateMode
    ? buildMedicalCertificatePrompt()
    : prescriptionMode
    ? buildPrescriptionPrompt()
    : reviewDictationMode
      ? buildDictationPrompt()
      : buildVisitNotePrompt(mode);
  const taskPrompt = buildTaskPrompt(mode);
  const generationConfig = {
    temperature: 0,
    thinkingConfig: {
      thinkingBudget: -1
    }
  };
  if (!prescriptionMode) {
    generationConfig.responseMimeType = "application/json";
    generationConfig.responseSchema = schema;
  }
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{
            text: prompt
          }]
        },
        contents: [{
          role: "user",
          parts: [
            {
              text: taskPrompt
            },
            {
              inline_data: {
                mime_type: mimeType,
                data: audioBase64
              }
            }
          ]
        }],
        generationConfig
      })
    }
  );

  const payload = await response.json();
  if (!response.ok) {
    const error = new Error(payload.error?.message || "Gemini processing failed.");
    error.status = response.status;
    throw error;
  }

  if (reviewDictationMode) return { text: extractDictation(payload) };
  if (prescriptionMode) return { prescription: extractPrescription(payload) };
  if (medicalCertificateMode) return { medicalCertificate: extractMedicalCertificate(payload) };
  return { report: extractReport(payload) };
}

function normalizeMode(value) {
  return ["ambient", "reviewDictation", "visitDictation", "prescription", "medicalCertificate"].includes(value)
    ? value
    : "ambient";
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function mapGeminiError(errors) {
  const combinedError = errors.join(" | ");
  if (/quota|rate limit|resource exhausted/i.test(combinedError)) {
    return "The Gemini API quota has been reached. Check AI Studio usage or billing.";
  }
  if (/api key|permission|forbidden|billing/i.test(combinedError)) {
    return "The Gemini API key or billing configuration does not allow this request.";
  }
  return `The visit note could not be generated. ${combinedError.slice(0, 300)}`;
}

export async function processWithBrowserGemini({ apiKey, blob, mode }) {
  const cleanKey = String(apiKey || "").trim();
  if (!cleanKey) {
    throw new Error("Add your Gemini API key in Settings before transcribing.");
  }
  if (!blob?.size) {
    throw new Error("The recording is empty.");
  }

  const audioBase64 = await blobToBase64(blob);
  if (audioBase64.length > 28_000_000) {
    throw new Error("The recording is too large. Please make a shorter recording.");
  }

  const normalizedMode = normalizeMode(mode);
  const mimeType = blob.type || "audio/webm";
  if (!mimeType.startsWith("audio/")) {
    throw new Error("Unsupported recording format.");
  }

  const models = normalizedMode === "ambient"
    ? ["gemini-2.5-flash"]
    : ["reviewDictation", "medicalCertificate"].includes(normalizedMode)
      ? ["gemini-2.5-flash-lite", "gemini-2.5-flash"]
      : ["gemini-2.5-flash", "gemini-2.5-flash-lite"];
  const errors = [];

  for (const model of models) {
    try {
      const result = await callGemini({
        apiKey: cleanKey,
        model,
        audioBase64,
        mimeType,
        mode: normalizedMode
      });
      return { ...result, mode: normalizedMode, model };
    } catch (error) {
      errors.push(error.message);
      const retryable =
        error.status === 400 ||
        error.status === 403 ||
        error.status === 404 ||
        error.status === 429 ||
        error.status === 503 ||
        /model|quota|billing|permission|not found|high demand|overload|temporar|try again/i.test(error.message);
      if (!retryable) break;
    }
  }

  throw new Error(mapGeminiError(errors));
}
