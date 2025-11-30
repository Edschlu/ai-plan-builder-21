import { format, addMonths, startOfMonth, isSameMonth, isAfter, isBefore, addDays } from "date-fns";

export interface Transaction {
  id: string;
  type: 'revenue' | 'expense';
  name: string;
  amount: number;
  date: Date;
  is_recurring: boolean;
  recurrence_frequency?: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  recurrence_end_date?: Date;
  payment_delay_days: number;
  category_id?: string;
}

export interface MonthlyData {
  month: string;
  cashIn: number;
  cashOut: number;
  netCashflow: number;
  cumulativeCash: number;
  transactions: Transaction[];
}

export interface CashflowResult {
  monthlyData: MonthlyData[];
  totalCashIn: number;
  totalCashOut: number;
  averageBurnRate: number;
  runway: number;
  alerts: Alert[];
}

export interface Alert {
  type: 'warning' | 'danger' | 'info';
  message: string;
  month?: string;
}

// Generate all occurrences of a recurring transaction
function generateRecurringTransactions(
  transaction: Transaction,
  startDate: Date,
  endDate: Date
): Transaction[] {
  if (!transaction.is_recurring || !transaction.recurrence_frequency) {
    return [transaction];
  }

  const occurrences: Transaction[] = [];
  let currentDate = new Date(transaction.date);
  const recurEnd = transaction.recurrence_end_date 
    ? new Date(transaction.recurrence_end_date) 
    : endDate;

  while (isBefore(currentDate, endDate) && isBefore(currentDate, addDays(recurEnd, 1))) {
    if (!isBefore(currentDate, startDate)) {
      // Apply payment delay
      const effectiveDate = addDays(currentDate, transaction.payment_delay_days);
      
      occurrences.push({
        ...transaction,
        id: `${transaction.id}-${currentDate.getTime()}`,
        date: effectiveDate,
      });
    }

    // Move to next occurrence
    switch (transaction.recurrence_frequency) {
      case 'weekly':
        currentDate = addDays(currentDate, 7);
        break;
      case 'monthly':
        currentDate = addMonths(currentDate, 1);
        break;
      case 'quarterly':
        currentDate = addMonths(currentDate, 3);
        break;
      case 'yearly':
        currentDate = addMonths(currentDate, 12);
        break;
    }
  }

  return occurrences;
}

export function calculateCashflow(
  transactions: Transaction[],
  startingCash: number,
  months: number = 24,
  startDate?: Date
): CashflowResult {
  const start = startDate ? startOfMonth(startDate) : startOfMonth(new Date());
  const monthlyData: MonthlyData[] = [];
  
  // Generate all transaction occurrences including recurring ones
  const allTransactions: Transaction[] = [];
  const endDate = addMonths(start, months);
  
  transactions.forEach(transaction => {
    const occurrences = generateRecurringTransactions(transaction, start, endDate);
    allTransactions.push(...occurrences);
  });

  // Group transactions by month
  let cumulativeCash = startingCash;
  let totalCashIn = 0;
  let totalCashOut = 0;

  for (let i = 0; i < months; i++) {
    const monthDate = addMonths(start, i);
    const monthKey = format(monthDate, 'MMM yyyy');

    // Filter transactions for this month
    const monthTransactions = allTransactions.filter(t =>
      isSameMonth(t.date, monthDate)
    );

    // Calculate cash in/out
    const cashIn = monthTransactions
      .filter(t => t.type === 'revenue')
      .reduce((sum, t) => sum + t.amount, 0);

    const cashOut = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const netCashflow = cashIn - cashOut;
    cumulativeCash += netCashflow;

    totalCashIn += cashIn;
    totalCashOut += cashOut;

    monthlyData.push({
      month: monthKey,
      cashIn,
      cashOut,
      netCashflow,
      cumulativeCash,
      transactions: monthTransactions,
    });
  }

  // Calculate metrics
  const negativeCashflowMonths = monthlyData.filter(m => m.netCashflow < 0);
  const averageBurnRate = negativeCashflowMonths.length > 0
    ? negativeCashflowMonths.reduce((sum, m) => sum + Math.abs(m.netCashflow), 0) / negativeCashflowMonths.length
    : 0;

  // Calculate runway
  let runway = 0;
  for (let i = 0; i < monthlyData.length; i++) {
    if (monthlyData[i].cumulativeCash > 0) {
      runway = i + 1;
    } else {
      break;
    }
  }

  // Generate alerts
  const alerts: Alert[] = [];
  
  if (runway <= 3 && runway > 0) {
    alerts.push({
      type: 'danger',
      message: `Critical: Only ${runway} months of runway remaining`,
    });
  } else if (runway <= 6 && runway > 3) {
    alerts.push({
      type: 'warning',
      message: `Warning: ${runway} months of runway remaining`,
    });
  }

  // Check for negative cashflow months
  const upcomingNegative = monthlyData.slice(0, 3).filter(m => m.netCashflow < 0);
  if (upcomingNegative.length >= 2) {
    alerts.push({
      type: 'warning',
      message: 'Multiple negative cashflow months in the next quarter',
    });
  }

  // Check if cumulative cash goes negative
  const firstNegativeMonth = monthlyData.find(m => m.cumulativeCash < 0);
  if (firstNegativeMonth) {
    alerts.push({
      type: 'danger',
      message: `Cash runs out in ${firstNegativeMonth.month}`,
      month: firstNegativeMonth.month,
    });
  }

  return {
    monthlyData,
    totalCashIn,
    totalCashOut,
    averageBurnRate,
    runway,
    alerts,
  };
}

export function applyScenario(
  transactions: Transaction[],
  scenario: {
    revenueGrowthRate?: number;
    costGrowthRate?: number;
    assumptions?: any;
  }
): Transaction[] {
  return transactions.map(transaction => {
    const growthRate = transaction.type === 'revenue' 
      ? (scenario.revenueGrowthRate || 0) / 100
      : (scenario.costGrowthRate || 0) / 100;

    return {
      ...transaction,
      amount: transaction.amount * (1 + growthRate),
    };
  });
}

export function exportToCsv(data: MonthlyData[]): string {
  const headers = ['Month', 'Cash In', 'Cash Out', 'Net Cashflow', 'Cumulative Cash'];
  const rows = data.map(m => [
    m.month,
    m.cashIn.toFixed(2),
    m.cashOut.toFixed(2),
    m.netCashflow.toFixed(2),
    m.cumulativeCash.toFixed(2),
  ]);

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}
