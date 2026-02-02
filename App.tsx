
import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, Wallet, ShoppingBag, PiggyBank, Plus, 
  Sparkles, FileText, ChevronRight, X, AlertCircle, Info, RefreshCw,
  Download, Filter, Calendar, LayoutDashboard, Settings, Clock, 
  User, LogOut, ShieldCheck, History, Search, CreditCard, ChevronDown, FileJson, FileType
} from 'lucide-react';
import { Transaction, BudgetCategory, AnalysisInsights, AppView, UserProfile } from './types';
import { INITIAL_TRANSACTIONS, BUDGET_RULES } from './constants';
import { StatCard } from './components/StatCard';
import { AllocationPie, SavingsTrendLineChart, SubCategoryBar } from './components/Charts';
import { analyzeTransactions, parseStatement } from './services/geminiService';
import { jsPDF } from 'jspdf';

const App: React.FC = () => {
  // Authentication & Profile State
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    title: 'Mr.',
    name: 'Alexander Sterling',
    email: 'alex.sterling@elite.com'
  });

  // App Navigation State
  const [activeView, setActiveView] = useState<AppView>('overview');

  // Core Data State
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [income, setIncome] = useState<number>(7500);
  const [insights, setInsights] = useState<AnalysisInsights | null>(null);
  
  // UI Loading/Modal States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);
  const [isDownloadOptionsOpen, setIsDownloadOptionsOpen] = useState(false);
  const [statementText, setStatementText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [savingsTimeframe, setSavingsTimeframe] = useState<number>(6);

  // New Transaction Form State
  const [newTx, setNewTx] = useState<Partial<Transaction>>({
    date: new Date().toISOString().split('T')[0],
    category: BudgetCategory.WANT,
    subCategory: 'Personal'
  });

  // Statistics calculation for the CURRENT month
  const stats = useMemo(() => {
    const currentMonth = new Date().toISOString().substring(0, 7);
    const currentTxs = transactions.filter(t => t.date.startsWith(currentMonth));
    
    // If no transactions for current month (e.g. at start of month), use all transactions for global stats
    const targetTxs = currentTxs.length > 0 ? currentTxs : transactions;

    const totals = targetTxs.reduce((acc, t) => {
      if (t.category === BudgetCategory.NEED) acc.needs += t.amount;
      if (t.category === BudgetCategory.WANT) acc.wants += t.amount;
      if (t.category === BudgetCategory.SAVINGS) acc.savings += t.amount;
      return acc;
    }, { needs: 0, wants: 0, savings: 0 });

    return {
      ...totals,
      needsPerc: (totals.needs / income) * 100,
      wantsPerc: (totals.wants / income) * 100,
      savingsPerc: (totals.savings / income) * 100,
      totalSpent: totals.needs + totals.wants
    };
  }, [transactions, income]);

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const result = await analyzeTransactions(transactions, income);
      setInsights(result);
    } catch (err) {
      console.error("Analysis failed", err);
      alert("AI Intelligence Service is temporarily recalibrating. Please verify connection and try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleManualEntrySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTx.description && newTx.amount) {
      const transaction: Transaction = {
        id: Math.random().toString(36).substr(2, 9),
        date: newTx.date || new Date().toISOString().split('T')[0],
        description: newTx.description,
        amount: Number(newTx.amount),
        category: newTx.category as BudgetCategory,
        subCategory: newTx.subCategory || 'General'
      };
      setTransactions([transaction, ...transactions]);
      setIsManualEntryOpen(false);
      setNewTx({
        date: new Date().toISOString().split('T')[0],
        category: BudgetCategory.WANT,
        subCategory: 'Personal'
      });
    }
  };

  const handleDownloadPDF = () => {
    if (!insights) return;
    const doc = new jsPDF();
    const primaryColor = [79, 70, 229]; // Indigo-600

    // Header
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('FINVUE ELITE AUDIT', 20, 25);
    doc.setFontSize(10);
    doc.text('STRATEGIC FINANCIAL PERFORMANCE DOCUMENT', 20, 32);

    // Client Info
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(12);
    doc.text(`Official Account: ${userProfile.title} ${userProfile.name}`, 20, 55);
    doc.text(`Date of Audit: ${new Date().toLocaleDateString()}`, 20, 62);
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 68, 190, 68);

    // Budget Summary
    doc.setFontSize(14);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('1. BUDGET ALLOCATION SUMMARY', 20, 80);
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    doc.text(`- Monthly Income: $${income.toLocaleString()}`, 25, 90);
    doc.text(`- Essential Needs: $${stats.needs.toLocaleString()} (${stats.needsPerc.toFixed(1)}%)`, 25, 97);
    doc.text(`- Lifestyle Wants: $${stats.wants.toLocaleString()} (${stats.wantsPerc.toFixed(1)}%)`, 25, 104);
    doc.text(`- Savings Accumulation: $${stats.savings.toLocaleString()} (${stats.savingsPerc.toFixed(1)}%)`, 25, 111);

    // AI Diagnostics
    doc.setFontSize(14);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('2. AI DIAGNOSTIC FINDINGS', 20, 125);
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    const splitSummary = doc.splitTextToSize(insights.summary, 165);
    doc.text(splitSummary, 25, 135);

    // Forecast
    const forecastY = 135 + (splitSummary.length * 5) + 10;
    doc.setFontSize(14);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('3. SURVIVABILITY FORECAST', 20, forecastY);
    doc.setFontSize(11);
    doc.setTextColor(220, 38, 38); // Rose/Red
    doc.text(insights.forecast, 25, forecastY + 10);

    // Recommendations
    const recY = forecastY + 30;
    doc.setFontSize(14);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('4. STRATEGIC RECOMMENDATIONS', 20, recY);
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    insights.recommendations.forEach((rec, i) => {
      doc.text(`${i + 1}. ${rec}`, 25, recY + 10 + (i * 7));
    });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Certified by FinVue Elite Intelligence Engine • Non-Disclosure Agreement Active', 105, 285, { align: 'center' });

    doc.save(`${userProfile.name.replace(/\s/g, '_')}_Report.pdf`);
    setIsDownloadOptionsOpen(false);
  };

  const handleDownloadDOCX = () => {
    if (!insights) return;
    
    // Create an HTML string that Word can parse
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset='utf-8'>
          <title>FinVue Elite Report</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1f2937; margin: 40px; }
            h1 { color: #4f46e5; text-align: center; border-bottom: 2px solid #4f46e5; padding-bottom: 15px; font-size: 24pt; }
            h2 { color: #4f46e5; margin-top: 30px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; font-size: 16pt; }
            .section { margin-bottom: 25px; }
            .metric { font-weight: bold; color: #374151; }
            .forecast { color: #e11d48; font-weight: bold; font-size: 14pt; padding: 10px; background-color: #fff1f2; border-radius: 5px; }
            .recommendation { margin-left: 20px; margin-top: 8px; list-style-type: decimal; }
            .footer { font-size: 9pt; color: #9ca3af; margin-top: 60px; text-align: center; border-top: 1px solid #f3f4f6; padding-top: 20px; }
          </style>
        </head>
        <body>
          <h1>FINVUE ELITE AUDIT REPORT</h1>
          <div class="section">
            <p><strong>Official Account Holder:</strong> ${userProfile.title} ${userProfile.name}</p>
            <p><strong>Date of Audit Session:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>Verification ID:</strong> ELITE-${Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
          </div>
          
          <h2>1. STRATEGIC ALLOCATION SUMMARY (50/30/20)</h2>
          <div class="section">
            <p><span class="metric">Net Monthly Liquid Capital:</span> $${income.toLocaleString()}</p>
            <p><span class="metric">Essential Needs (50% Target):</span> $${stats.needs.toLocaleString()} (${stats.needsPerc.toFixed(1)}%)</p>
            <p><span class="metric">Lifestyle Wants (30% Target):</span> $${stats.wants.toLocaleString()} (${stats.wantsPerc.toFixed(1)}%)</p>
            <p><span class="metric">Wealth Accumulation (20% Target):</span> $${stats.savings.toLocaleString()} (${stats.savingsPerc.toFixed(1)}%)</p>
          </div>

          <h2>2. AI DIAGNOSTIC FINDINGS</h2>
          <div class="section">
            <p>${insights.summary}</p>
          </div>

          <h2>3. LIQUIDITY SURVIVABILITY FORECAST</h2>
          <div class="section">
            <p class="forecast">${insights.forecast}</p>
          </div>

          <h2>4. OPTIMIZATION DIRECTIVES</h2>
          <div class="section">
            ${insights.recommendations.map((rec, i) => `<p class="recommendation"><strong>Directive ${i + 1}:</strong> ${rec}</p>`).join('')}
          </div>

          <div class="footer">
            Certified by FinVue Elite Intelligence Engine • Professional Financial Statement
          </div>
        </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', htmlContent], {
      type: 'application/msword'
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${userProfile.name.replace(/\s/g, '_')}_Report.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setIsDownloadOptionsOpen(false);
  };

  const handleDownloadTXT = () => {
    if (!insights) return;
    const reportContent = `
FINVUE ELITE - STRATEGIC FINANCIAL REPORT
=========================================
Formal Account of: ${userProfile.title} ${userProfile.name}
Date of Audit: ${new Date().toLocaleDateString()}

1. BUDGET SUMMARY (50/30/20 RULE)
-----------------------------------------
- Monthly Income: $${income.toLocaleString()}
- Needs Allocation: $${stats.needs.toLocaleString()} (${stats.needsPerc.toFixed(1)}%)
- Wants Allocation: $${stats.wants.toLocaleString()} (${stats.wantsPerc.toFixed(1)}%)
- Total Savings: $${stats.savings.toLocaleString()} (${stats.savingsPerc.toFixed(1)}%)

2. AI DIAGNOSTICS & FINDINGS
-----------------------------------------
${insights.summary}

3. SURVIVABILITY & FORECAST
-----------------------------------------
${insights.forecast}

4. STRATEGIC REDUCTION MEASURES
-----------------------------------------
${insights.recommendations.map((rec, i) => `${i + 1}. ${rec}`).join('\n')}

=========================================
Certified Digital Archive - FinVue Elite Intelligence
    `;

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Audit_Report_${userProfile.name.replace(/\s/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setIsDownloadOptionsOpen(false);
  };

  const handleParseStatement = async () => {
    if (!statementText.trim()) return;
    setIsParsing(true);
    try {
      const parsed = await parseStatement(statementText);
      const newTransactions: Transaction[] = parsed.map((p) => ({
        id: Math.random().toString(36).substr(2, 9),
        date: p.date || new Date().toISOString().split('T')[0],
        description: p.description || 'Imported Entry',
        amount: p.amount || 0,
        category: (p.category as BudgetCategory) || BudgetCategory.WANT,
        subCategory: p.subCategory || 'General'
      }));
      setTransactions(prev => [...newTransactions, ...prev]);
      setIsStatementModalOpen(false);
      setStatementText('');
    } catch (err) {
      alert("AI was unable to parse this format. Try a clearer list of transactions.");
    } finally {
      setIsParsing(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="glass-effect premium-gradient-border p-12 rounded-[3.5rem] w-full max-w-md text-center shadow-[0_0_150px_rgba(79,70,229,0.1)]">
          <div className="w-24 h-24 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-indigo-500/40 ring-2 ring-white/10 animate-pulse">
            <TrendingUp className="text-white w-12 h-12" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter mb-2">FINVUE <span className="text-indigo-500">ELITE</span></h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.4em] mb-12">Private Management Access</p>
          
          <div className="space-y-5">
            <div className="relative">
              <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input type="text" placeholder="Access ID" className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-sm font-bold text-white focus:border-indigo-500 focus:outline-none transition-all placeholder:text-slate-700" />
            </div>
            <div className="relative">
              <ShieldCheck className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input type="password" placeholder="Passcode" className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-sm font-bold text-white focus:border-indigo-500 focus:outline-none transition-all placeholder:text-slate-700" />
            </div>
            <button 
              onClick={() => setIsLoggedIn(true)}
              className="w-full glow-button-ai text-white font-black py-5 rounded-2xl uppercase tracking-[0.2em] transition-all shadow-xl mt-8 active:scale-95 text-xs shadow-indigo-600/30"
            >
              Sign In to Suite
            </button>
          </div>
          <p className="mt-8 text-[9px] text-slate-700 font-bold uppercase tracking-[0.2em]">Authorized Personnel Only</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-80 glass-effect border-r border-white/5 md:h-screen sticky top-0 z-40 p-10 flex flex-col gap-10">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-indigo-500/30 ring-1 ring-white/20">
            <TrendingUp className="text-white w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter leading-none text-white">FINVUE</h1>
            <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-[0.3em] mt-1">ELITE SUITE</p>
          </div>
        </div>

        {/* Formal Profile Block */}
        <div className="bg-white/5 rounded-[2.5rem] p-8 border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <ShieldCheck size={40} className="text-indigo-400" />
          </div>
          <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mb-4">Official Holder</p>
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-inner">
              <User size={28} />
            </div>
            <div>
              <h4 className="font-black text-white text-base leading-tight">
                <span className="text-indigo-400 text-xs block mb-0.5 font-bold uppercase tracking-widest">{userProfile.title}</span>
                {userProfile.name}
              </h4>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-white/5 flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Global Status</span>
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-0.5">Verified Elite</span>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]"></div>
          </div>
        </div>

        <nav className="flex flex-col gap-2">
          <div className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] mb-4 px-6">Terminal Node</div>
          <button onClick={() => setActiveView('overview')} className={`flex items-center gap-5 px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all border ${activeView === 'overview' ? 'bg-indigo-600/15 text-indigo-300 border-indigo-500/30 shadow-[0_0_20px_rgba(79,70,229,0.1)]' : 'text-slate-500 hover:bg-white/5 hover:text-slate-300 border-transparent'}`}>
            <LayoutDashboard size={20} strokeWidth={2.5} /> Overview
          </button>
          <button onClick={() => setActiveView('historical')} className={`flex items-center gap-5 px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all border ${activeView === 'historical' ? 'bg-indigo-600/15 text-indigo-300 border-indigo-500/30' : 'text-slate-500 hover:bg-white/5 hover:text-slate-300 border-transparent'}`}>
            <History size={20} strokeWidth={2.5} /> Historical
          </button>
          <button onClick={() => setActiveView('transactions')} className={`flex items-center gap-5 px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all border ${activeView === 'transactions' ? 'bg-indigo-600/15 text-indigo-300 border-indigo-500/30' : 'text-slate-500 hover:bg-white/5 hover:text-slate-300 border-transparent'}`}>
            <Search size={20} strokeWidth={2.5} /> Master Ledger
          </button>
          <button onClick={() => setActiveView('audit')} className={`flex items-center gap-5 px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all border ${activeView === 'audit' ? 'bg-indigo-600/15 text-indigo-300 border-indigo-500/30' : 'text-slate-500 hover:bg-white/5 hover:text-slate-300 border-transparent'}`}>
            <ShieldCheck size={20} strokeWidth={2.5} /> Audit Logs
          </button>
          <button onClick={() => setActiveView('settings')} className={`flex items-center gap-5 px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all border ${activeView === 'settings' ? 'bg-indigo-600/15 text-indigo-300 border-indigo-500/30' : 'text-slate-500 hover:bg-white/5 hover:text-slate-300 border-transparent'}`}>
            <Settings size={20} strokeWidth={2.5} /> Settings
          </button>
        </nav>

        <div className="mt-auto space-y-4">
          <div className="p-8 bg-indigo-500/5 rounded-[2.5rem] border border-indigo-500/10 relative overflow-hidden group shadow-2xl">
            <p className="text-[10px] text-indigo-300 font-black uppercase tracking-[0.3em] mb-2">Liquid Balance</p>
            <div className="flex items-center justify-between gap-6">
              <span className="text-3xl font-black text-white tracking-tighter">${income.toLocaleString()}</span>
              <button onClick={() => {
                const val = prompt("Adjust Liquid Capital Pool:", income.toString());
                if (val) setIncome(parseFloat(val));
              }} className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-xl ring-1 ring-indigo-500/30 hover:scale-105">
                <Plus size={20} />
              </button>
            </div>
          </div>
          
          <button 
            onClick={() => setIsLoggedIn(false)} 
            className="w-full flex items-center justify-center gap-4 py-5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-3xl font-black text-[11px] uppercase tracking-[0.3em] border border-rose-500/20 transition-all active:scale-95 shadow-lg shadow-rose-950/10 group"
          >
            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-10 md:p-16 max-w-[1600px] mx-auto w-full">
        {activeView === 'overview' ? (
          <>
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16">
              <div>
                <h2 className="text-4xl font-black tracking-tighter text-white mb-3 uppercase">Capital Management</h2>
                <div className="flex items-center gap-6 text-slate-500 text-[11px] font-black uppercase tracking-[0.25em]">
                  <span className="flex items-center gap-3"><Clock size={16} className="text-indigo-500" /> Latency Optimized</span>
                  <span className="w-2 h-2 rounded-full bg-slate-800"></span>
                  <span className="flex items-center gap-3 text-indigo-400"><ShieldCheck size={16} /> Encrypted Session</span>
                </div>
              </div>
              <div className="flex items-center gap-5 w-full md:w-auto">
                <button 
                  onClick={() => setIsStatementModalOpen(true)} 
                  className="flex-1 md:flex-none flex items-center justify-center gap-4 bg-slate-900/50 hover:bg-slate-800 text-slate-100 px-8 py-5 rounded-[1.8rem] border border-indigo-500/30 hover:border-indigo-500 transition-all text-[11px] font-black uppercase tracking-[0.2em] shadow-xl hover:shadow-indigo-500/20 active:scale-95 group overflow-hidden relative"
                >
                  <div className="absolute inset-0 bg-indigo-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                  <FileText size={20} className="text-indigo-400 group-hover:scale-110 transition-transform relative z-10" /> 
                  <span className="relative z-10">Upload Bank Statement</span>
                </button>
                <button 
                  onClick={handleRunAnalysis} 
                  disabled={isAnalyzing} 
                  className="flex-1 md:flex-none flex items-center justify-center gap-4 glow-button-ai text-white px-10 py-5 rounded-[1.8rem] shadow-[0_15px_35px_rgba(79,70,229,0.3)] transition-all text-[11px] font-black uppercase tracking-[0.2em] disabled:opacity-50 group border border-white/10 active:scale-95 relative overflow-hidden"
                >
                  {isAnalyzing ? <RefreshCw className="animate-spin" size={20} /> : <Sparkles size={20} className="group-hover:rotate-12 transition-transform" />}
                  <span>{isAnalyzing ? 'Calibrating...' : 'AI Assistance'}</span>
                </button>
              </div>
            </header>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-16">
              <StatCard label="Fixed Liability (50%)" value={stats.needs.toLocaleString()} percentage={stats.needsPerc} target={BUDGET_RULES.NEED} color="indigo" icon={<Wallet size={24} />} />
              <StatCard label="Lifestyle Burn (30%)" value={stats.wants.toLocaleString()} percentage={stats.wantsPerc} target={BUDGET_RULES.WANT} color="cyan" icon={<ShoppingBag size={24} />} />
              <StatCard label="Savings Allocation (20%)" value={stats.savings.toLocaleString()} percentage={stats.savingsPerc} target={BUDGET_RULES.SAVINGS} color="rose" icon={<PiggyBank size={24} />} />
              <div className="glass-effect premium-gradient-border p-10 rounded-[2.5rem] flex flex-col justify-center relative overflow-hidden group shadow-2xl">
                <span className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mb-3">Audited Balance</span>
                <h3 className="text-5xl font-black text-white tracking-tighter">${(income - (stats.needs + stats.wants + stats.savings)).toLocaleString()}</h3>
                <div className="mt-5 flex items-center gap-4">
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-4 py-1.5 rounded-xl font-black tracking-widest ring-1 ring-emerald-500/20 border border-emerald-500/10 uppercase">Residual</span>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-8 space-y-12">
                <section className="glass-effect premium-gradient-border p-12 rounded-[3.5rem] shadow-2xl">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
                    <div>
                      <h3 className="text-2xl font-black text-white tracking-tight uppercase">Savings Velocity</h3>
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-2">Historical Growth Index</p>
                    </div>
                    <div className="flex items-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/5">
                      {[3, 6, 12].map(m => (
                        <button 
                          key={m} 
                          onClick={() => setSavingsTimeframe(m)} 
                          className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${savingsTimeframe === m ? 'bg-rose-500 text-white shadow-xl shadow-rose-500/30' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                        >
                          {m}M Period
                        </button>
                      ))}
                    </div>
                  </div>
                  <SavingsTrendLineChart transactions={transactions} timeframe={savingsTimeframe} />
                </section>

                <section className="glass-effect premium-gradient-border p-12 rounded-[3.5rem] shadow-2xl">
                  <h3 className="text-2xl font-black text-white tracking-tight uppercase mb-12">Strategic Burn Breakdown</h3>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-16 items-center">
                    <div className="md:col-span-4 text-center">
                      <AllocationPie transactions={transactions} />
                    </div>
                    <div className="md:col-span-8">
                      <SubCategoryBar transactions={transactions} />
                    </div>
                  </div>
                </section>

                {insights && (
                  <section className="glass-effect premium-gradient-border p-14 rounded-[4rem] relative group bg-indigo-950/20 border-indigo-500/20 shadow-2xl overflow-visible">
                    <h3 className="text-3xl font-black mb-12 flex items-center gap-6 text-white tracking-tighter uppercase">
                      <Sparkles size={32} className="text-indigo-400" /> Strategy Diagnostic
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16 relative z-10">
                      <div className="space-y-10">
                        <div className="bg-black/40 p-10 rounded-[2.5rem] border border-white/5 shadow-2xl">
                          <h4 className="text-indigo-400 text-[11px] font-black uppercase tracking-[0.3em] mb-6 underline decoration-indigo-500/30 underline-offset-8">Executive Review</h4>
                          <p className="text-base text-slate-300 leading-relaxed font-semibold italic">"{insights.summary}"</p>
                        </div>
                        <div className="p-10 bg-rose-500/10 border border-rose-500/20 rounded-[3rem]">
                          <div className="flex items-center gap-4 text-rose-400 mb-5">
                            <AlertCircle size={28} strokeWidth={3} />
                            <h4 className="text-[11px] font-black uppercase tracking widest">Projection Index</h4>
                          </div>
                          <p className="text-3xl font-black text-white leading-tight tracking-tighter">{insights.forecast}</p>
                        </div>
                      </div>
                      <div className="space-y-10">
                        <div className="bg-black/40 p-10 rounded-[2.5rem] border border-white/5 shadow-2xl">
                          <h4 className="text-cyan-400 text-[11px] font-black uppercase tracking-[0.3em] mb-8 underline decoration-cyan-500/30 underline-offset-8">Directives</h4>
                          <ul className="space-y-8">
                            {insights.recommendations.map((rec, i) => (
                              <li key={i} className="flex gap-6 items-start">
                                <div className="w-12 h-12 rounded-[1.5rem] bg-cyan-500/20 flex items-center justify-center shrink-0 mt-1 border border-cyan-500/30 font-black text-cyan-400">{i + 1}</div>
                                <p className="text-base text-slate-300 font-bold">{rec}</p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="mt-16 pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-10">
                      <div className="flex items-center gap-5 text-slate-500">
                        <ShieldCheck size={32} className="text-indigo-500/60" />
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-1">Authenticated Audit</p>
                          <p className="text-xs font-bold font-mono text-slate-400">ID: ELITE-SEC-${Math.floor(Math.random()*1000000)}</p>
                        </div>
                      </div>
                      
                      <div className="relative group/dl">
                        <button 
                          onClick={() => setIsDownloadOptionsOpen(!isDownloadOptionsOpen)} 
                          className="w-full md:w-auto flex items-center justify-center gap-5 bg-white text-black px-14 py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] hover:bg-slate-200 hover:-translate-y-2 transition-all shadow-[0_20px_60px_rgba(255,255,255,0.1)] active:scale-95 group border border-white/20"
                        >
                          <Download size={22} className="group-hover:animate-bounce" /> Export Document <ChevronDown size={18} className={`transition-transform duration-300 ${isDownloadOptionsOpen ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {isDownloadOptionsOpen && (
                          <div className="absolute bottom-full mb-4 left-0 right-0 glass-effect p-4 rounded-3xl border border-white/10 z-[100] animate-in slide-in-from-bottom-4 duration-300 shadow-2xl min-w-[240px]">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking widest mb-3 text-center">Format Selection</p>
                            <div className="space-y-2">
                              <button onClick={handleDownloadPDF} className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-white/10 text-sm font-bold text-white transition-all group/item">
                                <div className="flex items-center gap-3"><FileText size={18} className="text-rose-400 group-hover/item:scale-110 transition-transform" /> Professional PDF</div>
                                <span className="text-[8px] font-black bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full uppercase">HQ</span>
                              </button>
                              <button onClick={handleDownloadDOCX} className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-white/10 text-sm font-bold text-white transition-all group/item">
                                <div className="flex items-center gap-3"><FileType size={18} className="text-indigo-400 group-hover/item:scale-110 transition-transform" /> MS Word (.doc)</div>
                              </button>
                              <button onClick={handleDownloadTXT} className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-white/10 text-sm font-bold text-white transition-all group/item">
                                <div className="flex items-center gap-3"><FileJson size={18} className="text-slate-400 group-hover/item:scale-110 transition-transform" /> Audit Log (.txt)</div>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </section>
                )}
              </div>

              <div className="lg:col-span-4 space-y-10">
                <div className="glass-effect premium-gradient-border rounded-[3.5rem] overflow-hidden flex flex-col h-[1150px] border-white/5 shadow-2xl">
                  <div className="p-10 border-b border-white/5 flex justify-between items-center bg-white/2">
                    <div>
                      <h3 className="font-black text-2xl text-white tracking-tight uppercase">Live Feed</h3>
                      <p className="text-[11px] text-indigo-400 uppercase font-black tracking-[0.3em] mt-2">{transactions.length} Verified Records</p>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto px-8 py-10 space-y-5 custom-scrollbar">
                    {transactions.slice(0, 50).map(t => (
                      <div key={t.id} className="p-7 hover:bg-white/5 rounded-[2.5rem] transition-all flex items-center justify-between group cursor-default border border-transparent hover:border-white/5">
                        <div className="flex items-center gap-6">
                          <div className={`w-16 h-16 rounded-[1.8rem] flex items-center justify-center shrink-0 ${t.category === BudgetCategory.NEED ? 'bg-indigo-500/10 text-indigo-400' : t.category === BudgetCategory.WANT ? 'bg-cyan-500/10 text-cyan-400' : 'bg-rose-500/10 text-rose-400'}`}>
                            {t.category === BudgetCategory.NEED ? <Wallet size={28} /> : t.category === BudgetCategory.WANT ? <ShoppingBag size={28} /> : <PiggyBank size={28} />}
                          </div>
                          <div className="min-w-0">
                            <p className="font-black text-base text-white truncate max-w-[200px] tracking-tight">{t.description}</p>
                            <p className="text-[10px] text-slate-600 font-black uppercase mt-1 tracking-widest">{t.date} • {t.subCategory}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-white text-2xl tracking-tighter">${t.amount.toLocaleString()}</p>
                          <button onClick={() => setTransactions(prev => prev.filter(item => item.id !== t.id))} className="text-[10px] text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity font-black uppercase tracking-widest mt-2 hover:underline">Purge</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-10 bg-white/2 border-t border-white/5">
                    <button onClick={() => setIsManualEntryOpen(true)} className="w-full py-7 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 rounded-[2rem] text-[12px] font-black uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-4 shadow-2xl active:scale-95">
                      <Plus size={24} className="text-indigo-400" /> Manual Entry
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-40 text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="w-32 h-32 bg-white/5 rounded-[3rem] flex items-center justify-center mb-10 border border-white/10 text-indigo-500 shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-indigo-600/10 animate-pulse"></div>
              {activeView === 'historical' && <History size={64} className="relative z-10" />}
              {activeView === 'transactions' && <Search size={64} className="relative z-10" />}
              {activeView === 'audit' && <ShieldCheck size={64} className="relative z-10" />}
              {activeView === 'settings' && <Settings size={64} className="relative z-10" />}
            </div>
            <h2 className="text-5xl font-black text-white tracking-tighter mb-6 uppercase tracking-[0.1em]">Section Under Construction</h2>
            <p className="text-slate-500 font-bold uppercase tracking-[0.25em] max-w-xl leading-relaxed text-sm">
              Vault Access Authorized for <span className="text-indigo-400">{userProfile.title} {userProfile.name}</span>. Technical validation and data migration for the <span className="text-white">{activeView.toUpperCase()}</span> module are currently in progress.
            </p>
            <div className="mt-10 flex items-center gap-4">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce"></span>
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.4s]"></span>
            </div>
            <button 
              onClick={() => setActiveView('overview')}
              className="mt-16 px-14 py-6 bg-white text-black font-black rounded-[2rem] text-[11px] uppercase tracking-[0.4em] hover:bg-slate-200 transition-all shadow-[0_20px_60px_rgba(255,255,255,0.05)] active:scale-95 border border-white/20"
            >
              Return to Command Center
            </button>
          </div>
        )}
      </main>

      {/* Manual Entry Modal */}
      {isManualEntryOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/98 backdrop-blur-3xl animate-in fade-in duration-300">
          <div className="glass-effect premium-gradient-border w-full max-w-2xl rounded-[4rem] overflow-hidden">
            <div className="p-12 border-b border-white/5 flex justify-between items-center bg-indigo-600/5">
              <h3 className="text-3xl font-black text-white tracking-tighter uppercase">Vault Ledger Input</h3>
              <button onClick={() => setIsManualEntryOpen(false)} className="text-slate-500 hover:text-white transition-all"><X size={32} /></button>
            </div>
            <form onSubmit={handleManualEntrySubmit} className="p-14 space-y-10">
              <div className="grid grid-cols-2 gap-10">
                <div className="space-y-4">
                  <label className="text-[11px] text-slate-500 font-black uppercase tracking-[0.3em]">Transaction Date</label>
                  <input required type="date" value={newTx.date} onChange={e => setNewTx({...newTx, date: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] p-6 text-white focus:border-indigo-500 focus:outline-none transition-all font-black" />
                </div>
                <div className="space-y-4">
                  <label className="text-[11px] text-slate-500 font-black uppercase tracking-[0.3em]">Amount (USD)</label>
                  <input required type="number" step="0.01" value={newTx.amount || ''} onChange={e => setNewTx({...newTx, amount: e.target.value as any})} placeholder="0.00" className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] p-6 text-white focus:border-indigo-500 focus:outline-none transition-all font-black" />
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[11px] text-slate-500 font-black uppercase tracking-[0.3em]">Description</label>
                <input required type="text" value={newTx.description || ''} onChange={e => setNewTx({...newTx, description: e.target.value})} placeholder="Official payee name" className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] p-6 text-white focus:border-indigo-500 focus:outline-none transition-all font-black" />
              </div>
              <div className="grid grid-cols-2 gap-10">
                <div className="space-y-4">
                  <label className="text-[11px] text-slate-500 font-black uppercase tracking-[0.3em]">Strategy Category</label>
                  <select value={newTx.category} onChange={e => setNewTx({...newTx, category: e.target.value as any})} className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] p-6 text-white focus:border-indigo-500 focus:outline-none transition-all font-black appearance-none cursor-pointer">
                    <option value={BudgetCategory.NEED}>Needs Portfolio (50%)</option>
                    <option value={BudgetCategory.WANT}>Wants Portfolio (30%)</option>
                    <option value={BudgetCategory.SAVINGS}>Savings Portfolio (20%)</option>
                  </select>
                </div>
                <div className="space-y-4">
                  <label className="text-[11px] text-slate-500 font-black uppercase tracking-[0.3em]">Sub-Category</label>
                  <input required type="text" value={newTx.subCategory || ''} onChange={e => setNewTx({...newTx, subCategory: e.target.value})} placeholder="e.g. Healthcare" className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] p-6 text-white focus:border-indigo-500 focus:outline-none transition-all font-black" />
                </div>
              </div>
              <div className="pt-10 flex gap-8">
                <button type="button" onClick={() => setIsManualEntryOpen(false)} className="flex-1 py-6 text-[11px] font-black uppercase tracking-[0.4em] text-slate-600 hover:text-white transition-all">Abort</button>
                <button type="submit" className="flex-[2] py-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[2rem] font-black uppercase tracking-[0.4em] transition-all shadow-xl active:scale-95">Commit Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bank Statement Importer */}
      {isStatementModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/98 backdrop-blur-3xl animate-in fade-in duration-300">
          <div className="glass-effect premium-gradient-border w-full max-w-3xl rounded-[4rem] overflow-hidden shadow-[0_0_120px_rgba(79,70,229,0.25)] border-white/10">
            <div className="p-12 border-b border-white/5 flex justify-between items-center bg-indigo-600/5">
              <div className="flex items-center gap-6">
                <div className="w-18 h-18 bg-indigo-600/20 rounded-[2rem] flex items-center justify-center text-indigo-400 border border-indigo-500/30">
                  <FileText size={36} strokeWidth={2.5} />
                </div>
                <h3 className="text-3xl font-black text-white tracking-tighter uppercase">Digital Capture</h3>
              </div>
              <button onClick={() => setIsStatementModalOpen(false)} className="text-slate-500 hover:text-white p-4 hover:bg-white/5 rounded-2xl transition-all"><X size={36} /></button>
            </div>
            <div className="p-16">
              <p className="text-base text-slate-400 mb-12 leading-relaxed font-bold">Deploying <span className="text-white font-black underline decoration-indigo-500 underline-offset-8 decoration-4">Gemini 3.0 Elite</span> to distill raw financial text into categorized tactical assets. Paste your statement block below for immediate ingestion into the <span className="text-indigo-400">{userProfile.name}</span> ledger.</p>
              <textarea value={statementText} onChange={(e) => setStatementText(e.target.value)} placeholder="Paste statement text here..." className="w-full h-80 bg-black/40 border border-white/10 rounded-[2.5rem] p-12 text-slate-100 focus:ring-8 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-mono text-sm resize-none placeholder:text-slate-800" />
              <div className="mt-14 flex gap-10">
                <button onClick={() => setIsStatementModalOpen(false)} className="flex-1 py-7 text-[11px] font-black uppercase tracking-[0.4em] text-slate-700 hover:text-white transition-colors">Cancel</button>
                <button onClick={handleParseStatement} disabled={isParsing || !statementText} className="flex-[2] py-7 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[2.5rem] font-black uppercase tracking-[0.4em] transition-all shadow-[0_25px_60px_rgba(79,70,229,0.4)] flex items-center justify-center gap-6 disabled:opacity-50 border border-white/20 active:scale-95">
                  {isParsing ? <RefreshCw className="animate-spin" size={28} /> : <Sparkles size={28} />}
                  {isParsing ? 'Neural Syncing...' : 'Initialize Data Sync'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
