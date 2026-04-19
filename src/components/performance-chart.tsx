"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type PerformanceChartData = {
  name: string;
  score: number;
};

export function PerformanceChart({ data }: { data: PerformanceChartData[] }) {
  return (
    <div className="h-80 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-slate-900">Показатели по отделам</h3>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="score" fill="#3b82f6" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
