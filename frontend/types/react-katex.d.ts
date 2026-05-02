declare module "react-katex" {
  import * as React from "react";
  export interface KaTeXProps {
    math?: string;
    children?: string | React.ReactNode;
    block?: boolean;
    errorColor?: string;
    renderError?: (error: Error) => React.ReactNode;
    settings?: Record<string, unknown>;
    as?: keyof React.JSX.IntrinsicElements;
  }
  export const InlineMath: React.FC<KaTeXProps>;
  export const BlockMath: React.FC<KaTeXProps>;
}
