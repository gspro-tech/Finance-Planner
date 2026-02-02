
import React from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import { Transaction, BudgetCategory } from '../types';

interface ChartsProps {
  transactions: Transaction[];
  timeframe?: number; // in months
}

const COLORS = {
  [BudgetCategory.NEED]: '#818cf8', // Indigo 400
  [BudgetCategory.WANT]: '#22d3ee', // Cyan 400
  [BudgetCategory.SAVINGS]: '#fb7185', // Rose 400
};

const SUB_CAT_COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6'];

export const AllocationPie: React.FC<ChartsProps> = ({ transactions }) => {
  const data = [
    { name: BudgetCategory.NEED, value: transactions.filter(t => t.category === BudgetCategory.NEED).reduce((acc, t) => acc + t.amount, 0) },
    { name: BudgetCategory.WANT, value: transactions.filter(t => t.category === BudgetCategory.WANT).reduce((acc, t) => acc + t.amount, 0) },
    { name: BudgetCategory.SAVINGS, value: transactions.filter(t => t.category === BudgetCategory.SAVINGS).reduce((acc, t) => acc + t.amount, 0) },
  ].filter(d => d.value > 0);

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            innerRadius={60}
            outerRadius={85}
            paddingAngle={5}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.name as BudgetCategory]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
            itemStyle={{ color: '#fff' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export const SavingsTrendLineChart: React.FC<ChartsProps> = ({ transactions, timeframe = 6 }) => {
  // Explicitly generate the last 'timeframe' months to ensure chart respects selection
  const now = new Date();
  const months: string[] = [];
  for (let i = timeframe - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d.toISOString().substring(0, 7));
  }
  
  let cumulative = 0;
  // Calculate starting cumulative value for months prior to the visible range
  const priorSavings = transactions
    .filter(t => {
      const tMonth = t.date.substring(0, 7);
      return t.category === BudgetCategory.SAVINGS && tMonth < months[0];
    })
    .reduce((acc, t) => acc + t.amount, 0);

  cumulative = priorSavings;

  const data = months.map(month => {
    const monthlySavings = transactions
      .filter(t => t.date.startsWith(month) && t.category === BudgetCategory.SAVINGS)
      .reduce((acc, t) => acc + t.amount, 0);
    
    cumulative += monthlySavings;
    
    const [year, monthNum] = month.split('-');
    return {
      monthKey: month,
      monthLabel: new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleString('default', { month: 'short' }),
      amount: monthlySavings,
      cumulative: cumulative
    };
  });

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#fb7185" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#fb7185" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis 
            dataKey="monthLabel" 
            stroke="#94a3b8" 
            fontSize={11} 
            tickLine={false} 
            axisLine={false} 
            dy={10}
          />
          <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#111827', border: 'none', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
            itemStyle={{ color: '#fb7185' }}
          />
          <Area 
            type="monotone" 
            dataKey="cumulative" 
            name="Cumulative Wealth"
            stroke="#fb7185" 
            fillOpacity={1} 
            fill="url(#colorSavings)" 
            strokeWidth={3}
            animationDuration={1500}
          />
          <Line 
            type="monotone" 
            dataKey="amount" 
            name="Monthly Savings"
            stroke="#fb7185" 
            strokeDasharray="5 5" 
            strokeWidth={1} 
            dot={{ r: 4, fill: '#fb7185', strokeWidth: 0 }}
            activeDot={{ r: 6, fill: '#fff', stroke: '#fb7185', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export const SubCategoryBar: React.FC<ChartsProps> = ({ transactions }) => {
  const subCats = Array.from(new Set(transactions.map(t => t.subCategory)));
  const data = subCats.map(sc => ({
    name: sc,
    amount: transactions.filter(t => t.subCategory === sc).reduce((acc, t) => acc + t.amount, 0)
  })).sort((a, b) => b.amount - a.amount).slice(0, 10);

  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 30, right: 30 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
          <XAxis type="number" hide />
          <YAxis 
            dataKey="name" 
            type="category" 
            stroke="#94a3b8" 
            fontSize={11} 
            width={120} 
            tickLine={false} 
            axisLine={false} 
          />
          <Tooltip 
            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
            contentStyle={{ backgroundColor: '#111827', border: 'none', borderRadius: '12px' }}
          />
          <Bar dataKey="amount" radius={[0, 4, 4, 0]} barSize={20}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={SUB_CAT_COLORS[index % SUB_CAT_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
