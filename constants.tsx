
import { Transaction, BudgetCategory } from './types';

const generateTransactions = () => {
  const txs: Transaction[] = [];
  const categories = [
    { desc: 'Rent Payment', amount: 1500, cat: BudgetCategory.NEED, sub: 'Housing' },
    { desc: 'Grocery Store', amount: 350, cat: BudgetCategory.NEED, sub: 'Groceries' },
    { desc: 'Utilities & Internet', amount: 180, cat: BudgetCategory.NEED, sub: 'Utilities' },
    { desc: 'Dining & Social', amount: 250, cat: BudgetCategory.WANT, sub: 'Dining' },
    { desc: 'Streaming Services', amount: 45, cat: BudgetCategory.WANT, sub: 'Entertainment' },
    { desc: 'Fitness Club', amount: 60, cat: BudgetCategory.WANT, sub: 'Health' },
    { desc: 'Monthly Savings', amount: 800, cat: BudgetCategory.SAVINGS, sub: 'Direct Savings' },
    { desc: 'Emergency Fund', amount: 200, cat: BudgetCategory.SAVINGS, sub: 'Safety' },
  ];

  // Generate data for the last 13 months to ensure full coverage
  const today = new Date();
  for (let i = 12; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthStr = d.toISOString().substring(0, 7);
    
    categories.forEach((c, idx) => {
      // Add some randomness to amounts
      const variance = (Math.random() * 0.2 - 0.1) * c.amount;
      txs.push({
        id: `${monthStr}-${idx}`,
        date: `${monthStr}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
        description: c.desc,
        amount: Math.round(c.amount + variance),
        category: c.cat,
        subCategory: c.sub
      });
    });
  }
  return txs;
};

export const INITIAL_TRANSACTIONS: Transaction[] = generateTransactions();

export const BUDGET_RULES = {
  NEED: 0.5,
  WANT: 0.3,
  SAVINGS: 0.2
};
