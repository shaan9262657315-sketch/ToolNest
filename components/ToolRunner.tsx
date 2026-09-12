"use client";
import PDFTextEditorTool from "./PDFTextEditorTool";

import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import { jsPDF } from "jspdf";
import { PDFDocument, degrees } from "pdf-lib";
import * as mammoth from "mammoth";

type FieldType = "text" | "number" | "date" | "time" | "select" | "textarea";

type Field = {
  key: string;
  label: string;
  type?: FieldType;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: string;
  options?: { value: string; label: string }[];
};

const n = (v: string) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

const f = (v: number) =>
  Number.isFinite(v) ? String(Math.round(v * 100) / 100) : "ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â";

function Box({ children }: { children: React.ReactNode }) {
  return <div className="card p-6">{children}</div>;
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: Field;
  value: string;
  onChange: (value: string) => void;
}) {
  if (field.type === "select") {
    return (
      <label className="block space-y-2 text-sm font-semibold">
        {field.label}
        <select
          className="tool-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {(field.options || []).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (field.type === "textarea") {
    return (
      <label className="block space-y-2 text-sm font-semibold">
        {field.label}
        <textarea
          className="tool-input min-h-40"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
        />
      </label>
    );
  }

  return (
    <label className="block space-y-2 text-sm font-semibold">
      {field.label}
      <input
        className="tool-input"
        type={field.type || "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        min={field.min}
        max={field.max}
        step={field.step}
      />
    </label>
  );
}

function Result({
  value,
  onCopy = true,
}: {
  value: string;
  onCopy?: boolean;
}) {
  const copy = () => {
    if (value) navigator.clipboard?.writeText(value);
  };

  return (
    <div className="mt-5 rounded-2xl bg-indigo-50 p-5 text-lg font-bold text-indigo-900 dark:bg-indigo-950 dark:text-indigo-100">
      <pre className="whitespace-pre-wrap break-words">{value}</pre>
      {onCopy && (
        <button
          onClick={copy}
          className="mt-3 rounded-lg bg-white px-3 py-2 text-sm font-bold text-indigo-700"
        >
          Copy Result
        </button>
      )}
    </div>
  );
}

function ActionButtons({
  onRun,
  onReset,
  label = "Calculate",
}: {
  onRun: () => void | Promise<void>;
  onReset: () => void;
  label?: string;
}) {
  return (
    <div className="mt-5 flex flex-wrap gap-3">
      <button
        onClick={onRun}
        className="rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white hover:bg-indigo-700"
      >
        {label}
      </button>
      <button
        onClick={onReset}
        className="rounded-xl border px-5 py-3 font-bold"
      >
        Reset
      </button>
    </div>
  );
}

function FormTool({
  fields,
  compute,
  button = "Calculate",
  note,
}: {
  fields: Field[];
  compute: (values: Record<string, string>) => string;
  button?: string;
  note?: string;
}) {
  const initial = useMemo(
    () =>
      Object.fromEntries(
        fields.map((x) => [x.key, x.type === "select" ? x.options?.[0]?.value || "" : ""])
      ),
    [fields]
  );
  const [values, setValues] = useState<Record<string, string>>(initial);
  const [out, setOut] = useState("");

  useEffect(() => setValues(initial), [initial]);

  const run = () => {
    try {
      setOut(compute(values));
    } catch {
      setOut("Please check your input.");
    }
  };

  const reset = () => {
    setValues(initial);
    setOut("");
  };

  return (
    <Box>
      <div className="grid gap-4 md:grid-cols-2">
        {fields.map((field) => (
          <FieldInput
            key={field.key}
            field={field}
            value={values[field.key] || ""}
            onChange={(value) =>
              setValues((old) => ({ ...old, [field.key]: value }))
            }
          />
        ))}
      </div>
      {note && <p className="mt-4 text-sm text-gray-500">{note}</p>}
      <ActionButtons onRun={run} onReset={reset} label={button} />
      {out && <Result value={out} />}
    </Box>
  );
}

function TextTool({
  fields = [],
  transform,
  button = "Process",
}: {
  fields?: Field[];
  transform: (text: string, values: Record<string, string>) => string;
  button?: string;
}) {
  const [text, setText] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [out, setOut] = useState("");

  return (
    <Box>
      {fields.length > 0 && (
        <div className="mb-4 grid gap-4 md:grid-cols-2">
          {fields.map((field) => (
            <FieldInput
              key={field.key}
              field={field}
              value={values[field.key] || ""}
              onChange={(v) => setValues((x) => ({ ...x, [field.key]: v }))}
            />
          ))}
        </div>
      )}
      <label className="block space-y-2 text-sm font-semibold">
        Text / Data
        <textarea
          className="tool-input min-h-52"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your text or data here..."
        />
      </label>
      <ActionButtons
        onRun={() => {
          try {
            setOut(transform(text, values));
          } catch {
            setOut("Please check your input.");
          }
        }}
        onReset={() => {
          setText("");
          setValues({});
          setOut("");
        }}
        label={button}
      />
      {out && <Result value={out} />}
    </Box>
  );
}

function FileBox({
  accept,
  multiple = false,
  files,
  setFiles,
}: {
  accept: string;
  multiple?: boolean;
  files: File[];
  setFiles: (files: File[]) => void;
}) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold">
        Select file{multiple ? "s" : ""}
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => setFiles(Array.from(e.target.files || []))}
          className="mt-2 block w-full rounded-xl border p-3"
        />
      </label>
      {files.length > 0 && (
        <div className="rounded-xl bg-gray-50 p-4 text-sm dark:bg-gray-900">
          {files.map((x) => (
            <div key={`${x.name}-${x.size}`}>{x.name}</div>
          ))}
        </div>
      )}
    </div>
  );
}

function DownloadButton({
  href,
  name,
  children = "Download Result",
}: {
  href: string;
  name: string;
  children?: React.ReactNode;
}) {
  return (
    <a
      href={href}
      download={name}
      className="mt-5 block rounded-xl bg-emerald-600 px-5 py-3 text-center font-bold text-white"
    >
      {children}
    </a>
  );
}

/* ---------- Main dispatcher ---------- */
function GpaCalculatorTool() {
  const [subjectCount, setSubjectCount] = useState(4);
  const [values, setValues] = useState<Record<string, string>>({});
  const [result, setResult] = useState("");

  const handleCountChange = (count: number) => {
    setSubjectCount(count);
    setValues({});
    setResult("");
  };

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const calculateGPA = () => {
    let totalCredits = 0;
    let weightedPoints = 0;

    for (let i = 1; i <= subjectCount; i++) {
      const credits = Number(values[`credits${i}`] || 0);
      const grade = Number(values[`grade${i}`] || 0);

      if (credits > 0) {
        totalCredits += credits;
        weightedPoints += credits * grade;
      }
    }

    if (totalCredits <= 0) {
      setResult("Enter valid credits for at least one subject.");
      return;
    }

    const gpa = weightedPoints / totalCredits;

    setResult(
      `Total Credits: ${totalCredits}\nGPA: ${gpa.toFixed(2)}`
    );
  };

  const reset = () => {
    setValues({});
    setResult("");
    setSubjectCount(4);
  };

  return (
    <div className="card p-6">
      <div className="mb-6">
        <label className="block space-y-2">
          <span className="font-semibold">Number of Subjects</span>

          <select
            className="tool-input w-full"
            value={subjectCount}
            onChange={(e) => handleCountChange(Number(e.target.value))}
          >
            {Array.from({ length: 15 }, (_, i) => i + 1).map((count) => (
              <option key={count} value={count}>
                {count} {count === 1 ? "Subject" : "Subjects"}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4">
        {Array.from({ length: subjectCount }, (_, index) => {
          const subjectNumber = index + 1;

          return (
            <div
              key={subjectNumber}
              className="rounded-xl border p-4"
            >
              <h3 className="mb-3 font-bold">
                Subject {subjectNumber}
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-2">
                  <span className="font-semibold">Credits</span>

                  <input
                    className="tool-input"
                    type="number"
                    min="0"
                    step="0.5"
                    value={values[`credits${subjectNumber}`] || ""}
                    onChange={(e) =>
                      handleChange(
                        `credits${subjectNumber}`,
                        e.target.value
                      )
                    }
                    placeholder="4"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="font-semibold">Grade Point</span>

                  <input
                    className="tool-input"
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={values[`grade${subjectNumber}`] || ""}
                    onChange={(e) =>
                      handleChange(
                        `grade${subjectNumber}`,
                        e.target.value
                      )
                    }
                    placeholder="9"
                  />
                </label>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-sm opacity-75">
        GPA is calculated using credit-weighted grade points.
      </p>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          onClick={calculateGPA}
          className="rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white hover:bg-indigo-700"
        >
          Calculate GPA
        </button>

        <button
          onClick={reset}
          className="rounded-xl border px-5 py-3 font-bold"
        >
          Reset
        </button>
      </div>

      {result && (
        <div className="mt-5 whitespace-pre-line rounded-xl border p-4 font-semibold">
          {result}
        </div>
      )}
    </div>
  );
}
export function ToolRunner({ slug }: { slug: string }) {
  switch (slug) {
    case "percentage-calculator":
      return (
        <FormTool
          fields={[
            { key: "value", label: "What is", type: "number", placeholder: "25" },
            { key: "total", label: "Out of", type: "number", placeholder: "200" },
          ]}
          button="Calculate Percentage"
          compute={(v) => `${f((n(v.value) / n(v.total)) * 100)}%`}
        />
      );

    case "percentage-increase-calculator":
  return (
    <FormTool
      fields={[
        {
          key: "old",
          label: "Original Value",
          type: "number",
          placeholder: "100",
        },
        {
          key: "new",
          label: "New Value",
          type: "number",
          placeholder: "125",
        },
      ]}
      button="Calculate Change"
      compute={(v) => {
        const oldValue = n(v.old);
        const newValue = n(v.new);

        if (oldValue === 0) {
          return "Original value must not be zero.";
        }

        const difference = newValue - oldValue;
        const percentageChange = (difference / oldValue) * 100;

        if (percentageChange > 0) {
          return `Increase: ${f(percentageChange)}%\nAmount Increased: ${f(difference)}`;
        }

        if (percentageChange < 0) {
          return `Decrease: ${f(Math.abs(percentageChange))}%\nAmount Decreased: ${f(Math.abs(difference))}`;
        }

        return "No Change: 0%";
      }}
      note="Percentage change is calculated from the original value."
    />
  );

    case "discount-calculator":
      return (
        <FormTool
          fields={[
            { key: "price", label: "Original Price", type: "number" },
            { key: "discount", label: "Discount (%)", type: "number" },
          ]}
          compute={(v) => {
            const saving = n(v.price) * n(v.discount) / 100;
            return `Sale Price: ${f(n(v.price) - saving)}\nYou Save: ${f(saving)}`;
          }}
        />
      );

    case "average-calculator":
      return (
        <TextTool
          button="Calculate Average"
          transform={(text) => {
            const values = text.split(/[,\s]+/).map(Number).filter(Number.isFinite);
            if (!values.length) return "Enter numbers separated by commas or spaces.";
            const avg = values.reduce((a, b) => a + b, 0) / values.length;
            return `Count: ${values.length}\nAverage: ${f(avg)}`;
          }}
        />
      );

    case "date-difference-calculator":
    case "days-between-dates-calculator":
      return <DateDifferenceTool />;

        case "cgpa-to-percentage-calculator":
      return (
        <FormTool
          fields={[
            {
              key: "cgpa",
              label: "CGPA",
              type: "number",
              min: 0,
              max: 10,
              step: "0.01",
            },
          ]}
          compute={(v) => `${f(n(v.cgpa) * 9.5)}%`}
          note="Uses the common CGPA ÃƒÂ¯Ã‚Â¿Ã‚Â½ 9.5 conversion. Check your institution's official formula if it differs."
        />
      );

    case "gpa-calculator":
      return <GpaCalculatorTool />;

    case "percentage-to-cgpa-calculator":
      return (
        <FormTool
          fields={[
            {
              key: "percentage",
              label: "Percentage",
              type: "number",
              min: 0,
              max: 100,
              step: "0.01",
            },
          ]}
          compute={(v) => f(n(v.percentage) / 9.5)}
        />
      );

    case "sgpa-percentage":
      return (
        <FormTool
          fields={[
            {
              key: "sgpa",
              label: "SGPA",
              type: "number",
              min: 0,
              max: 10,
              step: "0.01",
            },
          ]}
          compute={(v) => `${f(n(v.sgpa) * 10)}%`}
          note="Uses SGPA ÃƒÂ¯Ã‚Â¿Ã‚Â½ 10 as a general conversion."
        />
      );

    case "loan-calculator":
      return (
        <FormTool
          fields={[
            { key: "principal", label: "Loan Amount", type: "number" },
            { key: "rate", label: "Annual Interest Rate (%)", type: "number", step: "0.01" },
            { key: "years", label: "Loan Tenure (Years)", type: "number", step: "0.1" },
          ]}
          compute={(v) => {
            const p = n(v.principal);
            const r = n(v.rate) / 1200;
            const months = n(v.years) * 12;
            if (!p || !months) return "Enter a valid loan amount and tenure.";
            const emi = r
              ? (p * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1)
              : p / months;
            return `Monthly Payment: ${f(emi)}\nTotal Payment: ${f(emi * months)}\nTotal Interest: ${f(emi * months - p)}`;
          }}
        />
      );

    case "compound-interest-calculator":
      return (
        <FormTool
          fields={[
            { key: "principal", label: "Principal", type: "number" },
            { key: "rate", label: "Annual Rate (%)", type: "number", step: "0.01" },
            { key: "years", label: "Time (Years)", type: "number", step: "0.1" },
          ]}
          compute={(v) => {
            const p = n(v.principal);
            const amount = p * Math.pow(1 + n(v.rate) / 100, n(v.years));
            return `Final Amount: ${f(amount)}\nInterest Earned: ${f(amount - p)}`;
          }}
        />
      );

    case "simple-interest":
      return (
        <FormTool
          fields={[
            { key: "principal", label: "Principal", type: "number" },
            { key: "rate", label: "Rate (%)", type: "number" },
            { key: "time", label: "Time (Years)", type: "number" },
          ]}
          compute={(v) => {
            const interest = n(v.principal) * n(v.rate) * n(v.time) / 100;
            return `Interest: ${f(interest)}\nTotal Amount: ${f(n(v.principal) + interest)}`;
          }}
        />
      );

    case "tip-calculator":
      return (
        <FormTool
          fields={[
            { key: "bill", label: "Bill Amount", type: "number" },
            { key: "tip", label: "Tip (%)", type: "number" },
          ]}
          compute={(v) => {
            const tip = n(v.bill) * n(v.tip) / 100;
            return `Tip: ${f(tip)}\nTotal: ${f(n(v.bill) + tip)}`;
          }}
        />
      );

    case "split-bill-calculator":
      return (
        <FormTool
          fields={[
            { key: "bill", label: "Total Bill", type: "number" },
            { key: "people", label: "Number of People", type: "number", min: 1 },
          ]}
          compute={(v) => {
            if (!n(v.people)) return "Number of people must be at least 1.";
            return `Each Person Pays: ${f(n(v.bill) / n(v.people))}`;
          }}
        />
      );

    case "fuel-cost-calculator":
      return (
        <FormTool
          fields={[
            { key: "distance", label: "Distance (km)", type: "number" },
            { key: "mileage", label: "Vehicle Mileage (km/L)", type: "number" },
            { key: "price", label: "Fuel Price (per L)", type: "number" },
          ]}
          compute={(v) => {
            if (!n(v.mileage)) return "Mileage must be greater than zero.";
            const litres = n(v.distance) / n(v.mileage);
            return `Fuel Needed: ${f(litres)} L\nFuel Cost: ${f(litres * n(v.price))}`;
          }}
        />
      );

    case "bmi-calculator":
      return (
        <FormTool
          fields={[
            { key: "weight", label: "Weight (kg)", type: "number" },
            { key: "height", label: "Height (cm)", type: "number" },
          ]}
          compute={(v) => {
            const h = n(v.height) / 100;
            if (!h) return "Enter a valid height.";
            return `BMI: ${f(n(v.weight) / (h * h))}`;
          }}
          note="BMI is a general screening calculation, not a medical diagnosis."
        />
      );

    case "calorie-calculator":
      return (
        <FormTool
          fields={[
            { key: "gender", label: "Sex for formula", type: "select", options: [{ value: "male", label: "Male" }, { value: "female", label: "Female" }] },
            { key: "age", label: "Age (years)", type: "number" },
            { key: "weight", label: "Weight (kg)", type: "number" },
            { key: "height", label: "Height (cm)", type: "number" },
            { key: "activity", label: "Activity Level", type: "select", options: [
              { value: "1.2", label: "Sedentary" },
              { value: "1.375", label: "Lightly active" },
              { value: "1.55", label: "Moderately active" },
              { value: "1.725", label: "Very active" },
              { value: "1.9", label: "Extra active" },
            ] },
          ]}
          compute={(v) => {
            const base = v.gender === "female"
              ? 10 * n(v.weight) + 6.25 * n(v.height) - 5 * n(v.age) - 161
              : 10 * n(v.weight) + 6.25 * n(v.height) - 5 * n(v.age) + 5;
            return `Estimated BMR: ${f(base)} kcal/day\nEstimated maintenance: ${f(base * n(v.activity))} kcal/day`;
          }}
          note="This is an estimate, not medical advice."
        />
      );

    case "water-intake-calculator":
      return (
        <FormTool
          fields={[{ key: "weight", label: "Weight (kg)", type: "number" }]}
          compute={(v) => `${f(n(v.weight) * 0.033)} L/day (general estimate)`}
          note="Hydration needs vary with activity, weather and health."
        />
      );

    case "inflation-calculator":
      return (
        <FormTool
          fields={[
            { key: "value", label: "Current Amount", type: "number" },
            { key: "rate", label: "Inflation Rate (%)", type: "number", step: "0.01" },
            { key: "years", label: "Years", type: "number" },
          ]}
          compute={(v) => `Future Equivalent: ${f(n(v.value) * Math.pow(1 + n(v.rate) / 100, n(v.years)))}`}
        />
      );

    case "roi-calculator":
      return (
        <FormTool
          fields={[
            { key: "cost", label: "Initial Investment", type: "number" },
            { key: "return", label: "Final Value", type: "number" },
          ]}
          compute={(v) => {
            if (!n(v.cost)) return "Initial investment must not be zero.";
            return `ROI: ${f(((n(v.return) - n(v.cost)) / n(v.cost)) * 100)}%`;
          }}
        />
      );

    case "profit-margin-markup":
      return (
        <FormTool
          fields={[
            { key: "cost", label: "Cost Price", type: "number" },
            { key: "sale", label: "Selling Price", type: "number" },
          ]}
          compute={(v) => {
            if (!n(v.cost) || !n(v.sale)) return "Enter both prices.";
            const profit = n(v.sale) - n(v.cost);
            return `Profit: ${f(profit)}\nMargin: ${f((profit / n(v.sale)) * 100)}%\nMarkup: ${f((profit / n(v.cost)) * 100)}%`;
          }}
        />
      );

    case "gst-calculator":
    case "vat-calculator":
      return (
        <FormTool
          fields={[
            { key: "amount", label: "Base Amount", type: "number" },
            { key: "rate", label: slug === "gst-calculator" ? "GST Rate (%)" : "VAT Rate (%)", type: "number", step: "0.01" },
          ]}
          compute={(v) => {
            const tax = n(v.amount) * n(v.rate) / 100;
            return `${slug === "gst-calculator" ? "GST" : "VAT"}: ${f(tax)}\nTotal: ${f(n(v.amount) + tax)}`;
          }}
        />
      );

    case "salary-hourly-converter":
      return (
        <FormTool
          fields={[
            { key: "salary", label: "Annual Salary", type: "number" },
            { key: "hours", label: "Working Hours per Year", type: "number", placeholder: "2080" },
          ]}
          compute={(v) => `Hourly Pay: ${f(n(v.salary) / (n(v.hours) || 2080))}`}
        />
      );

    case "break-even-analysis":
      return (
        <FormTool
          fields={[
            { key: "fixed", label: "Fixed Costs", type: "number" },
            { key: "price", label: "Selling Price per Unit", type: "number" },
            { key: "variable", label: "Variable Cost per Unit", type: "number" },
          ]}
          compute={(v) => {
            const contribution = n(v.price) - n(v.variable);
            if (!contribution) return "Selling price and variable cost cannot be equal.";
            const units = n(v.fixed) / contribution;
            return `Break-even Units: ${f(units)}\nBreak-even Revenue: ${f(units * n(v.price))}`;
          }}
        />
      );

    case "discount-sales-tax":
      return (
        <FormTool
          fields={[
            { key: "price", label: "Original Price", type: "number" },
            { key: "discount", label: "Discount (%)", type: "number" },
            { key: "tax", label: "Sales Tax (%)", type: "number" },
          ]}
          compute={(v) => {
            const after = n(v.price) * (1 - n(v.discount) / 100);
            return `After Discount: ${f(after)}\nFinal Price: ${f(after * (1 + n(v.tax) / 100))}`;
          }}
        />
      );

    case "sip-calculator":
      return (
        <FormTool
          fields={[
            { key: "monthly", label: "Monthly Investment", type: "number" },
            { key: "rate", label: "Expected Annual Return (%)", type: "number", step: "0.01" },
            { key: "years", label: "Investment Period (Years)", type: "number" },
          ]}
          compute={(v) => {
            const p = n(v.monthly);
            const months = n(v.years) * 12;
            const mr = n(v.rate) / 1200;
            const value = mr ? p * ((Math.pow(1 + mr, months) - 1) / mr) * (1 + mr) : p * months;
            return `Invested: ${f(p * months)}\nEstimated Value: ${f(value)}\nEstimated Gain: ${f(value - p * months)}`;
          }}
        />
      );

    case "fd-calculator":
      return (
        <FormTool
          fields={[
            { key: "principal", label: "Deposit Amount", type: "number" },
            { key: "rate", label: "Annual Interest Rate (%)", type: "number", step: "0.01" },
            { key: "years", label: "Tenure (Years)", type: "number" },
          ]}
          compute={(v) => {
            const amount = n(v.principal) * Math.pow(1 + n(v.rate) / 100, n(v.years));
            return `Maturity Amount: ${f(amount)}\nInterest: ${f(amount - n(v.principal))}`;
          }}
        />
      );

    case "rd-calculator":
      return (
        <FormTool
          fields={[
            { key: "monthly", label: "Monthly Deposit", type: "number" },
            { key: "rate", label: "Annual Interest Rate (%)", type: "number", step: "0.01" },
            { key: "years", label: "Tenure (Years)", type: "number" },
          ]}
          compute={(v) => {
            const p = n(v.monthly);
            const months = n(v.years) * 12;
            const r = n(v.rate) / 1200;
            const amount = r ? p * ((Math.pow(1 + r, months) - 1) / r) : p * months;
            return `Total Deposited: ${f(p * months)}\nEstimated Maturity: ${f(amount)}\nEstimated Interest: ${f(amount - p * months)}`;
          }}
        />
      );

    case "ppf-calculator":
      return (
        <FormTool
          fields={[
            { key: "annual", label: "Annual Investment", type: "number" },
            { key: "rate", label: "Interest Rate (%)", type: "number", step: "0.01", placeholder: "7.1" },
            { key: "years", label: "Investment Period (Years)", type: "number", placeholder: "15" },
          ]}
          compute={(v) => {
            const yearly = n(v.annual);
            const rate = n(v.rate) / 100;
            const years = n(v.years);
            let balance = 0;
            for (let i = 0; i < years; i++) balance = (balance + yearly) * (1 + rate);
            return `Total Invested: ${f(yearly * years)}\nEstimated Maturity: ${f(balance)}\nEstimated Interest: ${f(balance - yearly * years)}`;
          }}
          note="Simplified annual-compounding estimate; actual PPF calculations depend on deposit timing and official rules."
        />
      );

    case "retirement-nest-egg":
      return (
        <FormTool
          fields={[
            { key: "annual", label: "Desired Annual Retirement Spending", type: "number" },
            { key: "years", label: "Retirement Years", type: "number" },
          ]}
          compute={(v) => `Simple Target Estimate: ${f(n(v.annual) * n(v.years))}`}
          note="This simplified estimate does not account for inflation, returns or taxes."
        />
      );

    case "crypto-profit-loss":
      return (
        <FormTool
          fields={[
            { key: "buy", label: "Buy Price per Coin", type: "number" },
            { key: "sell", label: "Sell Price per Coin", type: "number" },
            { key: "quantity", label: "Quantity", type: "number" },
          ]}
          compute={(v) => {
            const profit = (n(v.sell) - n(v.buy)) * n(v.quantity);
            return `Profit/Loss: ${f(profit)}\nReturn: ${n(v.buy) ? f(((n(v.sell) - n(v.buy)) / n(v.buy)) * 100) : "ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â"}%`;
          }}
        />
      );

    case "matrix-calculator":
      return <MatrixTool />;

    case "quadratic-equation":
      return (
        <FormTool
          fields={[
            { key: "a", label: "Coefficient a", type: "number" },
            { key: "b", label: "Coefficient b", type: "number" },
            { key: "c", label: "Coefficient c", type: "number" },
          ]}
          compute={(v) => {
            const A = n(v.a), B = n(v.b), C = n(v.c);
            if (!A) return "Coefficient a cannot be zero.";
            const d = B * B - 4 * A * C;
            if (d < 0) return "No real roots.";
            if (d === 0) return `One real root: ${f(-B / (2 * A))}`;
            return `Root 1: ${f((-B + Math.sqrt(d)) / (2 * A))}\nRoot 2: ${f((-B - Math.sqrt(d)) / (2 * A))}`;
          }}
        />
      );

    case "pythagorean-theorem":
      return (
        <FormTool
          fields={[
            { key: "a", label: "Side A", type: "number" },
            { key: "b", label: "Side B", type: "number" },
          ]}
          compute={(v) => `Hypotenuse: ${f(Math.hypot(n(v.a), n(v.b)))}`}
        />
      );

    case "area-perimeter":
      return (
        <FormTool
          fields={[
            { key: "length", label: "Rectangle Length", type: "number" },
            { key: "width", label: "Rectangle Width", type: "number" },
          ]}
          compute={(v) => `Area: ${f(n(v.length) * n(v.width))}\nPerimeter: ${f(2 * (n(v.length) + n(v.width)))}`}
        />
      );

    case "volume-calculator":
      return (
        <FormTool
          fields={[
            { key: "length", label: "Length", type: "number" },
            { key: "width", label: "Width", type: "number" },
            { key: "height", label: "Height", type: "number" },
          ]}
          compute={(v) => `Rectangular Prism Volume: ${f(n(v.length) * n(v.width) * n(v.height))}`}
        />
      );

    case "fraction-calculator":
      return <FractionTool />;

    case "scientific-calculator":
      return <ScientificTool />;

    case "length-converter":
      return <UnitTool kind="length" />;
    case "weight-converter":
      return <UnitTool kind="weight" />;
    case "temperature-converter":
      return <UnitTool kind="temperature" />;
    case "speed-converter":
      return <UnitTool kind="speed" />;
    case "pressure-converter":
      return <UnitTool kind="pressure" />;
    case "energy-power-converter":
      return <UnitTool kind="energy" />;
    case "data-storage-converter":
      return <UnitTool kind="storage" />;

    case "binary-decimal-converter":
      return (
        <TextTool
          button="Convert"
          transform={(text) => {
            if (!/^[01]+$/.test(text.trim())) return "Enter a valid binary number.";
            return String(parseInt(text.trim(), 2));
          }}
        />
      );

    case "decimal-binary-converter":
      return (
        <TextTool
          button="Convert"
          transform={(text) => {
            const value = Number(text.trim());
            if (!Number.isInteger(value) || value < 0) return "Enter a non-negative integer.";
            return value.toString(2);
          }}
        />
      );

    case "rgb-hex-converter":
      return (
        <TextTool
          button="Convert to HEX"
          transform={(text) => {
            const p = text.split(",").map(Number);
            if (p.length !== 3 || p.some((x) => !Number.isFinite(x))) return "Use format: 255,0,128";
            return "#" + p.map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, "0")).join("");
          }}
        />
      );

    case "hex-rgb-converter":
      return (
        <TextTool
          button="Convert to RGB"
          transform={(text) => {
            const h = text.trim().replace(/^#/, "");
            if (!/^[0-9a-fA-F]{6}$/.test(h)) return "Use a 6-digit HEX color.";
            return `rgb(${parseInt(h.slice(0, 2), 16)}, ${parseInt(h.slice(2, 4), 16)}, ${parseInt(h.slice(4, 6), 16)})`;
          }}
        />
      );

    case "word-character-counter":
      return <TextCounterTool />;

    case "case-converter":
      return (
        <TextTool
          fields={[
            {
              key: "case",
              label: "Conversion",
              type: "select",
              options: [
                { value: "upper", label: "UPPERCASE" },
                { value: "lower", label: "lowercase" },
                { value: "title", label: "Title Case" },
              ],
            },
          ]}
          button="Convert Text"
          transform={(text, v) => {
            if (v.case === "upper") return text.toUpperCase();
            if (v.case === "lower") return text.toLowerCase();
            return text.toLowerCase().replace(/\b\w/g, (x) => x.toUpperCase());
          }}
        />
      );

    case "slugify-text":
      return (
        <TextTool
          button="Create Slug"
          transform={(text) =>
            text.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-")
          }
        />
      );

    case "lorem-ipsum-generator":
      return <LoremTool />;

    case "base64-encoder-decoder":
      return (
        <TextTool
          fields={[
            {
              key: "mode",
              label: "Action",
              type: "select",
              options: [
                { value: "encode", label: "Encode" },
                { value: "decode", label: "Decode" },
              ],
            },
          ]}
          button="Run"
          transform={(text, v) =>
            v.mode === "decode"
              ? decodeURIComponent(escape(atob(text)))
              : btoa(unescape(encodeURIComponent(text)))
          }
        />
      );

    case "url-encoder-decoder":
      return (
        <TextTool
          fields={[
            {
              key: "mode",
              label: "Action",
              type: "select",
              options: [
                { value: "encode", label: "Encode" },
                { value: "decode", label: "Decode" },
              ],
            },
          ]}
          button="Run"
          transform={(text, v) => (v.mode === "decode" ? decodeURIComponent(text) : encodeURIComponent(text))}
        />
      );

    case "hash-generator":
      return <HashTool />;

    case "uuid-generator":
      return <SimpleActionTool label="Generate UUID" action={() => crypto.randomUUID()} />;

    case "random-number-generator":
      return (
        <FormTool
          fields={[
            { key: "min", label: "Minimum", type: "number" },
            { key: "max", label: "Maximum", type: "number" },
          ]}
          compute={(v) => {
            const min = Math.ceil(n(v.min)), max = Math.floor(n(v.max));
            if (max < min) return "Maximum must be greater than or equal to minimum.";
            return String(Math.floor(Math.random() * (max - min + 1)) + min);
          }}
          button="Generate Number"
        />
      );

    case "dice-roller":
      return <DiceTool />;

    case "coin-flipper":
      return <SimpleActionTool label="Flip Coin" action={() => Math.random() < 0.5 ? "Heads" : "Tails"} />;

    case "decision-wheel":
      return <SimpleActionTool label="Decide" action={() => Math.random() < 0.5 ? "YES" : "NO"} />;

    case "password-generator":
      return <PasswordTool />;

    case "qr-code-generator":
      return <QRTool />;

    case "jwt-decoder":
      return <JWTTool />;

    case "json-formatter":
      return <TextTool button="Format JSON" transform={(text) => JSON.stringify(JSON.parse(text), null, 2)} />;

    case "json-validator":
      return <TextTool button="Validate JSON" transform={(text) => { JSON.parse(text); return "Valid JSON ÃƒÂ¢Ã…â€œÃ¢â‚¬Å“"; }} />;

    case "csv-json-converter":
      return <CSVJSONTool direction="to-json" />;

    case "json-csv-converter":
      return <CSVJSONTool direction="to-csv" />;

    case "markdown-previewer":
      return <MarkdownTool />;

    case "css-minifier":
      return <TextTool button="Minify CSS" transform={(text) => text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, " ").replace(/\s*([{}:;,])\s*/g, "$1").trim()} />;

    case "javascript-minifier":
      return <TextTool button="Minify JavaScript" transform={(text) => text.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, " ").trim()} />;

    case "html-beautifier":
      return <TextTool button="Beautify HTML" transform={(text) => text.replace(/></g, ">\n<")} />;

    case "sql-query-formatter":
      return (
        <TextTool
          button="Format SQL"
          transform={(text) =>
            text.replace(/\s+/g, " ").replace(/\b(SELECT|FROM|WHERE|GROUP BY|ORDER BY|LIMIT|JOIN|LEFT JOIN|RIGHT JOIN|INNER JOIN)\b/gi, "\n$1 ").trim()
          }
        />
      );

    case "html-entities":
      return (
        <TextTool
          fields={[{
            key: "mode",
            label: "Action",
            type: "select",
            options: [{ value: "encode", label: "Encode" }, { value: "decode", label: "Decode" }],
          }]}
          button="Run"
          transform={(text, v) =>
            v.mode === "decode"
              ? new DOMParser().parseFromString(text, "text/html").documentElement.textContent || ""
              : text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
          }
        />
      );

    case "yaml-json-converter":
      return <YAMLJSONTool direction="to-json" />;

    case "json-yaml-converter":
      return <YAMLJSONTool direction="to-yaml" />;

    case "xml-json-converter":
      return <XMLJSONTool />;

    case "diff-checker":
      return <DiffTool />;

    case "regex-tester":
      return <RegexTool />;

    case "cron-generator":
      return <CronTool />;

    case "css-box-shadow":
      return <CSSShadowTool />;

    case "css-gradient":
      return <CSSGradientTool />;

    case "border-radius":
      return <BorderRadiusTool />;

    case "flexbox-playground":
      return <FlexboxTool />;

    case "grid-layout-generator":
      return <GridTool />;

    case "ascii-art":
      return <ASCIIArtTool />;

    case "stopwatch-timer":
      return <TimerTool pomodoro={false} />;

    case "pomodoro-timer":
      return <TimerTool pomodoro />;

    case "world-clock":
      return <WorldClockTool />;

    case "timezone-converter":
    case "meeting-planner":
      return <TimezoneTool />;

    case "unix-timestamp":
      return <UnixTool />;

    case "age-difference":
      return <AgeTool />;

    case "working-days":
      return <WorkingDaysTool />;

    case "time-duration":
      return <TimeDurationTool />;

    case "sleep-calculator":
      return <SleepTool />;

    case "todo-task-prioritizer":
      return <TodoTool />;

    case "habit-tracker":
      return <HabitTool />;

    case "random-team-generator":
      return <RandomTeamTool />;

    case "student-attendance":
      return <AttendanceTool />;

    case "exam-countdown":
      return <ExamCountdownTool />;

    case "grade-predictor":
      return <GradePredictorTool />;

    case "flashcard-quiz-generator":
      return <FlashcardTool />;

    case "image-compressor":
    case "image-resizer":
    case "png-to-jpg":
    case "svg-to-png":
      return <ImageTool slug={slug} />;

    /* PDF + document tools. These are local browser operations. */
    case "image-to-pdf":
      return <ImageToPDFTool />;

    case "pdf-merge":
      return <PDFMergeTool />;

    case "pdf-split":
      return <PDFSplitTool />;

    case "pdf-rotate":
      return <PDFRotateTool />;

    case "pdf-text-editor":
      return <PDFTextEditorTool />;

    case "pdf-page-extractor":
      return <PDFSplitTool />;

    case "word-to-pdf":
      return <WordToPDFTool />;

    default:
      return (
        <Box>
          <p className="text-lg font-semibold">This tool is being prepared.</p>
          <p className="mt-2 text-sm text-gray-500">
            Please check the tool-specific fields above after the next update.
          </p>
        </Box>
      );
  }
}

/* ---------- Existing utility tools ---------- */

function SimpleActionTool({ label, action }: { label: string; action: () => string }) {
  const [out, setOut] = useState("");
  return (
    <Box>
      <button onClick={() => setOut(action())} className="rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white">
        {label}
      </button>
      {out && <Result value={out} />}
    </Box>
  );
}

function DateDifferenceTool() {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [out, setOut] = useState("");

  return (
    <Box>
      <div className="grid gap-4 md:grid-cols-2">
        <FieldInput field={{ key: "a", label: "Start Date", type: "date" }} value={a} onChange={setA} />
        <FieldInput field={{ key: "b", label: "End Date", type: "date" }} value={b} onChange={setB} />
      </div>
      <ActionButtons
        onRun={() => {
          const start = new Date(`${a}T00:00:00`);
          const end = new Date(`${b}T00:00:00`);
          if (!a || !b || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return setOut("Select both dates.");
          const days = Math.abs(Math.round((end.getTime() - start.getTime()) / 86400000));
          setOut(`Difference: ${days} day${days === 1 ? "" : "s"}\nApproximately: ${f(days / 365.2425)} years`);
        }}
        onReset={() => { setA(""); setB(""); setOut(""); }}
        label="Calculate Difference"
      />
      {out && <Result value={out} />}
    </Box>
  );
}

function FractionTool() {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [op, setOp] = useState("+");
  const [c, setC] = useState("");
  const [d, setD] = useState("");
  const [out, setOut] = useState("");

  return (
    <Box>
      <div className="grid gap-4 md:grid-cols-[1fr_120px_1fr]">
        <FieldInput field={{ key: "a", label: "First Numerator", type: "number" }} value={a} onChange={setA} />
        <FieldInput field={{ key: "b", label: "First Denominator", type: "number" }} value={b} onChange={setB} />
        <FieldInput field={{ key: "c", label: "Second Numerator", type: "number" }} value={c} onChange={setC} />
        <FieldInput field={{ key: "d", label: "Second Denominator", type: "number" }} value={d} onChange={setD} />
      </div>
      <label className="mt-4 block space-y-2 text-sm font-semibold">
        Operation
        <select className="tool-input" value={op} onChange={(e) => setOp(e.target.value)}>
          <option>+</option><option>-</option><option>ÃƒÆ’Ã¢â‚¬â€</option><option>ÃƒÆ’Ã‚Â·</option>
        </select>
      </label>
      <ActionButtons
        onRun={() => {
          const x = n(a), y = n(b), z = n(c), w = n(d);
          if (!y || !w) return setOut("Denominators cannot be zero.");
          let value = 0;
          if (op === "+") value = x / y + z / w;
          if (op === "-") value = x / y - z / w;
          if (op === "ÃƒÆ’Ã¢â‚¬â€") value = (x / y) * (z / w);
          if (op === "ÃƒÆ’Ã‚Â·") value = (x / y) / (z / w);
          setOut(`Decimal Result: ${f(value)}`);
        }}
        onReset={() => { setA(""); setB(""); setC(""); setD(""); setOut(""); }}
      />
      {out && <Result value={out} />}
    </Box>
  );
}

function ScientificTool() {
  const [expression, setExpression] = useState("");
  const [out, setOut] = useState("");
  const calculate = () => {
    try {
      if (!/^[0-9+\-*/().%\s]+$/.test(expression)) throw new Error();
      // eslint-disable-next-line no-new-func
      const value = Function(`"use strict"; return (${expression})`)();
      setOut(String(value));
    } catch {
      setOut("Use a valid arithmetic expression, e.g. (12+5)*2.");
    }
  };
  return (
    <Box>
      <FieldInput field={{ key: "expression", label: "Expression", placeholder: "(12+5)*2" }} value={expression} onChange={setExpression} />
      <ActionButtons onRun={calculate} onReset={() => { setExpression(""); setOut(""); }} label="Calculate" />
      {out && <Result value={out} />}
    </Box>
  );
}

function UnitTool({ kind }: { kind: string }) {
  const configs: Record<string, { units: string[]; toBase: Record<string, (x: number) => number>; fromBase: Record<string, (x: number) => number> }> = {
    length: {
      units: ["meter", "kilometer", "centimeter", "millimeter", "mile", "foot", "inch"],
      toBase: { meter: x=>x, kilometer:x=>x*1000, centimeter:x=>x/100, millimeter:x=>x/1000, mile:x=>x*1609.344, foot:x=>x*0.3048, inch:x=>x*0.0254 },
      fromBase: { meter:x=>x, kilometer:x=>x/1000, centimeter:x=>x*100, millimeter:x=>x*1000, mile:x=>x/1609.344, foot:x=>x/0.3048, inch:x=>x/0.0254 }
    },
    weight: {
      units: ["kilogram", "gram", "pound", "ounce"],
      toBase: { kilogram:x=>x, gram:x=>x/1000, pound:x=>x*0.45359237, ounce:x=>x*0.028349523125 },
      fromBase: { kilogram:x=>x, gram:x=>x*1000, pound:x=>x/0.45359237, ounce:x=>x/0.028349523125 }
    },
    temperature: {
      units: ["Celsius", "Fahrenheit", "Kelvin"],
      toBase: { Celsius:x=>x, Fahrenheit:x=>(x-32)*5/9, Kelvin:x=>x-273.15 },
      fromBase: { Celsius:x=>x, Fahrenheit:x=>x*9/5+32, Kelvin:x=>x+273.15 }
    },
    speed: {
      units: ["km/h", "m/s", "mph"],
      toBase: { "km/h":x=>x, "m/s":x=>x*3.6, mph:x=>x*1.609344 },
      fromBase: { "km/h":x=>x, "m/s":x=>x/3.6, mph:x=>x/1.609344 }
    },
    pressure: {
      units: ["pascal", "kilopascal", "bar", "psi"],
      toBase: { pascal:x=>x, kilopascal:x=>x*1000, bar:x=>x*100000, psi:x=>x*6894.757293 },
      fromBase: { pascal:x=>x, kilopascal:x=>x/1000, bar:x=>x/100000, psi:x=>x/6894.757293 }
    },
    energy: {
      units: ["joule", "kilojoule", "calorie", "kilowatt-hour"],
      toBase: { joule:x=>x, kilojoule:x=>x*1000, calorie:x=>x*4.184, "kilowatt-hour":x=>x*3600000 },
      fromBase: { joule:x=>x, kilojoule:x=>x/1000, calorie:x=>x/4.184, "kilowatt-hour":x=>x/3600000 }
    },
    storage: {
      units: ["byte", "kilobyte", "megabyte", "gigabyte", "terabyte"],
      toBase: { byte:x=>x, kilobyte:x=>x*1024, megabyte:x=>x*1024**2, gigabyte:x=>x*1024**3, terabyte:x=>x*1024**4 },
      fromBase: { byte:x=>x, kilobyte:x=>x/1024, megabyte:x=>x/1024**2, gigabyte:x=>x/1024**3, terabyte:x=>x/1024**4 }
    }
  };
  const cfg = configs[kind];
  const [value,setValue]=useState("");
  const [from,setFrom]=useState(cfg.units[0]);
  const [to,setTo]=useState(cfg.units[1] || cfg.units[0]);
  const [out,setOut]=useState("");
  const options = cfg.units.map(x=><option key={x}>{x}</option>);
  return <Box>
    <FieldInput field={{key:"v",label:"Value",type:"number"}} value={value} onChange={setValue}/>
    <div className="mt-4 grid gap-4 md:grid-cols-2">
      <label className="space-y-2 text-sm font-semibold">From<select className="tool-input" value={from} onChange={e=>setFrom(e.target.value)}>{options}</select></label>
      <label className="space-y-2 text-sm font-semibold">To<select className="tool-input" value={to} onChange={e=>setTo(e.target.value)}>{cfg.units.map(x=><option key={x}>{x}</option>)}</select></label>
    </div>
    <ActionButtons onRun={()=>setOut(f(cfg.fromBase[to](cfg.toBase[from](n(value))))+" "+to)} onReset={()=>{setValue("");setOut("");}} label="Convert"/>
    {out&&<Result value={out}/>}
  </Box>;
}

function TextCounterTool() {
  const [text,setText]=useState(""); const words=text.trim()?text.trim().split(/\s+/).length:0;
  const lines=text?text.split("\n").length:0; const chars=text.length;
  return <Box>
    <textarea className="tool-input min-h-52" value={text} onChange={e=>setText(e.target.value)} placeholder="Type or paste text..."/>
    <div className="mt-5 grid gap-3 sm:grid-cols-3">
      <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-900"><b>{words}</b><br/>Words</div>
      <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-900"><b>{chars}</b><br/>Characters</div>
      <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-900"><b>{lines}</b><br/>Lines</div>
    </div>
  </Box>;
}

function LoremTool() {
  const [count,setCount]=useState("3"); const [out,setOut]=useState("");
  const seed="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";
  return <Box><FieldInput field={{key:"count",label:"Number of Paragraphs",type:"number",min:1,max:20}} value={count} onChange={setCount}/>
    <ActionButtons onRun={()=>setOut(Array.from({length:Math.max(1,Math.min(20,n(count)||3))},(_,i)=>`${seed} ${seed} (${i+1})`).join("\n\n"))} onReset={()=>setOut("")} label="Generate"/>
    {out&&<Result value={out}/>}</Box>;
}

function HashTool() {
  const [text,setText]=useState(""); const [out,setOut]=useState("");
  return <Box><textarea className="tool-input min-h-40" value={text} onChange={e=>setText(e.target.value)} placeholder="Text to hash..."/>
    <ActionButtons onRun={async()=>{const data=new TextEncoder().encode(text);const hash=await crypto.subtle.digest("SHA-256",data);setOut([...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,"0")).join(""))}} onReset={()=>{setText("");setOut("")}} label="Generate SHA-256"/>
    {out&&<Result value={out}/>}</Box>;
}

function PasswordTool() {
  const [length,setLength]=useState("16"); const [password,setPassword]=useState("");
  const [symbols,setSymbols]=useState(true);
  const generate=()=>{let chars="ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";if(symbols)chars+="!@#$%^&*";const size=Math.max(8,Math.min(128,Number(length)||16));const values=new Uint32Array(size);crypto.getRandomValues(values);setPassword([...values].map(v=>chars[v%chars.length]).join(""))};
  return <Box><div className="grid gap-4 md:grid-cols-2"><FieldInput field={{key:"l",label:"Password Length",type:"number",min:8,max:128}} value={length} onChange={setLength}/>
    <label className="flex items-center gap-3 text-sm font-semibold pt-7"><input type="checkbox" checked={symbols} onChange={e=>setSymbols(e.target.checked)}/> Include symbols</label></div>
    <ActionButtons onRun={generate} onReset={()=>setPassword("")} label="Generate Password"/>
    {password&&<Result value={password}/>}<p className="mt-4 text-sm text-gray-500">Generated locally in your browser. ToolNest does not save it.</p></Box>;
}

function QRTool() {
  const [value,setValue]=useState("");const [src,setSrc]=useState("");
  return <Box><FieldInput field={{key:"value",label:"Text or URL",placeholder:"https://example.com"}} value={value} onChange={setValue}/>
    <ActionButtons onRun={async()=>setSrc(await QRCode.toDataURL(value||"https://"))} onReset={()=>{setValue("");setSrc("")}} label="Generate QR"/>
    {src&&<div className="mt-6 text-center"><img src={src} alt="Generated QR code" className="mx-auto rounded-xl"/><a href={src} download="toolnest-qr.png" className="mt-4 inline-block rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white">Download QR</a></div>}</Box>;
}

function JWTTool() {
  const [token,setToken]=useState("");const [out,setOut]=useState("");
  return <Box><textarea className="tool-input min-h-40" value={token} onChange={e=>setToken(e.target.value)} placeholder="Paste JWT here..."/>
    <ActionButtons onRun={()=>{const parts=token.split(".");if(parts.length!==3)throw new Error();const decode=(s:string)=>JSON.stringify(JSON.parse(atob(s.replace(/-/g,"+").replace(/_/g,"/"))),null,2);setOut(`Header:\n${decode(parts[0])}\n\nPayload:\n${decode(parts[1])}`)}} onReset={()=>{setToken("");setOut("")}} label="Decode JWT"/>
    {out&&<Result value={out}/>}</Box>;
}

function CSVJSONTool({direction}:{direction:"to-json"|"to-csv"}) {
  return <TextTool button={direction==="to-json"?"Convert CSV to JSON":"Convert JSON to CSV"} transform={(text)=>{
    if(direction==="to-json"){const rows=text.trim().split(/\r?\n/).map(r=>r.split(","));const headers=rows.shift()||[];return JSON.stringify(rows.map(r=>Object.fromEntries(headers.map((h,i)=>[h.trim(),r[i]?.trim()??""]))),null,2);}
    const arr=JSON.parse(text);if(!Array.isArray(arr)||!arr.length)return "Enter a JSON array of objects.";const headers=Object.keys(arr[0]);return [headers.join(","),...arr.map((o:any)=>headers.map(h=>JSON.stringify(o[h]??"")).join(","))].join("\n");
  }}/>;
}

function MarkdownTool() {
  const [text,setText]=useState("# Heading\n\n**Bold text**");const [html,setHtml]=useState("");
  const render=()=>setHtml(text.replace(/^### (.*)$/gm,"<h3>$1</h3>").replace(/^## (.*)$/gm,"<h2>$1</h2>").replace(/^# (.*)$/gm,"<h1>$1</h1>").replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>").replace(/\n/g,"<br/>"));
  return <Box><textarea className="tool-input min-h-48" value={text} onChange={e=>setText(e.target.value)}/><ActionButtons onRun={render} onReset={()=>{setText("");setHtml("")}} label="Preview Markdown"/>{html&&<div className="mt-5 rounded-2xl border p-5" dangerouslySetInnerHTML={{__html:html}}/>}</Box>;
}

function YAMLJSONTool({direction}:{direction:"to-json"|"to-yaml"}) {
  return <TextTool button={direction==="to-json"?"Convert to JSON":"Convert to YAML"} transform={(text)=>{
    if(direction==="to-yaml"){const obj=JSON.parse(text);return Object.entries(obj).map(([k,v])=>`${k}: ${typeof v==="object"?JSON.stringify(v):String(v)}`).join("\n");}
    const obj:Record<string,unknown>={};text.split(/\r?\n/).forEach(line=>{const i=line.indexOf(":");if(i>0){const k=line.slice(0,i).trim(),v=line.slice(i+1).trim();obj[k]=v==="true"?true:v==="false"?false:(v!==""&&!Number.isNaN(Number(v))?Number(v):v)}});return JSON.stringify(obj,null,2);
  }}/>;
}

function XMLJSONTool() {
  return <TextTool button="Convert XML to JSON" transform={(text)=>{
    const doc=new DOMParser().parseFromString(text,"application/xml");if(doc.querySelector("parsererror"))return "Invalid XML.";
    const walk=(el:Element):any=>{const obj:any={};Array.from(el.attributes).forEach(a=>obj[`@${a.name}`]=a.value);Array.from(el.children).forEach(c=>{const v=walk(c);if(obj[c.tagName])obj[c.tagName]=Array.isArray(obj[c.tagName])?[...obj[c.tagName],v]:[obj[c.tagName],v];else obj[c.tagName]=v});if(!el.children.length)return el.textContent||"";return obj};return JSON.stringify({[doc.documentElement.tagName]:walk(doc.documentElement)},null,2);
  }}/>;
}

function DiffTool() {
  const [left,setLeft]=useState("");const [right,setRight]=useState("");const [out,setOut]=useState("");
  return <Box><div className="grid gap-4 md:grid-cols-2"><textarea className="tool-input min-h-52" value={left} onChange={e=>setLeft(e.target.value)} placeholder="Original text..."/><textarea className="tool-input min-h-52" value={right} onChange={e=>setRight(e.target.value)} placeholder="New text..."/></div>
    <ActionButtons onRun={()=>{const a=left.split(/\r?\n/),b=right.split(/\r?\n/);const max=Math.max(a.length,b.length);const lines=[];for(let i=0;i<max;i++){if(a[i]===b[i])lines.push(`  ${a[i]??""}`);else{if(a[i]!==undefined)lines.push(`- ${a[i]}`);if(b[i]!==undefined)lines.push(`+ ${b[i]}`)}}setOut(lines.join("\n"))}} onReset={()=>{setLeft("");setRight("");setOut("")}} label="Compare Text"/>{out&&<Result value={out}/>}</Box>;
}

function RegexTool() {
  const [pattern,setPattern]=useState("");const [flags,setFlags]=useState("g");const [text,setText]=useState("");const [out,setOut]=useState("");
  return <Box><div className="grid gap-4 md:grid-cols-2"><FieldInput field={{key:"p",label:"Regular Expression",placeholder:"\\d+"}} value={pattern} onChange={setPattern}/><FieldInput field={{key:"f",label:"Flags",placeholder:"gim"}} value={flags} onChange={setFlags}/></div><textarea className="tool-input mt-4 min-h-40" value={text} onChange={e=>setText(e.target.value)} placeholder="Test text..."/><ActionButtons onRun={()=>{const re=new RegExp(pattern,flags);const matches=text.match(re)||[];setOut(`Matches: ${matches.length}\n${matches.join("\n")}`)}} onReset={()=>{setPattern("");setFlags("g");setText("");setOut("")}} label="Test Regex"/>{out&&<Result value={out}/>}</Box>;
}

function CronTool() {
  const [minute,setMinute]=useState("0"),[hour,setHour]=useState("9"),[day,setDay]=useState("*"),[month,setMonth]=useState("*"),[week,setWeek]=useState("*");
  const out=`${minute} ${hour} ${day} ${month} ${week}`;
  return <Box><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
    <FieldInput field={{key:"m",label:"Minute"}} value={minute} onChange={setMinute}/><FieldInput field={{key:"h",label:"Hour"}} value={hour} onChange={setHour}/><FieldInput field={{key:"d",label:"Day of Month"}} value={day} onChange={setDay}/><FieldInput field={{key:"mo",label:"Month"}} value={month} onChange={setMonth}/><FieldInput field={{key:"w",label:"Day of Week"}} value={week} onChange={setWeek}/>
  </div><Result value={out}/><p className="mt-3 text-sm text-gray-500">Cron format: minute hour day-of-month month day-of-week.</p></Box>;
}

function CSSShadowTool() {
  return <FormTool fields={[{key:"x",label:"Horizontal Offset (px)",type:"number"},{key:"y",label:"Vertical Offset (px)",type:"number"},{key:"blur",label:"Blur (px)",type:"number"},{key:"spread",label:"Spread (px)",type:"number"}]} compute={v=>`box-shadow: ${n(v.x)}px ${n(v.y)}px ${n(v.blur)}px ${n(v.spread)}px rgba(0,0,0,0.25);`} button="Generate CSS"/>;
}

function CSSGradientTool() {
  return <FormTool fields={[{key:"angle",label:"Angle (deg)",type:"number",placeholder:"90"},{key:"from",label:"Start Color",placeholder:"#4f46e5"},{key:"to",label:"End Color",placeholder:"#ec4899"}]} compute={v=>`background: linear-gradient(${n(v.angle)||90}deg, ${v.from||"#4f46e5"}, ${v.to||"#ec4899"});`} button="Generate Gradient"/>;
}

function BorderRadiusTool() {
  return <FormTool fields={[{key:"tl",label:"Top Left (px)",type:"number"},{key:"tr",label:"Top Right (px)",type:"number"},{key:"br",label:"Bottom Right (px)",type:"number"},{key:"bl",label:"Bottom Left (px)",type:"number"}]} compute={v=>`border-radius: ${n(v.tl)}px ${n(v.tr)}px ${n(v.br)}px ${n(v.bl)}px;`} button="Generate CSS"/>;
}

function FlexboxTool() {
  return <FormTool fields={[{key:"direction",label:"Direction",type:"select",options:[{value:"row",label:"Row"},{value:"column",label:"Column"}]},{key:"justify",label:"Justify Content",type:"select",options:["flex-start","center","flex-end","space-between","space-around"].map(x=>({value:x,label:x}))},{key:"align",label:"Align Items",type:"select",options:["stretch","flex-start","center","flex-end"].map(x=>({value:x,label:x}))}]} compute={v=>`.container {\n  display: flex;\n  flex-direction: ${v.direction};\n  justify-content: ${v.justify};\n  align-items: ${v.align};\n}`} button="Generate CSS"/>;
}

function GridTool() {
  return <FormTool fields={[{key:"columns",label:"Columns",type:"number",min:1,max:12},{key:"gap",label:"Gap (px)",type:"number"}]} compute={v=>`.grid {\n  display: grid;\n  grid-template-columns: repeat(${Math.max(1,n(v.columns))}, 1fr);\n  gap: ${n(v.gap)}px;\n}`} button="Generate CSS"/>;
}

function ASCIIArtTool() {
  return <TextTool button="Create ASCII Text" transform={text=>text.toUpperCase().split("").map(c=>c===" "?"  ":`[${c}]`).join("")}/>;
}

function DiceTool() {
  const [count,setCount]=useState("1"),[sides,setSides]=useState("6"),[out,setOut]=useState("");
  return <Box><div className="grid gap-4 md:grid-cols-2"><FieldInput field={{key:"c",label:"Number of Dice",type:"number",min:1,max:20}} value={count} onChange={setCount}/><FieldInput field={{key:"s",label:"Sides per Die",type:"number",min:2,max:100}} value={sides} onChange={setSides}/></div><ActionButtons onRun={()=>{const rolls=Array.from({length:Math.max(1,n(count))},()=>Math.floor(Math.random()*Math.max(2,n(sides)))+1);setOut(`Rolls: ${rolls.join(", ")}\nTotal: ${rolls.reduce((a,b)=>a+b,0)}`)}} onReset={()=>setOut("")} label="Roll Dice"/>{out&&<Result value={out}/>}</Box>;
}

function TimerTool({pomodoro}:{pomodoro:boolean}) {
  const [seconds,setSeconds]=useState(pomodoro?1500:60);const [running,setRunning]=useState(false);
  useEffect(()=>{if(!running)return;const id=window.setInterval(()=>setSeconds(v=>{if(v<=1){setRunning(false);return 0}return v-1}),1000);return()=>window.clearInterval(id)},[running]);
  return <Box><div className="text-center text-6xl font-black tabular-nums">{String(Math.floor(seconds/60)).padStart(2,"0")}:{String(seconds%60).padStart(2,"0")}</div><div className="mt-6 flex justify-center gap-3"><button onClick={()=>setRunning(v=>!v)} className="rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white">{running?"Pause":"Start"}</button><button onClick={()=>{setRunning(false);setSeconds(pomodoro?1500:60)}} className="rounded-xl border px-5 py-3 font-bold">Reset</button></div></Box>;
}

function WorldClockTool() {
  const [date,setDate]=useState(new Date());useEffect(()=>{const id=window.setInterval(()=>setDate(new Date()),1000);return()=>clearInterval(id)},[]);
  const cities=[["India","Asia/Kolkata"],["London","Europe/London"],["New York","America/New_York"],["Tokyo","Asia/Tokyo"],["Dubai","Asia/Dubai"]];
  return <Box><div className="grid gap-4 md:grid-cols-2">{cities.map(([name,zone])=><div key={zone} className="rounded-xl border p-4"><b>{name}</b><div className="mt-2 text-2xl font-black">{date.toLocaleTimeString("en-US",{timeZone:zone})}</div><div className="text-sm text-gray-500">{date.toLocaleDateString("en-US",{timeZone:zone})}</div></div>)}</div></Box>;
}

function TimezoneTool() {
  return <FormTool fields={[{key:"date",label:"Date",type:"date"},{key:"time",label:"Time",type:"time"},{key:"zone",label:"Source Time Zone",type:"select",options:[{value:"Asia/Kolkata",label:"India"},{value:"Europe/London",label:"London"},{value:"America/New_York",label:"New York"},{value:"Asia/Tokyo",label:"Tokyo"},{value:"Asia/Dubai",label:"Dubai"}]}]} compute={v=>{const d=new Date(`${v.date}T${v.time||"00:00"}:00`);return d.toLocaleString("en-US",{timeZone:v.zone||"Asia/Kolkata",dateStyle:"full",timeStyle:"long"})}} button="Show Time"/>;
}

function UnixTool() {
  return <FormTool fields={[{key:"timestamp",label:"Unix Timestamp (seconds)",type:"number"}]} compute={v=>{const d=new Date(n(v.timestamp)*1000);return Number.isNaN(d.getTime())?"Invalid timestamp":d.toISOString()}} button="Convert"/>;
}

function AgeTool() {
  return <FormTool fields={[{key:"dob",label:"Date of Birth",type:"date"},{key:"asof",label:"Calculate Age On",type:"date"}]} compute={v=>{const dob=new Date(`${v.dob}T00:00:00`),asof=new Date(`${v.asof||new Date().toISOString().slice(0,10)}T00:00:00`);let years=asof.getFullYear()-dob.getFullYear(),months=asof.getMonth()-dob.getMonth(),days=asof.getDate()-dob.getDate();if(days<0){months--;days+=new Date(asof.getFullYear(),asof.getMonth(),0).getDate()}if(months<0){years--;months+=12}return `${years} years, ${months} months, ${days} days`}} button="Calculate Age"/>;
}

function WorkingDaysTool() {
  return <FormTool fields={[{key:"start",label:"Start Date",type:"date"},{key:"end",label:"End Date",type:"date"}]} compute={v=>{let a=new Date(`${v.start}T00:00:00`),b=new Date(`${v.end}T00:00:00`);if(a>b)[a,b]=[b,a];let count=0;for(const d=new Date(a);d<=b;d.setDate(d.getDate()+1)){const day=d.getDay();if(day!==0&&day!==6)count++}return `Working Days: ${count}`}} button="Count Working Days"/>;
}

function TimeDurationTool() {
  return <FormTool fields={[{key:"start",label:"Start Time",type:"time"},{key:"end",label:"End Time",type:"time"}]} compute={v=>{const [h1,m1]=(v.start||"00:00").split(":").map(Number),[h2,m2]=(v.end||"00:00").split(":").map(Number);let mins=h2*60+m2-(h1*60+m1);if(mins<0)mins+=1440;return `${Math.floor(mins/60)} hours ${mins%60} minutes`}} button="Calculate Duration"/>;
}

function SleepTool() {
  return <FormTool fields={[{key:"bed",label:"Bed Time",type:"time"},{key:"wake",label:"Wake Time",type:"time"}]} compute={v=>{const [h1,m1]=(v.bed||"22:00").split(":").map(Number),[h2,m2]=(v.wake||"06:00").split(":").map(Number);let mins=h2*60+m2-(h1*60+m1);if(mins<=0)mins+=1440;return `Sleep Duration: ${Math.floor(mins/60)}h ${mins%60}m`}} button="Calculate Sleep"/>;
}

function TodoTool() {
  const [task,setTask]=useState("");const [tasks,setTasks]=useState<string[]>([]);
  return <Box><div className="flex gap-3"><input className="tool-input" value={task} onChange={e=>setTask(e.target.value)} placeholder="Add a task..."/><button className="rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white" onClick={()=>{if(task.trim()){setTasks([...tasks,task.trim()]);setTask("")}}}>Add</button></div><div className="mt-5 space-y-2">{tasks.map((t,i)=><div key={`${t}-${i}`} className="flex items-center justify-between rounded-xl border p-3"><span>{t}</span><button className="text-red-600" onClick={()=>setTasks(tasks.filter((_,j)=>j!==i))}>Delete</button></div>)}</div></Box>;
}

function HabitTool() {
  const [habit,setHabit]=useState("");const [habits,setHabits]=useState<string[]>([]);
  return <Box><div className="flex gap-3"><input className="tool-input" value={habit} onChange={e=>setHabit(e.target.value)} placeholder="Habit name..."/><button className="rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white" onClick={()=>{if(habit.trim()){setHabits([...habits,habit.trim()]);setHabit("")}}}>Add Habit</button></div><div className="mt-5 space-y-2">{habits.map((h,i)=><label key={`${h}-${i}`} className="flex items-center gap-3 rounded-xl border p-3"><input type="checkbox"/>{h}</label>)}</div></Box>;
}

function RandomTeamTool() {
  const [names,setNames]=useState("");const [size,setSize]=useState("2");const [out,setOut]=useState("");
  return <Box><textarea className="tool-input min-h-40" value={names} onChange={e=>setNames(e.target.value)} placeholder="One name per line..."/><FieldInput field={{key:"size",label:"People per Team",type:"number",min:1}} value={size} onChange={setSize}/><ActionButtons onRun={()=>{const arr=names.split(/\r?\n/).map(x=>x.trim()).filter(Boolean).sort(()=>Math.random()-0.5);const s=Math.max(1,n(size));const groups=[];for(let i=0;i<arr.length;i+=s)groups.push(`Team ${groups.length+1}: ${arr.slice(i,i+s).join(", ")}`);setOut(groups.join("\n"))}} onReset={()=>{setNames("");setOut("")}} label="Generate Teams"/>{out&&<Result value={out}/>}</Box>;
}

function AttendanceTool() {
  return <FormTool fields={[{key:"attended",label:"Classes Attended",type:"number"},{key:"total",label:"Total Classes",type:"number"}]} compute={v=>{if(!n(v.total))return "Total classes must be greater than zero.";return `Attendance: ${f(n(v.attended)/n(v.total)*100)}%`}} button="Calculate Attendance"/>;
}

function ExamCountdownTool() {
  const [date,setDate]=useState("");const [out,setOut]=useState("");
  useEffect(()=>{if(!date)return;const id=window.setInterval(()=>{const diff=new Date(date).getTime()-Date.now();if(diff<=0)setOut("Exam time has arrived.");else{const d=Math.floor(diff/86400000),h=Math.floor(diff/3600000)%24,m=Math.floor(diff/60000)%60,s=Math.floor(diff/1000)%60;setOut(`${d} days ${h}h ${m}m ${s}s`)}} ,1000);return()=>clearInterval(id)},[date]);
  return <Box><FieldInput field={{key:"date",label:"Exam Date & Time",type:"datetime-local" as FieldType}} value={date} onChange={setDate}/>{out&&<Result value={out}/>}</Box>;
}

function GradePredictorTool() {
  const [items,setItems]=useState("Assignment,20,18\nMidterm,30,24\nQuiz,10,9");const [out,setOut]=useState("");
  return <Box><textarea className="tool-input min-h-40" value={items} onChange={e=>setItems(e.target.value)} placeholder="Name,weight,score per line..."/><ActionButtons onRun={()=>{const rows=items.split(/\r?\n/).map(x=>x.split(","));let total=0;for(const r of rows){const w=Number(r[1]),s=Number(r[2]);if(Number.isFinite(w)&&Number.isFinite(s))total+=s/w*100*(w/100)}setOut(`Weighted Score: ${f(total)}%`)}} onReset={()=>setOut("")} label="Predict Grade"/>{out&&<Result value={out}/>}</Box>;
}

function FlashcardTool() {
  const [cards, setCards] = useState(
    "What is CPU?|Central Processing Unit\nWhat is RAM?|Random Access Memory\nWhat is ROM?|Read Only Memory"
  );

  const [index, setIndex] = useState(0);
  const [show, setShow] = useState(false);
  const [shuffle, setShuffle] = useState(false);

  const parsed = cards
    .split(/\r?\n/)
    .map((line) => {
      const parts = line.split("|");
      return {
        question: parts[0]?.trim() || "",
        answer: parts.slice(1).join("|").trim(),
      };
    })
    .filter((card) => card.question && card.answer);

  const currentCard = parsed[index];

  const nextCard = () => {
    if (!parsed.length) return;

    setIndex((prev) => (prev + 1) % parsed.length);
    setShow(false);
  };

  const previousCard = () => {
    if (!parsed.length) return;

    setIndex((prev) => (prev - 1 + parsed.length) % parsed.length);
    setShow(false);
  };

  const shuffleCards = () => {
    if (!parsed.length) return;

    const shuffled = [...parsed].sort(() => Math.random() - 0.5);

    const newText = shuffled
      .map((card) => `${card.question}|${card.answer}`)
      .join("\n");

    setCards(newText);
    setIndex(0);
    setShow(false);
    setShuffle(true);
  };

  const resetCards = () => {
    setCards(
      "What is CPU?|Central Processing Unit\nWhat is RAM?|Random Access Memory\nWhat is ROM?|Read Only Memory"
    );
    setIndex(0);
    setShow(false);
    setShuffle(false);
  };

  return (
    <Box>
      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-bold">
            Enter Flashcards
          </label>

          <textarea
            className="tool-input min-h-40"
            value={cards}
            onChange={(e) => {
              setCards(e.target.value);
              setIndex(0);
              setShow(false);
            }}
            placeholder={
              "Question|Answer\nQuestion|Answer\nQuestion|Answer"
            }
          />

          <p className="mt-2 text-sm text-gray-500">
            Format: <b>Question|Answer</b> ÃƒÂ¯Ã‚Â¿Ã‚Â½ one flashcard per line.
          </p>
        </div>

        {parsed.length > 0 && currentCard && (
          <div className="rounded-2xl border bg-white p-6 shadow-sm dark:bg-gray-950">
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                Card {index + 1} of {parsed.length}
              </span>

              {shuffle && (
                <span className="text-sm font-semibold text-green-600">
                  Shuffled
                </span>
              )}
            </div>

            <div className="mt-6 rounded-2xl bg-gray-50 p-6 text-center dark:bg-gray-900">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Question
              </p>

              <h3 className="mt-3 text-2xl font-black">
                {currentCard.question}
              </h3>

              {show && (
                <div className="mt-6 rounded-xl border bg-white p-5 dark:bg-gray-950">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Answer
                  </p>

                  <p className="mt-2 text-lg font-semibold">
                    {currentCard.answer}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => setShow((value) => !value)}
                className="rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white hover:bg-indigo-700"
              >
                {show ? "Hide Answer" : "Show Answer"}
              </button>

              <button
                type="button"
                onClick={previousCard}
                className="rounded-xl border px-5 py-3 font-bold hover:bg-gray-50 dark:hover:bg-gray-900"
              >
                ? Previous
              </button>

              <button
                type="button"
                onClick={nextCard}
                className="rounded-xl border px-5 py-3 font-bold hover:bg-gray-50 dark:hover:bg-gray-900"
              >
                Next ?
              </button>
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={shuffleCards}
                className="rounded-xl border px-5 py-3 font-bold hover:bg-gray-50 dark:hover:bg-gray-900"
              >
                ?? Shuffle Cards
              </button>

              <button
                type="button"
                onClick={resetCards}
                className="rounded-xl border border-red-200 px-5 py-3 font-bold text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
              >
                Reset
              </button>
            </div>
          </div>
        )}

        {parsed.length === 0 && (
          <div className="rounded-xl border border-yellow-300 bg-yellow-50 p-4 text-sm font-semibold text-yellow-800 dark:border-yellow-900 dark:bg-yellow-950 dark:text-yellow-200">
            Please enter at least one valid flashcard using:
            <br />
            <b>Question|Answer</b>
          </div>
        )}

        <div className="rounded-xl border bg-gray-50 p-4 text-sm dark:bg-gray-900">
          <p className="font-bold">How to use:</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-gray-600 dark:text-gray-300">
            <li>Write one question and answer on each line.</li>
            <li>Separate the question and answer using |</li>
            <li>Click Show Answer to reveal the answer.</li>
            <li>Use Previous / Next to study.</li>
            <li>Use Shuffle Cards for random revision.</li>
          </ol>
        </div>
      </div>
    </Box>
  );
}

function MatrixTool() {
  const [a,setA]=useState("1 2\n3 4"),[b,setB]=useState("5 6\n7 8"),[op,setOp]=useState("+"),[out,setOut]=useState("");
  const parse=(s:string)=>s.trim().split(/\n/).map(r=>r.trim().split(/\s+/).map(Number));
  return <Box><div className="grid gap-4 md:grid-cols-2"><textarea className="tool-input min-h-32" value={a} onChange={e=>setA(e.target.value)} /><textarea className="tool-input min-h-32" value={b} onChange={e=>setB(e.target.value)} /></div><select className="tool-input mt-4" value={op} onChange={e=>setOp(e.target.value)}><option>+</option><option>-</option><option>ÃƒÆ’Ã¢â‚¬â€</option></select><ActionButtons onRun={()=>{const x=parse(a),y=parse(b);if(x.length!==2||y.length!==2||x.some(r=>r.length!==2)||y.some(r=>r.length!==2))return setOut("Enter two 2ÃƒÆ’Ã¢â‚¬â€2 matrices.");const z=x.map((r,i)=>r.map((v,j)=>op==="+"?v+y[i][j]:op==="-"?v-y[i][j]:x[i][0]*y[0][j]+x[i][1]*y[1][j]));setOut(z.map(r=>r.join("  ")).join("\n"))}} onReset={()=>setOut("")} label="Calculate Matrix"/>{out&&<Result value={out}/>}</Box>;
}

/* ---------- Image tools ---------- */

function ImageTool({ slug }: { slug: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [quality, setQuality] = useState("0.8");
  const [originalSize, setOriginalSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState(0);
  const [busy, setBusy] = useState(false);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const compressionPercentage =
    originalSize > 0 && compressedSize > 0
      ? ((originalSize - compressedSize) / originalSize) * 100
      : 0;

  const process = () => {
    if (!file) return;

    setBusy(true);
    setUrl("");
    setCompressedSize(0);

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement("canvas");

      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext("2d");

      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        setBusy(false);
        return;
      }

      /*
       * White background is added before JPEG conversion.
       * This prevents transparent PNG areas from becoming black.
       */
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const selectedQuality = Math.max(
        0.1,
        Math.min(1, Number(quality) || 0.8)
      );

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(objectUrl);
          setBusy(false);

          if (!blob) return;

          const resultUrl = URL.createObjectURL(blob);

          setUrl(resultUrl);
          setOriginalSize(file.size);
          setCompressedSize(blob.size);
        },
        "image/jpeg",
        selectedQuality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setBusy(false);
    };

    img.src = objectUrl;
  };

  const reset = () => {
    if (url) {
      URL.revokeObjectURL(url);
    }

    setFile(null);
    setUrl("");
    setOriginalSize(0);
    setCompressedSize(0);
    setQuality("0.8");
  };

  return (
    <Box>
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-bold">
            Select Image
          </label>

          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const selectedFile = e.target.files?.[0] || null;

              if (url) {
                URL.revokeObjectURL(url);
              }

              setFile(selectedFile);
              setUrl("");
              setOriginalSize(selectedFile?.size || 0);
              setCompressedSize(0);
            }}
            className="mt-2 block w-full rounded-xl border p-3"
          />

          <p className="mt-2 text-sm text-gray-500">
            Supported formats: JPG, JPEG, PNG, WebP and other browser-supported images.
          </p>
        </div>

        {file && (
          <div className="rounded-2xl border bg-gray-50 p-5 dark:bg-gray-900">
            <p className="text-sm font-bold">Selected Image</p>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border bg-white p-4 dark:bg-gray-950">
                <p className="text-xs text-gray-500">File Name</p>
                <p className="mt-1 truncate font-semibold">
                  {file.name}
                </p>
              </div>

              <div className="rounded-xl border bg-white p-4 dark:bg-gray-950">
                <p className="text-xs text-gray-500">Original Size</p>
                <p className="mt-1 font-semibold">
                  {formatSize(file.size)}
                </p>
              </div>
            </div>
          </div>
        )}

        {slug === "image-compressor" && (
          <div className="rounded-2xl border p-5">
            <label className="block text-sm font-bold">
              Compression Quality
            </label>

            <div className="mt-3 flex items-center gap-4">
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={quality}
                onChange={(e) => setQuality(e.target.value)}
                className="w-full"
              />

              <span className="min-w-16 rounded-lg bg-indigo-100 px-3 py-2 text-center font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                {Math.round(Number(quality) * 100)}%
              </span>
            </div>

            <p className="mt-2 text-sm text-gray-500">
              Lower quality usually produces a smaller file.
            </p>
          </div>
        )}

        <ActionButtons
          onRun={process}
          onReset={reset}
          label={
            busy
              ? "Compressing..."
              : slug === "image-compressor"
                ? "Compress Image"
                : "Process Image"
          }
        />

        {compressedSize > 0 && (
          <div className="rounded-2xl border bg-gray-50 p-5 dark:bg-gray-900">
            <h3 className="text-lg font-black">
              Compression Result
            </h3>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border bg-white p-4 dark:bg-gray-950">
                <p className="text-xs text-gray-500">
                  Original Size
                </p>
                <p className="mt-1 text-lg font-black">
                  {formatSize(originalSize)}
                </p>
              </div>

              <div className="rounded-xl border bg-white p-4 dark:bg-gray-950">
                <p className="text-xs text-gray-500">
                  Compressed Size
                </p>
                <p className="mt-1 text-lg font-black">
                  {formatSize(compressedSize)}
                </p>
              </div>

              <div className="rounded-xl border bg-white p-4 dark:bg-gray-950">
                <p className="text-xs text-gray-500">
                  Size Reduction
                </p>
                <p className="mt-1 text-lg font-black text-green-600">
                  {compressionPercentage > 0
                    ? `${compressionPercentage.toFixed(1)}%`
                    : "0%"}
                </p>
              </div>
            </div>

            {compressionPercentage > 0 ? (
              <p className="mt-4 rounded-xl bg-green-50 p-4 text-sm font-semibold text-green-700 dark:bg-green-950 dark:text-green-300">
                ?? Your image is now{" "}
                {compressionPercentage.toFixed(1)}% smaller.
              </p>
            ) : (
              <p className="mt-4 rounded-xl bg-yellow-50 p-4 text-sm font-semibold text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300">
                This image could not be reduced with the selected quality.
                Try a lower quality setting.
              </p>
            )}
          </div>
        )}

        {url && (
          <div className="rounded-2xl border p-5">
            <h3 className="text-lg font-black">
              Compressed Image Preview
            </h3>

            <div className="mt-4 overflow-hidden rounded-2xl border bg-gray-100 p-3 dark:bg-gray-900">
              <img
                src={url}
                alt="Compressed preview"
                className="mx-auto max-h-96 max-w-full rounded-xl object-contain"
              />
            </div>

            <div className="mt-5 flex justify-center">
              <DownloadButton
                href={url}
                name="toolnest-compressed-image.jpg"
              />
            </div>
          </div>
        )}

        <div className="rounded-xl border bg-gray-50 p-4 text-sm dark:bg-gray-900">
          <p className="font-bold">
            How Image Compression Works
          </p>

          <ul className="mt-2 list-disc space-y-1 pl-5 text-gray-600 dark:text-gray-300">
            <li>Select an image from your device.</li>
            <li>Choose the compression quality.</li>
            <li>Click Compress Image.</li>
            <li>Compare the original and compressed file sizes.</li>
            <li>Download the compressed image.</li>
          </ul>
        </div>
      </div>
    </Box>
  );
}

/* ---------- PDF / document tools ---------- */

function PDFError({message}:{message:string}) {
  if (!message) return null;
  return <div className="mt-4 rounded-xl border border-red-300 bg-red-50 p-4 text-sm font-semibold text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">{message}</div>;
}

function PDFFilePicker({
  multiple=false,
  files,
  setFiles,
}:{
  multiple?:boolean;
  files:File[];
  setFiles:(files:File[])=>void;
}) {
  const addFiles=(incoming:File[])=>{
    const pdfs=incoming.filter(f=>/\.pdf$/i.test(f.name) || f.type==="application/pdf");
    setFiles(multiple ? [...files,...pdfs] : pdfs.slice(0,1));
  };

  const removeAt=(index:number)=>setFiles(files.filter((_,i)=>i!==index));
  const move=(from:number,to:number)=>{
    if(to<0||to>=files.length)return;
    const next=[...files];
    [next[from],next[to]]=[next[to],next[from]];
    setFiles(next);
  };

  return <div className="space-y-3">
    <label className="block text-sm font-semibold">
      Select PDF{multiple?" files":""}
      <input
        type="file"
        accept="application/pdf,.pdf"
        multiple={multiple}
        onChange={e=>addFiles(Array.from(e.target.files||[]))}
        className="mt-2 block w-full rounded-xl border p-3"
      />
    </label>

    {files.length>0 && <div className="space-y-2 rounded-xl bg-gray-50 p-4 dark:bg-gray-900">
      {files.map((file,index)=><div key={`${file.name}-${file.size}-${index}`} className="flex flex-wrap items-center gap-2 rounded-lg border bg-white p-3 dark:bg-gray-950">
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold">{index+1}. {file.name}</div>
          <div className="text-xs text-gray-500">{(file.size/1024/1024).toFixed(2)} MB</div>
        </div>
        {multiple && <button type="button" onClick={()=>move(index,index-1)} disabled={index===0} className="rounded-lg border px-2 py-1 text-sm disabled:opacity-40">ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬Ëœ</button>}
        {multiple && <button type="button" onClick={()=>move(index,index+1)} disabled={index===files.length-1} className="rounded-lg border px-2 py-1 text-sm disabled:opacity-40">ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬Å“</button>}
        <button type="button" onClick={()=>removeAt(index)} className="rounded-lg border border-red-200 px-2 py-1 text-sm font-semibold text-red-600">Remove</button>
      </div>)}
    </div>}
  </div>;
}

function pdfBlobUrl(bytes:Uint8Array) {
  const buffer=bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength) as ArrayBuffer;
  return URL.createObjectURL(new Blob([buffer],{type:"application/pdf"}));
}

function checkPdfFile(file:File) {
  if (!/\.pdf$/i.test(file.name) && file.type!=="application/pdf") {
    throw new Error(`"${file.name}" is not a PDF file.`);
  }
}

async function loadPdf(file:File) {
  checkPdfFile(file);
  const bytes=await file.arrayBuffer();
  if (bytes.byteLength<5) throw new Error(`"${file.name}" is empty or incomplete.`);
  return PDFDocument.load(bytes);
}

/* ---------- PDF / document tools ---------- */

function ImageToPDFTool() {
  const [files,setFiles]=useState<File[]>([]);
  const [url,setUrl]=useState("");
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);

  const run=async()=>{
    setError(""); setUrl("");
    if(!files.length){setError("Please select at least one image.");return;}
    setBusy(true);
    try{
      const doc=new jsPDF({unit:"mm",format:"a4"});
      for(let i=0;i<files.length;i++){
        const file=files[i];
        const data=await fileToDataURL(file);
        const img=await loadImage(data);
        if(i>0)doc.addPage();

        const pageW=doc.internal.pageSize.getWidth();
        const pageH=doc.internal.pageSize.getHeight();
        const margin=10;
        const maxW=pageW-margin*2;
        const maxH=pageH-margin*2;
        const scale=Math.min(maxW/img.width,maxH/img.height);
        const w=img.width*scale;
        const h=img.height*scale;
        const format=file.type==="image/png"?"PNG":file.type==="image/webp"?"WEBP":"JPEG";
        doc.addImage(data,format,(pageW-w)/2,(pageH-h)/2,w,h);
      }
      setUrl(doc.output("bloburl").toString());
    }catch(e){
      setError(e instanceof Error?e.message:"Could not create the PDF.");
    }finally{setBusy(false);}
  };

  return <Box>
    <FileBox accept="image/*" multiple files={files} setFiles={setFiles}/>
    <ActionButtons onRun={run} onReset={()=>{setFiles([]);setUrl("");setError("")}} label={busy?"Creating PDF...":"Convert to PDF"}/>
    <PDFError message={error}/>
    {url&&<DownloadButton href={url} name="images.pdf">Download Images PDF</DownloadButton>}
  </Box>;
}

function PDFMergeTool() {
  const [files,setFiles]=useState<File[]>([]);
  const [url,setUrl]=useState("");
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);

  const run=async()=>{
    setError(""); setUrl("");
    if(files.length<2){setError("Please select at least 2 PDF files to merge.");return;}
    setBusy(true);
    try{
      const out=await PDFDocument.create();
      for(const file of files){
        const src=await loadPdf(file);
        const pages=await out.copyPages(src,src.getPageIndices());
        pages.forEach(page=>out.addPage(page));
      }
      if(out.getPageCount()===0)throw new Error("The selected PDFs contain no pages.");
      const bytes=await out.save({useObjectStreams:false});
      setUrl(pdfBlobUrl(bytes));
    }catch(e){
      setError(e instanceof Error
        ? `Merge failed: ${e.message} Make sure every file is a valid, non-password-protected PDF.`
        : "Merge failed. Please check the PDF files.");
    }finally{setBusy(false);}
  };

  return <Box>
    <PDFFilePicker multiple files={files} setFiles={setFiles}/>
    <p className="mt-3 text-sm text-gray-500">The PDFs are merged in the order shown above. Use ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬Ëœ/ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬Å“ to change the order.</p>
    <ActionButtons onRun={run} onReset={()=>{setFiles([]);setUrl("");setError("")}} label={busy?"Merging...":"Merge PDFs"}/>
    <PDFError message={error}/>
    {url&&<DownloadButton href={url} name="merged.pdf">Download Merged PDF</DownloadButton>}
  </Box>;
}

function PDFSplitTool() {
  const [files,setFiles]=useState<File[]>([]);
  const [pages,setPages]=useState("1");
  const [url,setUrl]=useState("");
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);

  const run=async()=>{
    setError(""); setUrl("");
    if(!files[0]){setError("Please select a PDF file.");return;}
    setBusy(true);
    try{
      const src=await loadPdf(files[0]);
      const count=src.getPageCount();
      const indexes=parsePageSelection(pages,count);
      if(!indexes.length)throw new Error(`No valid pages found. This PDF has ${count} page${count===1?"":"s"}. Use examples like 1,3,5-7.`);
      const out=await PDFDocument.create();
      const copied=await out.copyPages(src,indexes);
      copied.forEach(page=>out.addPage(page));
      const bytes=await out.save({useObjectStreams:false});
      setUrl(pdfBlobUrl(bytes));
    }catch(e){
      setError(e instanceof Error?e.message:"Could not extract the selected pages.");
    }finally{setBusy(false);}
  };

  return <Box>
    <PDFFilePicker files={files} setFiles={setFiles}/>
    <div className="mt-4">
      <FieldInput field={{key:"pages",label:"Pages to extract (e.g. 1,3,5-7)"}} value={pages} onChange={setPages}/>
    </div>
    <p className="mt-3 text-sm text-gray-500">Page numbers start at 1. Ranges and comma-separated pages are supported.</p>
    <ActionButtons onRun={run} onReset={()=>{setFiles([]);setPages("1");setUrl("");setError("")}} label={busy?"Extracting...":"Extract Pages"}/>
    <PDFError message={error}/>
    {url&&<DownloadButton href={url} name="extracted-pages.pdf">Download Extracted PDF</DownloadButton>}
  </Box>;
}

function PDFRotateTool() {
  const [files,setFiles]=useState<File[]>([]);
  const [angle,setAngle]=useState("90");
  const [url,setUrl]=useState("");
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);

  const run=async()=>{
    setError(""); setUrl("");
    if(!files[0]){setError("Please select a PDF file.");return;}
    setBusy(true);
    try{
      const doc=await loadPdf(files[0]);
      const rotation=Number(angle);
      doc.getPages().forEach(page=>{
        const current=page.getRotation().angle;
        page.setRotation(degrees((current+rotation)%360));
      });
      const bytes=await doc.save({useObjectStreams:false});
      setUrl(pdfBlobUrl(bytes));
    }catch(e){
      setError(e instanceof Error
        ? `Rotation failed: ${e.message} Make sure the PDF is valid and not password-protected.`
        : "Rotation failed.");
    }finally{setBusy(false);}
  };

  return <Box>
    <PDFFilePicker files={files} setFiles={setFiles}/>
    <div className="mt-4">
      <FieldInput field={{key:"angle",label:"Rotation",type:"select",options:["90","180","270"].map(x=>({value:x,label:`${x}Ãƒâ€šÃ‚Â° clockwise`}))}} value={angle} onChange={setAngle}/>
    </div>
    <ActionButtons onRun={run} onReset={()=>{setFiles([]);setAngle("90");setUrl("");setError("")}} label={busy?"Rotating...":"Rotate PDF"}/>
    <PDFError message={error}/>
    {url&&<DownloadButton href={url} name="rotated.pdf">Download Rotated PDF</DownloadButton>}
  </Box>;
}

function WordToPDFTool() {
  const [files,setFiles]=useState<File[]>([]);
  const [url,setUrl]=useState("");
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);

  const run=async()=>{
    setError(""); setUrl("");
    if(!files[0]){setError("Please select a DOCX file.");return;}
    setBusy(true);
    try{
      const result=await mammoth.extractRawText({arrayBuffer:await files[0].arrayBuffer()});
      const doc=new jsPDF({unit:"pt",format:"a4"});
      const margin=42;
      const width=doc.internal.pageSize.getWidth()-margin*2;
      const lines=doc.splitTextToSize(result.value||"No text found in document.",width);
      let y=55;
      for(const line of lines){
        if(y>doc.internal.pageSize.getHeight()-50){doc.addPage();y=55;}
        doc.text(line,margin,y);
        y+=16;
      }
      setUrl(doc.output("bloburl").toString());
    }catch(e){
      setError(e instanceof Error?e.message:"Could not convert the Word document.");
    }finally{setBusy(false);}
  };

  return <Box>
    <FileBox accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" files={files} setFiles={setFiles}/>
    <ActionButtons onRun={run} onReset={()=>{setFiles([]);setUrl("");setError("")}} label={busy?"Converting...":"Convert Word to PDF"}/>
    <PDFError message={error}/>
    {url&&<DownloadButton href={url} name="word-document.pdf">Download Word PDF</DownloadButton>}
    <p className="mt-4 text-sm text-gray-500">This browser version extracts DOCX text and creates a clean PDF. Complex Word layouts, headers, footers, tables and images may not be preserved exactly.</p>
  </Box>;
}

async function fileToDataURL(file:File):Promise<string>{return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result));r.onerror=reject;r.readAsDataURL(file)})}
function loadImage(src:string):Promise<HTMLImageElement>{return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=src})}
function parsePageSelection(input:string,count:number){
  const set=new Set<number>();
  for(const part of input.split(",")){
    const p=part.trim();
    if(/^\d+$/.test(p)){
      const i=Number(p)-1;
      if(i>=0&&i<count)set.add(i);
    }else if(/^(\d+)\s*-\s*(\d+)$/.test(p)){
      const [a,b]=p.split("-").map(x=>Number(x.trim()));
      for(let i=Math.min(a,b);i<=Math.max(a,b);i++)if(i>=1&&i<=count)set.add(i-1);
    }
  }
  return [...set].sort((a,b)=>a-b)
}

/* ---------- Misc ---------- */

export default ToolRunner;










