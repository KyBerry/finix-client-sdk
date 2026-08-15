import type { ComponentProps } from "react";

function withAnchor(Tag: "h2" | "h3") {
  return function Heading({ id, children, ...props }: ComponentProps<"h2">) {
    return (
      <Tag id={id} {...props}>
        <a href={`#${id}`} data-plain className="text-inherit no-underline hover:underline">
          {children}
        </a>
      </Tag>
    );
  };
}

export const H2 = withAnchor("h2");
export const H3 = withAnchor("h3");
