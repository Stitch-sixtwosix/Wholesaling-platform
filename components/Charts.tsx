"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const BRAND = "#1c5cf5";

export function PipelineFunnel({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eef2f7" />
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: "#64748b" }} />
        <YAxis
          type="category"
          dataKey="name"
          width={100}
          tick={{ fontSize: 12, fill: "#64748b" }}
        />
        <Tooltip cursor={{ fill: "#f1f5f9" }} />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} fill={BRAND} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function RevenueChart({ data }: { data: { name: string; revenue: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ left: 10, right: 10 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} />
        <YAxis
          tick={{ fontSize: 12, fill: "#64748b" }}
          tickFormatter={(v) => (v >= 1000 ? `$${v / 1000}k` : `$${v}`)}
        />
        <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} cursor={{ fill: "#f1f5f9" }} />
        <Bar dataKey="revenue" radius={[4, 4, 0, 0]} fill="#10b981" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ChannelChart({ data }: { data: { name: string; value: number }[] }) {
  const colors = ["#1c5cf5", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4"];
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ left: 10, right: 10 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} />
        <YAxis tick={{ fontSize: 12, fill: "#64748b" }} allowDecimals={false} />
        <Tooltip cursor={{ fill: "#f1f5f9" }} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={colors[i % colors.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
