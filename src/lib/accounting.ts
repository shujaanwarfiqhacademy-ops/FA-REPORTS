import { Transaction, Campus, PLReport, PLSection, TransactionType } from "../types";

export function allocateCampuses(transactions: Transaction[]): Transaction[] {
  return transactions.map(t => {
    if (t.campus !== Campus.UNALLOCATED) return t;

    const narration = t.description.toLowerCase();
    const bankAccount = t.bankCashAccount?.toLowerCase() || "";

    // STEP 0: Special Keywords Override (Maktaba Rule)
    const maktabaKeywords = ["maktaba sale", "maktaba cost", "books & library", "publications"];
    if (maktabaKeywords.some(k => narration.includes(k))) {
      return { ...t, campus: Campus.MAIN };
    }

    // STEP 1: Check Description
    if (narration.includes("main campus")) return { ...t, campus: Campus.MAIN };
    if (narration.includes("johar campus")) return { ...t, campus: Campus.JOHAR };
    if (narration.includes("masjid campus")) return { ...t, campus: Campus.MASJID };
    if (narration.includes("maktab campus")) return { ...t, campus: Campus.MAKTAB };

    // STEP 2: Check Bank/Cash Account
    if (bankAccount.includes("main campus")) return { ...t, campus: Campus.MAIN };
    if (bankAccount.includes("maktab campus")) return { ...t, campus: Campus.MAKTAB };
    if (bankAccount.includes("masjid campus")) return { ...t, campus: Campus.MASJID };
    if (bankAccount.includes("johar campus")) return { ...t, campus: Campus.JOHAR };
    
    // Additional bank specific rules from the prompt
    if (bankAccount.includes("99520104720972")) return { ...t, campus: Campus.MAIN };
    if (bankAccount.includes("99520111406494")) return { ...t, campus: Campus.MAKTAB };
    if (bankAccount.includes("99520113172599")) return { ...t, campus: Campus.MASJID };
    if (bankAccount.includes("zakat fund") || bankAccount.includes("99520111406927")) return { ...t, campus: Campus.MAIN }; // Usually main manages zakat? Or stays unallocated? I'll assume Main for now if unspecified.

    return t;
  });
}

export function generatePLReport(transactions: Transaction[], campus: Campus | "Consolidated", startDate: string, endDate: string): PLReport {
  const filtered = transactions.filter(t => {
    if (campus !== "Consolidated" && t.campus !== campus) return false;
    // Date filtering: ensure transaction is within range
    const tDate = new Date(t.date);
    const sDate = new Date(startDate);
    const eDate = new Date(endDate);
    return tDate >= sDate && tDate <= eDate;
  });

  const createSection = (title: string): PLSection => ({ title, subtotal: 0, items: [] });

  const report: PLReport = {
    campus,
    startDate,
    endDate,
    reportDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
    income: {
      donations: createSection("Donations"),
      unrestricted: createSection("Unrestricted Funds - Income"),
      restricted: createSection("Restricted Funds - Income"),
      maktaba: createSection("Maktaba Sale"),
      fixedAssetsGain: createSection("Fixed assets - Gain/ (Loss) on disposal"),
      total: 0
    },
    expenses: {
      salaries: createSection("Salaries & Other Benefits"),
      rent: createSection("Rent"),
      utilities: createSection("Utilities"),
      admin: createSection("Administrative"),
      repairMaintenance: createSection("Repair & Maintenance"),
      travel: createSection("Travelling & Conveyance"),
      welfareEducation: createSection("Welfare & Education"),
      booksPublications: createSection("Books & Publications"),
      legalFinancial: createSection("Legal & Financial Charges"),
      depreciation: createSection("Depreciation & Amortization"),
      restrictedExpense: createSection("Restricted funds - Expense"),
      total: 0
    },
    netProfitLoss: 0
  };

  filtered.forEach(t => {
    const amount = Number(t.amount) || 0;
    const desc = t.description.toLowerCase();
    
    if (t.type === TransactionType.INCOME) {
      if (desc.includes("maktaba sale")) {
        report.income.maktaba.items.push({ name: t.description, amount });
        report.income.maktaba.subtotal += amount;
      } else if (desc.includes("unrestricted") || desc.includes("fellowship") || desc.includes("land") || desc.includes("specific purpose")) {
        report.income.unrestricted.items.push({ name: t.description, amount });
        report.income.unrestricted.subtotal += amount;
      } else if (desc.includes("zakat") || desc.includes("family kifalat")) {
        report.income.restricted.items.push({ name: t.description, amount });
        report.income.restricted.subtotal += amount;
      } else if (desc.includes("fixed asset") || desc.includes("disposal") || desc.includes("gain") || desc.includes("loss")) {
        report.income.fixedAssetsGain.items.push({ name: t.description, amount });
        report.income.fixedAssetsGain.subtotal += amount;
      } else {
        // Default to Donations if nothing else matches clearly
        report.income.donations.items.push({ name: t.description, amount });
        report.income.donations.subtotal += amount;
      }
    } else {
      // Expenses
      if (desc.includes("salary") || desc.includes("wage") || desc.includes("staff welfare") || desc.includes("benefit")) {
        report.expenses.salaries.items.push({ name: t.description, amount });
        report.expenses.salaries.subtotal += amount;
      } else if (desc.includes("rent")) {
        report.expenses.rent.items.push({ name: t.description, amount });
        report.expenses.rent.subtotal += amount;
      } else if (desc.includes("electricity") || desc.includes("fuel") || desc.includes("gas") || desc.includes("telephone") || desc.includes("internet")) {
        report.expenses.utilities.items.push({ name: t.description, amount });
        report.expenses.utilities.subtotal += amount;
      } else if (desc.includes("admin") || desc.includes("mess") || desc.includes("printing") || desc.includes("stationery") || desc.includes("cartage") || desc.includes("courier") || desc.includes("ramzan")) {
        report.expenses.admin.items.push({ name: t.description, amount });
        report.expenses.admin.subtotal += amount;
      } else if (desc.includes("r&m") || desc.includes("repair") || desc.includes("maintenance")) {
        report.expenses.repairMaintenance.items.push({ name: t.description, amount });
        report.expenses.repairMaintenance.subtotal += amount;
      } else if (desc.includes("petrol") || desc.includes("cng") || desc.includes("travelling") || desc.includes("conveyance")) {
        report.expenses.travel.items.push({ name: t.description, amount });
        report.expenses.travel.subtotal += amount;
      } else if (desc.includes("scholarship") || desc.includes("fellowship") || desc.includes("masjid") || desc.includes("charity") || desc.includes("welfare")) {
        report.expenses.welfareEducation.items.push({ name: t.description, amount });
        report.expenses.welfareEducation.subtotal += amount;
      } else if (desc.includes("book") || desc.includes("library") || desc.includes("maktaba cost") || desc.includes("publication")) {
        report.expenses.booksPublications.items.push({ name: t.description, amount });
        report.expenses.booksPublications.subtotal += amount;
      } else if (desc.includes("audit") || desc.includes("legal") || desc.includes("bank charge") || desc.includes("subscription")) {
        report.expenses.legalFinancial.items.push({ name: t.description, amount });
        report.expenses.legalFinancial.subtotal += amount;
      } else if (desc.includes("depreciation") || desc.includes("amortization")) {
        report.expenses.depreciation.items.push({ name: t.description, amount });
        report.expenses.depreciation.subtotal += amount;
      } else if (desc.includes("zakat fund") || desc.includes("family kifalat fund") ) {
        report.expenses.restrictedExpense.items.push({ name: t.description, amount });
        report.expenses.restrictedExpense.subtotal += amount;
      } else {
        // Default to Admin
        report.expenses.admin.items.push({ name: t.description, amount });
        report.expenses.admin.subtotal += amount;
      }
    }
  });

  report.income.total = report.income.donations.subtotal + report.income.unrestricted.subtotal + 
                        report.income.restricted.subtotal + report.income.maktaba.subtotal + 
                        report.income.fixedAssetsGain.subtotal;
                        
  report.expenses.total = report.expenses.salaries.subtotal + report.expenses.rent.subtotal + 
                          report.expenses.utilities.subtotal + report.expenses.admin.subtotal + 
                          report.expenses.repairMaintenance.subtotal + report.expenses.travel.subtotal + 
                          report.expenses.welfareEducation.subtotal + report.expenses.booksPublications.subtotal + 
                          report.expenses.legalFinancial.subtotal + report.expenses.depreciation.subtotal + 
                          report.expenses.restrictedExpense.subtotal;
                          
  report.netProfitLoss = report.income.total - report.expenses.total;

  return report;
}
