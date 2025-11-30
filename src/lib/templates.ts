// Business plan templates with pre-configured structure

export interface TemplateConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  categories: Array<{
    name: string;
    type: 'revenue' | 'cost' | 'headcount' | 'investment';
    color: string;
  }>;
  rows: Array<{
    name: string;
    category_type: string;
    type: 'revenue' | 'cost' | 'headcount' | 'investment';
    base_value: number;
    growth_rate: number;
    is_recurring: boolean;
    payment_delay_days: number;
  }>;
  assumptions: {
    revenue_growth_rate: number;
    cost_inflation_rate: number;
    starting_cash: number;
    churn_rate?: number;
    cac?: number;
  };
}

export const templates: Record<string, TemplateConfig> = {
  blank: {
    id: 'blank',
    name: 'Leere Vorlage',
    description: 'Starten Sie von Grund auf mit einer leeren Cashflow-Planung',
    icon: '📋',
    categories: [
      { name: 'Umsätze', type: 'revenue', color: '#10b981' },
      { name: 'Kosten', type: 'cost', color: '#ef4444' }
    ],
    rows: [],
    assumptions: {
      revenue_growth_rate: 5,
      cost_inflation_rate: 3,
      starting_cash: 50000
    }
  },
  saas: {
    id: 'saas',
    name: 'SaaS Startup',
    description: 'Subscription software with MRR growth model',
    icon: '💻',
    categories: [
      { name: 'Revenue', type: 'revenue', color: '#10b981' },
      { name: 'Costs', type: 'cost', color: '#ef4444' },
      { name: 'Team', type: 'headcount', color: '#f59e0b' },
      { name: 'Infrastructure', type: 'investment', color: '#8b5cf6' }
    ],
    rows: [
      { name: 'MRR', category_type: 'revenue', type: 'revenue', base_value: 5000, growth_rate: 8, is_recurring: true, payment_delay_days: 0 },
      { name: 'Onboarding Fees', category_type: 'revenue', type: 'revenue', base_value: 2000, growth_rate: 5, is_recurring: false, payment_delay_days: 0 },
      { name: 'Hosting & Infrastructure', category_type: 'cost', type: 'cost', base_value: 1200, growth_rate: 3, is_recurring: true, payment_delay_days: 30 },
      { name: 'Support Tools', category_type: 'cost', type: 'cost', base_value: 800, growth_rate: 2, is_recurring: true, payment_delay_days: 0 },
      { name: 'Marketing Spend', category_type: 'cost', type: 'cost', base_value: 3000, growth_rate: 10, is_recurring: true, payment_delay_days: 0 },
      { name: 'SaaS Stack', category_type: 'cost', type: 'cost', base_value: 1500, growth_rate: 1, is_recurring: true, payment_delay_days: 0 },
      { name: 'CEO', category_type: 'headcount', type: 'headcount', base_value: 8000, growth_rate: 0, is_recurring: true, payment_delay_days: 0 },
      { name: 'CTO', category_type: 'headcount', type: 'headcount', base_value: 8000, growth_rate: 0, is_recurring: true, payment_delay_days: 0 },
      { name: 'Developer', category_type: 'headcount', type: 'headcount', base_value: 6000, growth_rate: 0, is_recurring: true, payment_delay_days: 0 },
      { name: 'Sales Rep', category_type: 'headcount', type: 'headcount', base_value: 5000, growth_rate: 0, is_recurring: true, payment_delay_days: 0 }
    ],
    assumptions: {
      revenue_growth_rate: 8,
      cost_inflation_rate: 3,
      starting_cash: 100000,
      churn_rate: 5,
      cac: 500
    }
  },
  marketplace: {
    id: 'marketplace',
    name: 'Marketplace',
    description: 'Platform with commissions and GMV growth',
    icon: '🏪',
    categories: [
      { name: 'Revenue', type: 'revenue', color: '#10b981' },
      { name: 'Costs', type: 'cost', color: '#ef4444' },
      { name: 'Team', type: 'headcount', color: '#f59e0b' }
    ],
    rows: [
      { name: 'Transaction Commissions', category_type: 'revenue', type: 'revenue', base_value: 8000, growth_rate: 6, is_recurring: true, payment_delay_days: 7 },
      { name: 'Listing Fees', category_type: 'revenue', type: 'revenue', base_value: 2000, growth_rate: 4, is_recurring: true, payment_delay_days: 0 },
      { name: 'Platform Costs', category_type: 'cost', type: 'cost', base_value: 2500, growth_rate: 4, is_recurring: true, payment_delay_days: 30 },
      { name: 'Payment Processing', category_type: 'cost', type: 'cost', base_value: 800, growth_rate: 6, is_recurring: true, payment_delay_days: 0 },
      { name: 'Customer Support', category_type: 'cost', type: 'cost', base_value: 3000, growth_rate: 3, is_recurring: true, payment_delay_days: 0 },
      { name: 'Product Manager', category_type: 'headcount', type: 'headcount', base_value: 7000, growth_rate: 0, is_recurring: true, payment_delay_days: 0 },
      { name: 'Support Team', category_type: 'headcount', type: 'headcount', base_value: 4000, growth_rate: 0, is_recurring: true, payment_delay_days: 0 },
      { name: 'Operations', category_type: 'headcount', type: 'headcount', base_value: 5000, growth_rate: 0, is_recurring: true, payment_delay_days: 0 }
    ],
    assumptions: {
      revenue_growth_rate: 5,
      cost_inflation_rate: 3,
      starting_cash: 80000
    }
  },
  ecommerce: {
    id: 'ecommerce',
    name: 'E-Commerce / D2C',
    description: 'Direct-to-consumer with inventory management',
    icon: '🛍️',
    categories: [
      { name: 'Revenue', type: 'revenue', color: '#10b981' },
      { name: 'COGS & Logistics', type: 'cost', color: '#ef4444' },
      { name: 'Team', type: 'headcount', color: '#f59e0b' }
    ],
    rows: [
      { name: 'Product Sales', category_type: 'revenue', type: 'revenue', base_value: 25000, growth_rate: 12, is_recurring: false, payment_delay_days: 3 },
      { name: 'Subscription Add-ons', category_type: 'revenue', type: 'revenue', base_value: 3000, growth_rate: 8, is_recurring: true, payment_delay_days: 0 },
      { name: 'COGS', category_type: 'cost', type: 'cost', base_value: 10000, growth_rate: 12, is_recurring: false, payment_delay_days: 60 },
      { name: 'Logistics & Shipping', category_type: 'cost', type: 'cost', base_value: 3500, growth_rate: 10, is_recurring: false, payment_delay_days: 15 },
      { name: 'Returns & Refunds', category_type: 'cost', type: 'cost', base_value: 1500, growth_rate: 8, is_recurring: false, payment_delay_days: 0 },
      { name: 'Marketing', category_type: 'cost', type: 'cost', base_value: 5000, growth_rate: 15, is_recurring: true, payment_delay_days: 0 },
      { name: 'Inventory Costs', category_type: 'cost', type: 'cost', base_value: 8000, growth_rate: 10, is_recurring: false, payment_delay_days: 30 },
      { name: 'Operations Manager', category_type: 'headcount', type: 'headcount', base_value: 6000, growth_rate: 0, is_recurring: true, payment_delay_days: 0 },
      { name: 'Supply Chain', category_type: 'headcount', type: 'headcount', base_value: 5000, growth_rate: 0, is_recurring: true, payment_delay_days: 0 }
    ],
    assumptions: {
      revenue_growth_rate: 12,
      cost_inflation_rate: 5,
      starting_cash: 150000
    }
  },
  agency: {
    id: 'agency',
    name: 'Service Agency',
    description: 'Professional services with billable hours',
    icon: '🎯',
    categories: [
      { name: 'Revenue', type: 'revenue', color: '#10b981' },
      { name: 'Costs', type: 'cost', color: '#ef4444' },
      { name: 'Team', type: 'headcount', color: '#f59e0b' }
    ],
    rows: [
      { name: 'Billable Hours', category_type: 'revenue', type: 'revenue', base_value: 20000, growth_rate: 5, is_recurring: false, payment_delay_days: 30 },
      { name: 'Retainers', category_type: 'revenue', type: 'revenue', base_value: 10000, growth_rate: 3, is_recurring: true, payment_delay_days: 0 },
      { name: 'Software Tools', category_type: 'cost', type: 'cost', base_value: 2000, growth_rate: 2, is_recurring: true, payment_delay_days: 0 },
      { name: 'Lead Generation', category_type: 'cost', type: 'cost', base_value: 3000, growth_rate: 5, is_recurring: true, payment_delay_days: 0 },
      { name: 'Senior Consultant', category_type: 'headcount', type: 'headcount', base_value: 8000, growth_rate: 0, is_recurring: true, payment_delay_days: 0 },
      { name: 'Designer', category_type: 'headcount', type: 'headcount', base_value: 5500, growth_rate: 0, is_recurring: true, payment_delay_days: 0 },
      { name: 'Project Manager', category_type: 'headcount', type: 'headcount', base_value: 6000, growth_rate: 0, is_recurring: true, payment_delay_days: 0 }
    ],
    assumptions: {
      revenue_growth_rate: 5,
      cost_inflation_rate: 2,
      starting_cash: 60000
    }
  },
  hardware: {
    id: 'hardware',
    name: 'Hardware / IoT',
    description: 'Physical products with batch production',
    icon: '🔧',
    categories: [
      { name: 'Revenue', type: 'revenue', color: '#10b981' },
      { name: 'Production', type: 'cost', color: '#ef4444' },
      { name: 'Team', type: 'headcount', color: '#f59e0b' }
    ],
    rows: [
      { name: 'Product Sales', category_type: 'revenue', type: 'revenue', base_value: 30000, growth_rate: 10, is_recurring: false, payment_delay_days: 15 },
      { name: 'Maintenance Contracts', category_type: 'revenue', type: 'revenue', base_value: 5000, growth_rate: 5, is_recurring: true, payment_delay_days: 30 },
      { name: 'COGS - Manufacturing', category_type: 'cost', type: 'cost', base_value: 15000, growth_rate: 10, is_recurring: false, payment_delay_days: 60 },
      { name: 'Logistics', category_type: 'cost', type: 'cost', base_value: 4000, growth_rate: 8, is_recurring: false, payment_delay_days: 30 },
      { name: 'Certifications', category_type: 'cost', type: 'cost', base_value: 2000, growth_rate: 0, is_recurring: false, payment_delay_days: 0 },
      { name: 'Returns & Repairs', category_type: 'cost', type: 'cost', base_value: 1500, growth_rate: 5, is_recurring: false, payment_delay_days: 0 },
      { name: 'Hardware Engineer', category_type: 'headcount', type: 'headcount', base_value: 7500, growth_rate: 0, is_recurring: true, payment_delay_days: 0 },
      { name: 'Operations', category_type: 'headcount', type: 'headcount', base_value: 5000, growth_rate: 0, is_recurring: true, payment_delay_days: 0 },
      { name: 'Support', category_type: 'headcount', type: 'headcount', base_value: 4000, growth_rate: 0, is_recurring: true, payment_delay_days: 0 }
    ],
    assumptions: {
      revenue_growth_rate: 10,
      cost_inflation_rate: 5,
      starting_cash: 200000
    }
  },
  ai: {
    id: 'ai',
    name: 'AI Product',
    description: 'AI-powered SaaS with usage-based pricing',
    icon: '🤖',
    categories: [
      { name: 'Revenue', type: 'revenue', color: '#10b981' },
      { name: 'AI Infrastructure', type: 'cost', color: '#ef4444' },
      { name: 'Team', type: 'headcount', color: '#f59e0b' }
    ],
    rows: [
      { name: 'Subscription Revenue', category_type: 'revenue', type: 'revenue', base_value: 8000, growth_rate: 15, is_recurring: true, payment_delay_days: 0 },
      { name: 'Usage-Based Revenue', category_type: 'revenue', type: 'revenue', base_value: 12000, growth_rate: 20, is_recurring: false, payment_delay_days: 0 },
      { name: 'AI Model API Costs', category_type: 'cost', type: 'cost', base_value: 5000, growth_rate: 18, is_recurring: true, payment_delay_days: 30 },
      { name: 'GPU / Compute', category_type: 'cost', type: 'cost', base_value: 4000, growth_rate: 15, is_recurring: true, payment_delay_days: 0 },
      { name: 'Infrastructure', category_type: 'cost', type: 'cost', base_value: 2000, growth_rate: 10, is_recurring: true, payment_delay_days: 30 },
      { name: 'Support Tools', category_type: 'cost', type: 'cost', base_value: 1000, growth_rate: 3, is_recurring: true, payment_delay_days: 0 },
      { name: 'AI Engineer', category_type: 'headcount', type: 'headcount', base_value: 9000, growth_rate: 0, is_recurring: true, payment_delay_days: 0 },
      { name: 'Product Manager', category_type: 'headcount', type: 'headcount', base_value: 7000, growth_rate: 0, is_recurring: true, payment_delay_days: 0 },
      { name: 'Support', category_type: 'headcount', type: 'headcount', base_value: 4500, growth_rate: 0, is_recurring: true, payment_delay_days: 0 }
    ],
    assumptions: {
      revenue_growth_rate: 18,
      cost_inflation_rate: 12,
      starting_cash: 120000
    }
  }
};

export function generateMonthlyValues(baseValue: number, growthRate: number, months: number = 24): number[] {
  const values: number[] = [];
  let current = baseValue;
  
  for (let i = 0; i < months; i++) {
    values.push(Math.round(current));
    current = current * (1 + growthRate / 100);
  }
  
  return values;
}