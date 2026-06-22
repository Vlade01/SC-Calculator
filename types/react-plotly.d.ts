declare module "react-plotly.js" {
  import type { ComponentType, CSSProperties } from "react";
  import type * as Plotly from "plotly.js";

  export interface PlotParams {
    data?: Array<Plotly.Data>;
    layout?: Partial<Plotly.Layout>;
    config?: Partial<Plotly.Config>;
    frames?: any[];
    debug?: boolean;
    useResizeHandler?: boolean;
    revision?: number;
    style?: CSSProperties;
    className?: string;
  }

  const Plot: ComponentType<PlotParams>;
  export default Plot;
}
