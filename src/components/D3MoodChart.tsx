import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface MoodTrend {
  date: string;
  avgScore: number;
}

interface D3MoodChartProps {
  data: MoodTrend[];
}

export default function D3MoodChart({ data }: D3MoodChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !data || data.length === 0) return;

    // Clear existing SVG
    const container = d3.select(containerRef.current);
    container.selectAll("*").remove();

    const width = containerRef.current.clientWidth || 600;
    const height = containerRef.current.clientHeight || 200;
    const margin = { top: 20, right: 30, bottom: 30, left: 40 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = container.append("svg")
      .attr("width", width)
      .attr("height", height)
      .style("overflow", "visible");

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Define scales
    const xScale = d3.scalePoint()
      .domain(data.map(d => d.date))
      .range([0, innerWidth])
      .padding(0.5);

    const yScale = d3.scaleLinear()
      .domain([1, 5])
      .range([innerHeight, 0]);

    // Draw grid lines
    g.append("g")
      .attr("class", "grid")
      .call(d3.axisLeft(yScale)
        .tickSize(-innerWidth)
        .tickFormat(() => "")
      )
      .selectAll("line")
      .attr("stroke", "#f1f5f9")
      .attr("stroke-dasharray", "3 3");

    // Draw axes
    const xAxis = d3.axisBottom(xScale).tickSizeOuter(0);
    const yAxis = d3.axisLeft(yScale).ticks(5);

    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(xAxis)
      .selectAll("text")
      .style("font-family", "Inter, sans-serif")
      .style("font-size", "10px")
      .attr("fill", "#64748b");

    g.append("g")
      .call(yAxis)
      .selectAll("text")
      .style("font-family", "Inter, sans-serif")
      .style("font-size", "10px")
      .attr("fill", "#64748b");

    // Remove domain lines for cleaner look
    g.selectAll(".domain").attr("stroke", "#e2e8f0");

    // Create gradient
    const gradient = svg.append("defs")
      .append("linearGradient")
      .attr("id", "line-gradient")
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", 0).attr("y1", yScale(1))
      .attr("x2", 0).attr("y2", yScale(5));
      
    gradient.append("stop").attr("offset", "0%").attr("stop-color", "#f43f5e"); // Red (1)
    gradient.append("stop").attr("offset", "50%").attr("stop-color", "#f59e0b"); // Yellow (3)
    gradient.append("stop").attr("offset", "100%").attr("stop-color", "#10b981"); // Green (5)

    // Draw line
    const line = d3.line<MoodTrend>()
      .x(d => xScale(d.date) as number)
      .y(d => yScale(d.avgScore))
      .curve(d3.curveMonotoneX);

    const path = g.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "url(#line-gradient)")
      .attr("stroke-width", 4)
      .attr("d", line);

    // Animate line
    const totalLength = (path.node() as SVGPathElement).getTotalLength();
    path
      .attr("stroke-dasharray", totalLength + " " + totalLength)
      .attr("stroke-dashoffset", totalLength)
      .transition()
      .duration(1500)
      .ease(d3.easeCubicOut)
      .attr("stroke-dashoffset", 0);

    // Add tooltip
    const tooltip = d3.select("body").append("div")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background-color", "white")
      .style("border", "1px solid #e2e8f0")
      .style("padding", "8px 12px")
      .style("border-radius", "8px")
      .style("box-shadow", "0 4px 6px -1px rgba(0, 0, 0, 0.1)")
      .style("pointer-events", "none")
      .style("font-family", "Inter, sans-serif")
      .style("font-size", "12px")
      .style("z-index", "1000");

    // Draw points
    g.selectAll(".dot")
      .data(data)
      .join("circle")
      .attr("class", "dot")
      .attr("cx", d => xScale(d.date) as number)
      .attr("cy", d => yScale(d.avgScore))
      .attr("r", 0) // start small for animation
      .attr("fill", "white")
      .attr("stroke", d => {
        if (d.avgScore <= 2) return "#f43f5e";
        if (d.avgScore <= 3.5) return "#f59e0b";
        return "#10b981";
      })
      .attr("stroke-width", 3)
      .on("mouseover", function(event, d) {
        d3.select(this).transition().duration(200).attr("r", 8);
        tooltip.style("visibility", "visible")
          .html(`<strong>${d.date}</strong><br/>Điểm: ${d.avgScore.toFixed(1)}/5.0`);
      })
      .on("mousemove", function(event) {
        tooltip
          .style("top", (event.pageY - 40) + "px")
          .style("left", (event.pageX + 10) + "px");
      })
      .on("mouseout", function() {
        d3.select(this).transition().duration(200).attr("r", 5);
        tooltip.style("visibility", "hidden");
      })
      .transition()
      .delay((d, i) => i * 150)
      .duration(800)
      .ease(d3.easeElastic)
      .attr("r", 5);

    // Cleanup
    return () => {
      tooltip.remove();
    };
  }, [data]);

  return (
    <div className="w-full h-full relative">
      <div ref={containerRef} className="w-full h-full min-h-[200px]" />
    </div>
  );
}
