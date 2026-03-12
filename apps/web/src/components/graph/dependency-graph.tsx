"use client";

import { useCallback, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "dagre";
import type { DependencyNode, DependencyEdge } from "@archlens/shared";

interface Props {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
}

function getLayoutedElements(nodes: Node[], edges: Edge[]) {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "TB", ranksep: 80, nodesep: 40 });

  nodes.forEach((node) => g.setNode(node.id, { width: 200, height: 60 }));
  edges.forEach((edge) => g.setEdge(edge.source, edge.target));

  dagre.layout(g);

  return {
    nodes: nodes.map((node) => {
      const pos = g.node(node.id);
      return { ...node, position: { x: pos.x - 100, y: pos.y - 30 } };
    }),
    edges,
  };
}

export function DependencyGraphView({ nodes: rawNodes, edges: rawEdges }: Props) {
  const { nodes: layoutNodes, edges: layoutEdges } = useMemo(() => {
    const flowNodes: Node[] = rawNodes.map((n) => ({
      id: n.id,
      data: {
        label: (
          <div className="text-center">
            <div className="font-medium text-sm">{n.label}</div>
            <div className="text-xs text-gray-500">{n.language} - {n.lineCount} lines</div>
          </div>
        ),
      },
      position: { x: 0, y: 0 },
      style: {
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        padding: "8px",
        width: 200,
      },
    }));

    const flowEdges: Edge[] = rawEdges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.dependencyType,
      style: { stroke: "#94a3b8" },
      labelStyle: { fontSize: 10, fill: "#94a3b8" },
    }));

    return getLayoutedElements(flowNodes, flowEdges);
  }, [rawNodes, rawEdges]);

  const [nodes, , onNodesChange] = useNodesState(layoutNodes);
  const [edges, , onEdgesChange] = useEdgesState(layoutEdges);

  return (
    <div className="h-[600px] w-full rounded-lg border border-gray-200">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        attributionPosition="bottom-left"
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
