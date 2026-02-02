
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, AnalysisInsights } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function analyzeTransactions(transactions: Transaction[], income: number): Promise<AnalysisInsights> {
  const transactionSummary = transactions.map(t => `${t.description}: $${t.amount} (${t.category})`).join(', ');

  const prompt = `Analyze the following financial transactions: ${transactionSummary}. 
  The user has a monthly income of $${income}. 
  Based on the 50/30/20 rule, provide:
  1. A summary of current spending habits.
  2. A future forecast of their financial health if they stop receiving income (how many months can they survive?).
  3. Actionable recommendations to reduce spending.
  
  Format the response as JSON.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          forecast: { type: Type.STRING },
          recommendations: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["summary", "forecast", "recommendations"]
      }
    }
  });

  return JSON.parse(response.text);
}

export async function parseStatement(text: string): Promise<Partial<Transaction>[]> {
  const prompt = `Convert the following bank statement text into a structured JSON array of objects with keys: date, description, amount, category (one of 'Need', 'Want', 'Savings'), and subCategory. 
  Statement: ${text}`;

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
            date: { type: Type.STRING },
            description: { type: Type.STRING },
            amount: { type: Type.NUMBER },
            category: { type: Type.STRING },
            subCategory: { type: Type.STRING }
          },
          required: ["date", "description", "amount", "category", "subCategory"]
        }
      }
    }
  });

  return JSON.parse(response.text);
}
