import { GoogleGenAI, Type } from "@google/genai";
import { Campus, TransactionType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function detectColumns(sampleData: any[]) {
  const prompt = `Given these sample rows from an Excel file:
${JSON.stringify(sampleData.slice(0, 5))}

Identify which column index or name corresponds to the following financial fields:
- Date
- Description/Narration
- Account Name
- Bank or Cash Account
- Debit
- Credit
- Amount
- Reference/Receipt Number
- Campus (if exists)

Return a JSON object with the mappings.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            date: { type: Type.STRING },
            description: { type: Type.STRING },
            account: { type: Type.STRING },
            bankCashAccount: { type: Type.STRING },
            debit: { type: Type.STRING },
            credit: { type: Type.STRING },
            amount: { type: Type.STRING },
            reference: { type: Type.STRING },
            campus: { type: Type.STRING },
          }
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("AI Column Detection Error:", error);
    return null;
  }
}

export async function categorizeTransactions(transactions: any[]) {
  const prompt = `Categorize the following transactions into the official P&L structure of FIQH Academy.
Structure:
- Income: Donations (Committed, General, Education, Mess, In-Kind), Unrestricted Funds, Restricted Funds (Zakat, Family Kifalat), Maktaba Sale, Fixed Assets Gain.
- Expenses: Salaries & Benefits, Rent, Utilities, Administrative (Mess, Printing, Office, etc.), Repair & Maintenance, Travelling & Conveyance, Welfare & Education, Books & Publications, Legal & Financial, Depreciation, Restricted Funds-Expense.

Transactions:
${JSON.stringify(transactions.map(t => ({ desc: t.description, acc: t.account, bank: t.bankCashAccount })))}

Return a JSON array of objects with 'id' (index), 'category', 'subCategory', 'campus' (Main, Johar, Masjid, Maktab, or null).`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.NUMBER },
              category: { type: Type.STRING },
              subCategory: { type: Type.STRING },
              campus: { type: Type.STRING },
            }
          }
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("AI Categorization Error:", error);
    return [];
  }
}
