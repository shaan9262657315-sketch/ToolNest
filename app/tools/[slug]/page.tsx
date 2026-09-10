import { tools } from "@/lib/tools";
import { ToolRunner } from "@/components/ToolRunner";
import { ToolCard } from "@/components/ToolCard";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

const seoContent: Record<
  string,
  {
    title: string;
    description: string;
    intro: string;
    howTo: string[];
    example: string;
    faqs: { question: string; answer: string }[];
  }
> = {
  "percentage-calculator": {
    title: "Percentage Calculator - Find What Percent One Number Is of Another | ToolNest",
    description:
      "Free percentage calculator to find what percent one number is of another. Calculate percentages instantly with a simple online calculator.",
    intro:
      "Use this free Percentage Calculator to find what percent one number is of another. It is useful for students, marks calculations, everyday math, and quick percentage problems.",
    howTo: [
      "Enter the number you want to calculate the percentage of in the first field.",
      "Enter the total or reference number in the second field.",
      "Click Calculate Percentage to get the result instantly.",
    ],
    example:
      "For example, if you want to find what percentage 25 is of 200, enter 25 as the value and 200 as the total. The calculator gives 12.5%.",
    faqs: [
      {
        question: "How do I calculate what percent one number is of another?",
        answer:
          "Divide the first number by the second number and multiply the result by 100. For example, 25 out of 200 is 12.5%.",
      },
      {
        question: "What is 25 as a percentage of 200?",
        answer:
          "25 is 12.5% of 200.",
      },
      {
        question: "Can I use this percentage calculator for exam marks?",
        answer:
          "Yes. You can use it to calculate the percentage of marks obtained compared with total marks.",
      },
      {
        question: "Is this percentage calculator free?",
        answer:
          "Yes. ToolNest provides this calculator free to use without requiring an account.",
      },
    ],
  },
  "percentage-increase-calculator": {
  title:
    "Percentage Increase Calculator - Calculate Percentage Increase or Decrease | ToolNest",

  description:
    "Free percentage increase calculator to find the percentage change between an original value and a new value. Calculate increase or decrease instantly.",

  intro:
    "Use this free Percentage Increase Calculator to find how much a value has increased or decreased in percentage terms. Enter the original value and the new value to calculate the percentage change instantly.",

  howTo: [
    "Enter the original or starting value.",
    "Enter the new or final value.",
    "Click the calculate button to find the percentage increase or decrease.",
  ],

  example:
    "For example, if a value changes from 100 to 120, the increase is 20. The percentage increase is 20%. If the value changes from 100 to 80, the result is a 20% decrease.",

  faqs: [
    {
      question: "How do you calculate percentage increase?",
      answer:
        "Subtract the original value from the new value, divide the difference by the original value, and multiply by 100.",
    },
    {
      question: "What is the percentage increase from 100 to 120?",
      answer:
        "The value increases by 20, which is a 20% increase from 100 to 120.",
    },
    {
      question: "Can this calculator calculate percentage decrease?",
      answer:
        "Yes. If the new value is smaller than the original value, the calculator reports the percentage decrease.",
    },
    {
      question: "Can students use this calculator?",
      answer:
        "Yes. It can be useful for mathematics, marks comparison, statistics, price changes, and other percentage-change calculations.",
    },
  ],
},
"discount-calculator": {
  title:
    "Discount Calculator - Calculate Sale Price and Savings | ToolNest",

  description:
    "Free discount calculator to calculate sale price, discount amount, and total savings from an original price and discount percentage.",

  intro:
    "Use this free Discount Calculator to quickly find the sale price and money saved after applying a discount. It is useful for shopping, price comparisons, student budgeting, and everyday calculations.",

  howTo: [
    "Enter the original price of the product or item.",
    "Enter the discount percentage.",
    "Click the calculate button to find the sale price and amount saved.",
  ],

  example:
    "For example, if an item costs ₹1,000 and has a 20% discount, you save ₹200 and the sale price is ₹800.",

  faqs: [
    {
      question: "How do you calculate a discount?",
      answer:
        "Multiply the original price by the discount percentage and divide by 100. Subtract the discount amount from the original price to get the sale price.",
    },
    {
      question: "What is 20% off ₹1,000?",
      answer:
        "A 20% discount on ₹1,000 is ₹200, so the final sale price is ₹800.",
    },
    {
      question: "Does this calculator show how much I save?",
      answer:
        "Yes. The calculator shows both the final sale price and the amount saved from the discount.",
    },
    {
      question: "Can I use this discount calculator for shopping?",
      answer:
        "Yes. You can use it to quickly calculate discounts and compare sale prices while shopping online or in stores.",
    },
  ],
},
"average-calculator": {
  title:
    "Average Calculator - Calculate the Average of Numbers | ToolNest",

  description:
    "Free average calculator to calculate the arithmetic mean of numbers quickly. Enter numbers separated by commas or spaces and get the average instantly.",

  intro:
    "Use this free Average Calculator to find the arithmetic mean of a list of numbers. It is useful for students calculating marks, scores, test results, statistics, and everyday numerical data.",

  howTo: [
    "Enter the numbers you want to calculate the average of.",
    "Separate the numbers using commas or spaces.",
    "Click Calculate Average to instantly find the count and average.",
  ],

  example:
    "For example, if you enter 10, 20, 30, 40, and 50, the total is 150 and there are 5 numbers. The average is 30.",

  faqs: [
    {
      question: "How do you calculate an average?",
      answer:
        "Add all the numbers together and divide the total by the number of values.",
    },
    {
      question: "What is the average of 10, 20, and 30?",
      answer:
        "The average is 20 because (10 + 20 + 30) divided by 3 equals 20.",
    },
    {
      question: "Can I enter numbers separated by spaces?",
      answer:
        "Yes. You can enter numbers separated by commas or spaces.",
    },
    {
      question: "Can students use this average calculator?",
      answer:
        "Yes. Students can use it to calculate average marks, scores, grades, and other numerical data.",
    },
  ],
},
"date-difference-calculator": {
  title:
    "Date Difference Calculator - Calculate Days Between Two Dates | ToolNest",

  description:
    "Free date difference calculator to find the exact number of days between two dates. Quickly calculate the difference between any two dates online.",

  intro:
    "Use this free Date Difference Calculator to find the difference between two dates. It is useful for students, assignment deadlines, project planning, event planning, and everyday date calculations.",

  howTo: [
    "Select the starting date.",
    "Select the ending date.",
    "Click the calculate button to find the difference between the two dates.",
  ],

  example:
    "For example, if the starting date is January 1 and the ending date is January 10 of the same year, the difference between the dates is 9 days.",

  faqs: [
    {
      question: "How do you calculate the difference between two dates?",
      answer:
        "The difference is calculated by finding the time between the starting date and ending date. This calculator gives the difference in days.",
    },
    {
      question: "Can I calculate the number of days between two dates?",
      answer:
        "Yes. Enter the start date and end date to calculate the number of days between them.",
    },
    {
      question: "Is the date difference calculator useful for students?",
      answer:
        "Yes. Students can use it to calculate days between exams, assignments, deadlines, semesters, and other important dates.",
    },
    {
      question: "Is this date calculator free?",
      answer:
        "Yes. ToolNest provides this date difference calculator free to use without requiring an account.",
    },
  ],
},
};

export function generateStaticParams() {
  return tools.map((tool) => ({
    slug: tool.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  const tool = tools.find((item) => item.slug === slug);

  if (!tool) {
    return {};
  }

  const custom = seoContent[slug];

  const title =
    custom?.title ?? `${tool.name} - Free Online Tool | ToolNest`;

  const description =
    custom?.description ??
    `${tool.description} Use this free online tool on ToolNest with instant results.`;

  return {
    title,
    description,

    alternates: {
      canonical: `/tools/${tool.slug}`,
    },

    robots: {
      index: true,
      follow: true,
    },

    openGraph: {
      title,
      description,
      type: "website",
      url: `/tools/${tool.slug}`,
      siteName: "ToolNest",
    },

    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function ToolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const tool = tools.find((item) => item.slug === slug);

  if (!tool) {
    notFound();
  }

  const custom = seoContent[slug];

  const relatedTools = tools
    .filter(
      (item) =>
        item.category === tool.category &&
        item.slug !== tool.slug
    )
    .slice(0, 4);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="mb-8 text-sm text-gray-500"
      >
        <a
          href="/"
          className="hover:text-indigo-600"
        >
          Home
        </a>

        <span className="mx-2">/</span>

        <a
          href="/tools"
          className="hover:text-indigo-600"
        >
          Tools
        </a>

        <span className="mx-2">/</span>

        <span className="text-gray-700 dark:text-gray-300">
          {tool.name}
        </span>
      </nav>

      {/* Tool Header */}
      <header className="mb-8">
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200">
          {tool.category}
        </span>

        <h1 className="mt-4 text-4xl font-black md:text-5xl">
          {tool.name}
        </h1>

        <p className="mt-3 max-w-3xl text-lg text-gray-500 dark:text-gray-400">
          {custom?.intro ?? tool.description}
        </p>
      </header>

      {/* Existing Tool - functionality unchanged */}
      <ToolRunner slug={tool.slug} />

      {/* SEO Content */}
      <article className="mt-12 grid gap-8 md:grid-cols-[1fr_300px]">
        <div className="card p-7">
          <h2 className="text-2xl font-black">
            How to use {tool.name}
          </h2>

          {custom ? (
            <ol className="mt-4 list-decimal space-y-3 pl-6 leading-8 text-gray-600 dark:text-gray-300">
              {custom.howTo.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          ) : (
            <p className="mt-4 leading-8 text-gray-600 dark:text-gray-300">
              Enter your values or data into the tool above and
              choose the required action. Results are calculated
              instantly.
            </p>
          )}

          {custom && (
            <>
              <h2 className="mt-8 text-2xl font-black">
                Example
              </h2>

              <p className="mt-4 leading-8 text-gray-600 dark:text-gray-300">
                {custom.example}
              </p>
            </>
          )}

          <h2 className="mt-8 text-2xl font-black">
            Why use ToolNest?
          </h2>

          <p className="mt-4 leading-8 text-gray-600 dark:text-gray-300">
            ToolNest provides free online tools designed to be
            simple, fast, and easy to use. Core tools can be used
            directly in your browser without creating an account.
          </p>

          <h2 className="mt-8 text-2xl font-black">
            Frequently asked questions
          </h2>

          {custom ? (
            custom.faqs.map((faq) => (
              <div key={faq.question}>
                <h3 className="mt-5 font-bold">
                  {faq.question}
                </h3>

                <p className="mt-2 text-gray-600 dark:text-gray-300">
                  {faq.answer}
                </p>
              </div>
            ))
          ) : (
            <>
              <h3 className="mt-5 font-bold">
                Is ToolNest free?
              </h3>

              <p className="mt-2 text-gray-600 dark:text-gray-300">
                Yes. The core tools on ToolNest are free to use.
              </p>

              <h3 className="mt-5 font-bold">
                Do I need an account?
              </h3>

              <p className="mt-2 text-gray-600 dark:text-gray-300">
                No account is required for the core online tools.
              </p>
            </>
          )}
        </div>

        {/* Related Tools */}
        <aside>
          <h2 className="mb-4 text-xl font-black">
            Related tools
          </h2>

          <div className="space-y-4">
            {relatedTools.map((relatedTool) => (
              <ToolCard
                key={relatedTool.slug}
                tool={relatedTool}
              />
            ))}
          </div>
        </aside>
      </article>
    </main>
  );
}
