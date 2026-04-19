"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function ValidatorChart({ data }: { data: { hour: string; count: number }[] }) {
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="v-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="hour" fontSize={11} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
          <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} width={28} />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Area type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={2} fill="url(#v-grad)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
