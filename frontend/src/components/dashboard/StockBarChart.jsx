import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-md">
      <p className="font-semibold text-gray-800">{label}</p>
      <p className="text-blue-600">
        Qty: <span className="font-bold">{payload[0].value.toLocaleString()}</span>{' '}
        {payload[0].payload.unit}
      </p>
    </div>
  );
};

export default function StockBarChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <span className="text-4xl">◑</span>
        <p className="mt-3 text-sm">No stock data available.</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: '#6b7280' }}
          angle={-35}
          textAnchor="end"
          interval={0}
        />
        <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="quantity" radius={[4, 4, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
