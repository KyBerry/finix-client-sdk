import { render, screen } from "@testing-library/react";

import { PropsTable } from "@/components/mdx/props-table";

describe("PropsTable", () => {
  it("renders one row per prop with name, type, default, and description", () => {
    render(
      <PropsTable
        rows={[
          { name: "environment", type: '"sandbox" | "prod"', description: "Finix environment." },
          { name: "submissionTimeoutMs", type: "number", default: "20000", description: "Submit timeout." },
        ]}
      />,
    );
    expect(screen.getAllByRole("row")).toHaveLength(3);
    expect(screen.getByText("environment")).toBeInTheDocument();
    expect(screen.getByText('"sandbox" | "prod"')).toBeInTheDocument();
    expect(screen.getByText("20000")).toBeInTheDocument();
    expect(screen.getByText("Submit timeout.")).toBeInTheDocument();
  });

  it('renders "none" when there is no default', () => {
    render(<PropsTable rows={[{ name: "x", type: "string", description: "d" }]} />);
    expect(screen.getByText("none")).toBeInTheDocument();
  });
});
