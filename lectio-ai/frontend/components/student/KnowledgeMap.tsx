"use client";
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

interface Topic {
  id: string;
  name: string;
  subject: string;
  mastery: number;     // 0-100
  x?: number;
  y?: number;
  children?: string[];
}

export function KnowledgeMap({ topics }: {
  topics: Topic[];
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selected, setSelected] = useState<Topic | null>(null);

  useEffect(() => {
    if (!svgRef.current || !topics.length) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    // Fog of war background
    const defs = svg.append("defs");
    const fog = defs.append("radialGradient").attr("id", "fog");
    fog.append("stop").attr("offset", "0%").attr("stop-color", "#1E1E28").attr("stop-opacity", 0);
    fog.append("stop").attr("offset", "100%").attr("stop-color", "#0A0A0F").attr("stop-opacity", 0.8);

    // Force simulation
    const simulation = d3.forceSimulation(topics as any)
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(50));

    // Links
    const linkData: any[] = [];
    topics.forEach(t => {
      (t.children || []).forEach(childId => {
        const child = topics.find(c => c.id === childId);
        if (child) linkData.push({ source: t, target: child });
      });
    });

    const link = svg.append("g").selectAll("line")
      .data(linkData).enter().append("line")
      .attr("stroke", "#2A2A35").attr("stroke-width", 1.5);

    // Nodes
    const node = svg.append("g").selectAll("g")
      .data(topics).enter().append("g")
      .style("cursor", "pointer")
      .on("click", (e: Event, d: unknown) => setSelected(d as Topic));

    // Shahar bazasi
    node.append("circle")
      .attr("r", (d: any) => 20 + d.mastery * 0.25)
      .attr("fill", (d: any) => {
        const m = d.mastery;
        if (m >= 80) return "#0D9373";
        if (m >= 50) return "#F5A623";
        if (m >= 20) return "#1B4FD8";
        return "#2A2A35";
      })
      .attr("opacity", (d: any) => 0.3 + d.mastery * 0.007)
      .attr("stroke", (d: any) => {
        const m = d.mastery;
        if (m >= 80) return "#0D9373";
        if (m >= 50) return "#F5A623";
        return "#1B4FD8";
      })
      .attr("stroke-width", 2);

    // Fog overlay (bilmagan joylar)
    node.append("circle")
      .attr("r", (d: any) => 22 + d.mastery * 0.25)
      .attr("fill", "url(#fog)")
      .attr("opacity", (d: any) => Math.max(0, 1 - d.mastery / 60));

    // Label
    node.append("text")
      .text((d: any) => d.name)
      .attr("text-anchor", "middle")
      .attr("dy", "4px")
      .attr("font-size", "10px")
      .attr("fill", "#F0EDE6")
      .attr("font-family", "DM Sans, sans-serif");

    // Mastery foiz
    node.append("text")
      .text((d: any) => `${d.mastery}%`)
      .attr("text-anchor", "middle")
      .attr("dy", "18px")
      .attr("font-size", "9px")
      .attr("fill", "#8B8578");

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);
      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => { simulation.stop(); };
  }, [topics]);

  return (
    <div style={{ position: "relative", width: "100%", height: 500 }}>
      <svg ref={svgRef} width="100%" height="100%"
        style={{ background: "#0A0A0F", borderRadius: 16 }} />
      
      {selected && (
        <div style={{
          position: "absolute", top: 16, right: 16,
          background: "#18181F", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 12, padding: 16, maxWidth: 200
        }}>
          <h4 style={{ color: "#F0EDE6", margin: 0 }}>{selected.name}</h4>
          <div style={{ marginTop: 8, background: "#2A2A35", borderRadius: 4, height: 6 }}>
            <div style={{
              width: `${selected.mastery}%`, height: "100%",
              background: selected.mastery >= 80 ? "#0D9373" : "#F5A623",
              borderRadius: 4
            }} />
          </div>
          <p style={{ color: "#8B8578", fontSize: 12, margin: "8px 0 0" }}>
            {selected.mastery}% bilim darajasi
          </p>
          <button style={{
            marginTop: 8, width: "100%", padding: "8px",
            background: "#1B4FD8", color: "#fff",
            border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12
          }}>
            O&apos;rganishni boshlash →
          </button>
        </div>
      )}
    </div>
  );
}
