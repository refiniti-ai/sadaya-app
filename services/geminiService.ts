import { GoogleGenAI } from "@google/genai";
import { ProposalContent, Task, MarketingStrategy } from "../types";

// Gemini API Key - Try multiple sources
// @ts-ignore - Vite injects this at build time
const ENV_KEY = import.meta.env?.VITE_GEMINI_API_KEY || "";
// Hardcoded fallback for development
const HARDCODED_KEY = "AIzaSyCfkc2jQskaXaUE9GcLLiDX2W4_mTxO8XM";
const GEMINI_API_KEY: string = ENV_KEY || HARDCODED_KEY;

// Use the correct Gemini model name
const GEMINI_MODEL = "gemini-2.0-flash";

let cachedAi: GoogleGenAI | null = null;

// Debug logging on load
console.log("🔑 Gemini API Key status:", GEMINI_API_KEY ? `Loaded (${GEMINI_API_KEY.substring(0, 10)}...)` : "NOT FOUND");
console.log("🔑 ENV_KEY:", ENV_KEY ? "Found from env" : "Not in env");
console.log("🔑 Using:", ENV_KEY ? "Environment variable" : "Hardcoded key");

const getGeminiClient = (): GoogleGenAI | null => {
  if (!GEMINI_API_KEY) {
    console.warn("⚠️ Gemini API key not configured!");
    return null;
  }
  if (cachedAi) {
    console.log("♻️ Returning cached Gemini client");
    return cachedAi;
  }

  try {
    console.log("🤖 Initializing Gemini AI client with key:", GEMINI_API_KEY.substring(0, 15) + "...");
    cachedAi = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    console.log("✅ Gemini AI client initialized successfully");
    return cachedAi;
  } catch (error) {
    console.error("❌ Failed to initialize Gemini client:", error);
    return null;
  }
};

const DEFAULT_PROPOSAL_CONTENT: ProposalContent = {
  hero: { title: "Proposal Content Unavailable", subtitle: "Enable Gemini API key to see generated proposals." },
  engine: { generatedValue: 0, description: "AI generation is temporarily offline." },
  phases: [],
  investment: [],
  strategy: [],
  adSpend: []
};

export const generateProposalContent = async (
  clientName: string,
  industry: string,
  services: string[],
  notes: string
): Promise<{ content: ProposalContent }> => {
  
  const model = GEMINI_MODEL;
  
  const prompt = `
    Act as Sadaya AI, the elite wellness coordinator for Sadaya Sanctuary.
    We are generating a structured JSON proposal for a client to be displayed in our dashboard.
    
    Client: ${clientName}
    Industry: ${industry}
    Requested Services: ${services.join(', ')}
    Sales Notes: ${notes}

    Generate a JSON object strictly following this structure (do not use markdown formatting for the JSON itself, just return the raw JSON):

    {
      "hero": {
        "title": "Proposal for ${clientName}",
        "subtitle": "An integrated plan for a unified digital ecosystem and high-performance growth."
      },
      "engine": {
        "generatedValue": (Estimate a realistic dollar value of the strategy e.g. 24680),
        "description": "This plan is designed to maximize conversion while maintaining strict capital separation. Our proprietary engine combines data-driven strategies with high-converting creative."
      },
      "phases": [
        {
          "title": "Phase 1: Website Infrastructure & Conversion Assets",
          "description": "Focus: Building high-authority digital real estate required to generate and convert high-quality leads.",
          "items": ["(List 3-4 specific deliverables based on services)"]
        },
        {
          "title": "Phase 2: Performance Lead Generation",
          "description": "Focus: Rebuilding the lead engine with a 'no-waste' ad spend strategy to drive measurable ROI.",
          "items": ["(List 3-4 specific deliverables)"]
        }
      ],
      "investment": [
        { "item": "Website Infrastructure & Assets", "costInitial": (number), "costMonthly": (number) },
        { "item": "Performance Lead Generation", "costInitial": (number), "costMonthly": (number) }
      ],
      "strategy": [
        { "title": "Platform Evaluation", "content": "Analysis of current stack efficiency." },
        { "title": "The VSL Factor", "content": "Video Sales Letter implementation strategy." },
        { "title": "Open/Shut Protocol", "content": "Lead qualification framework." }
      ],
      "adSpend": [
        { "phase": "Testing (Month 1-2)", "monthlySpend": "$500 - $1,500", "targetCPL": "$150", "expectedLeads": "6 - 10" },
        { "phase": "Optimization (Month 3)", "monthlySpend": "$2,400", "targetCPL": "$120", "expectedLeads": "20 - 25" },
        { "phase": "Stabilized State", "monthlySpend": "$3K - $4.5K", "targetCPL": "$80 - $100", "expectedLeads": "30 - 45" }
      ]
    }
  `;

  try {
  const ai = getGeminiClient();
  if (!ai) {
    return { content: DEFAULT_PROPOSAL_CONTENT };
  }

  const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text || "{}";
    const data = JSON.parse(text);

    return {
      content: data
    };
  } catch (error) {
    console.error("AI Generation Error", error);
    // Fallback data structure in case of error
    return {
      content: DEFAULT_PROPOSAL_CONTENT
    };
  }
};

export const generateMarketingStrategy = async (
  clientName: string,
  answers: any
): Promise<MarketingStrategy> => {
  const ai = getGeminiClient();
  if (!ai) {
    return {
      executiveSummary: "AI service unavailable.",
      targetAudience: "N/A",
      brandVoice: "N/A",
      roadmap: [],
      channels: [],
      kpis: []
    };
  }

  const model = GEMINI_MODEL;
  
  const prompt = `
    Act as VARIA, the Chief Strategy Officer.
    Create a detailed Marketing Strategy for ${clientName} based on the following intake questionnaire:
    ${JSON.stringify(answers)}
    
    Output strictly in this JSON format:
    {
        "executiveSummary": "High level overview of the approach",
        "targetAudience": "Detailed persona description",
        "brandVoice": "Tone and style guidelines",
        "roadmap": [
            { "phase": "Phase 1: Foundation", "timeline": "Weeks 1-4", "objectives": ["obj1", "obj2"] },
            { "phase": "Phase 2: Growth", "timeline": "Weeks 5-8", "objectives": ["obj1", "obj2"] }
        ],
        "channels": ["Channel 1", "Channel 2"],
        "kpis": ["KPI 1", "KPI 2"]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    return {
        executiveSummary: "Error generating strategy.",
        targetAudience: "N/A",
        brandVoice: "N/A",
        roadmap: [],
        channels: [],
        kpis: []
    };
  }
};

export const generateProjectTasks = async (strategyText: string, projectTitle: string): Promise<Partial<Task>[]> => {
    const ai = getGeminiClient();
    
    // Fallback demo tasks when AI is unavailable
    const generateDemoTasks = (): Partial<Task>[] => {
      const keywords = strategyText.toLowerCase();
      const tasks: Partial<Task>[] = [];
      
      // Generate contextual tasks based on strategy keywords
      if (keywords.includes('website') || keywords.includes('web') || keywords.includes('landing')) {
        tasks.push({
          title: 'Website Architecture & Wireframes',
          description: 'Design site structure and create wireframes for key pages.',
          priority: 'High',
          checklist: [
            { id: '1', text: 'Create sitemap', completed: false },
            { id: '2', text: 'Design homepage wireframe', completed: false },
            { id: '3', text: 'Review with stakeholders', completed: false }
          ]
        });
      }
      
      if (keywords.includes('brand') || keywords.includes('design') || keywords.includes('visual')) {
        tasks.push({
          title: 'Brand Identity Development',
          description: 'Establish visual identity and brand guidelines.',
          priority: 'High',
          checklist: [
            { id: '1', text: 'Define color palette', completed: false },
            { id: '2', text: 'Select typography', completed: false },
            { id: '3', text: 'Create brand guide document', completed: false }
          ]
        });
      }
      
      if (keywords.includes('content') || keywords.includes('copy') || keywords.includes('blog')) {
        tasks.push({
          title: 'Content Strategy & Creation',
          description: 'Develop content calendar and create initial assets.',
          priority: 'Medium',
          checklist: [
            { id: '1', text: 'Research target keywords', completed: false },
            { id: '2', text: 'Create content calendar', completed: false },
            { id: '3', text: 'Write first batch of content', completed: false }
          ]
        });
      }
      
      if (keywords.includes('seo') || keywords.includes('search') || keywords.includes('organic')) {
        tasks.push({
          title: 'SEO Foundation Setup',
          description: 'Implement technical SEO and on-page optimization.',
          priority: 'High',
          checklist: [
            { id: '1', text: 'Technical SEO audit', completed: false },
            { id: '2', text: 'Optimize meta tags', completed: false },
            { id: '3', text: 'Setup search console', completed: false }
          ]
        });
      }
      
      if (keywords.includes('social') || keywords.includes('instagram') || keywords.includes('facebook') || keywords.includes('linkedin')) {
        tasks.push({
          title: 'Social Media Setup & Strategy',
          description: 'Configure social profiles and create posting strategy.',
          priority: 'Medium',
          checklist: [
            { id: '1', text: 'Audit existing profiles', completed: false },
            { id: '2', text: 'Create content templates', completed: false },
            { id: '3', text: 'Schedule first week posts', completed: false }
          ]
        });
      }
      
      if (keywords.includes('ads') || keywords.includes('ppc') || keywords.includes('paid') || keywords.includes('campaign')) {
        tasks.push({
          title: 'Paid Advertising Setup',
          description: 'Configure ad accounts and create initial campaigns.',
          priority: 'High',
          checklist: [
            { id: '1', text: 'Setup ad accounts', completed: false },
            { id: '2', text: 'Define target audiences', completed: false },
            { id: '3', text: 'Create ad creatives', completed: false }
          ]
        });
      }
      
      if (keywords.includes('email') || keywords.includes('newsletter') || keywords.includes('automation')) {
        tasks.push({
          title: 'Email Marketing Setup',
          description: 'Configure email platform and create automation flows.',
          priority: 'Medium',
          checklist: [
            { id: '1', text: 'Setup email platform', completed: false },
            { id: '2', text: 'Design email templates', completed: false },
            { id: '3', text: 'Create welcome sequence', completed: false }
          ]
        });
      }
      
      if (keywords.includes('analytics') || keywords.includes('tracking') || keywords.includes('data')) {
        tasks.push({
          title: 'Analytics & Tracking Setup',
          description: 'Implement tracking and configure dashboards.',
          priority: 'High',
          checklist: [
            { id: '1', text: 'Setup Google Analytics', completed: false },
            { id: '2', text: 'Configure conversion tracking', completed: false },
            { id: '3', text: 'Create reporting dashboard', completed: false }
          ]
        });
      }
      
      // Always add these baseline tasks
      tasks.push({
        title: 'Project Kickoff & Planning',
        description: 'Initial planning session and timeline establishment.',
        priority: 'High',
        checklist: [
          { id: '1', text: 'Review project requirements', completed: false },
          { id: '2', text: 'Create project timeline', completed: false },
          { id: '3', text: 'Assign team responsibilities', completed: false }
        ]
      });
      
      tasks.push({
        title: 'Client Review & Feedback',
        description: 'Present deliverables and gather client feedback.',
        priority: 'Medium',
        checklist: [
          { id: '1', text: 'Prepare presentation', completed: false },
          { id: '2', text: 'Schedule review meeting', completed: false },
          { id: '3', text: 'Document feedback', completed: false }
        ]
      });
      
      // Limit to 6 tasks max
      return tasks.slice(0, 6);
    };
    
    if (!ai) {
      console.log("⚠️ AI client not available, using fallback demo tasks");
      return generateDemoTasks();
    }

    const prompt = `
You are VARIA, an expert Operations Manager AI.

PROJECT: "${projectTitle}"

STRATEGY/DESCRIPTION:
${strategyText}

Based on this strategy, generate 5-8 specific, actionable tasks to execute this project.
Each task should directly relate to what was described in the strategy.

Return ONLY a valid JSON array with this exact structure:
[
  {
    "title": "Specific Task Title",
    "description": "Clear description of what needs to be done",
    "priority": "High",
    "checklist": [
      { "id": "1", "text": "First subtask", "completed": false },
      { "id": "2", "text": "Second subtask", "completed": false }
    ]
  }
]

Priority should be "High", "Medium", or "Low" based on importance.
Make tasks specific to the strategy provided, not generic.
    `;

    try {
        console.log("🚀 Calling Gemini API for task generation...");
        console.log("📝 Strategy input:", strategyText.substring(0, 200) + "...");
        
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        
        const responseText = response.text || "[]";
        console.log("✅ Gemini API response received:", responseText.substring(0, 500));
        
        const tasks = JSON.parse(responseText);
        console.log(`✅ Successfully parsed ${tasks.length} tasks from AI`);
        return tasks;
    } catch (e) {
        console.error("❌ Gemini API error:", e);
        console.log("⚠️ Falling back to demo tasks");
        return generateDemoTasks();
    }
}

export const generateInvoiceEmail = async (clientName: string, invoiceId: string, amount: number, dueDate: string) => {
    const ai = getGeminiClient();
    if (!ai) {
        return { subject: `Invoice ${invoiceId}`, body: "Please find the invoice attached." };
    }

    const model = GEMINI_MODEL;
    const prompt = `
      Write a professional yet friendly email to ${clientName} regarding Invoice ${invoiceId} for $${amount}, due on ${dueDate}.
      Tone: Professional, Efficient, Warm.
      Output JSON: { "subject": "...", "body": "..." }
    `;
    
    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text || "{}");
    } catch (e) {
        return { subject: `Invoice ${invoiceId}`, body: "Please find the invoice attached." };
    }
}

export const chatSupport = async (history: any[], newMessage: string) => {
    const model = GEMINI_MODEL;
    // Using generateContent for single turn or simple chat simulation given the context
    // In a real app, use chatSession
    const prompt = `
      You are Sadaya AI, the wellness assistant for the Sadaya Sanctuary guest portal.
      Answer the user's question concisely and professionally.
      User: ${newMessage}
    `;
    
    const client = getGeminiClient();
    if (!client) {
        return "AI service unavailable. Please configure your Gemini API key.";
    }

    try {
        const response = await client.models.generateContent({
            model,
            contents: prompt
        });
        return response.text || "I'm having trouble connecting right now.";
    } catch (e) {
        return "System offline. Please try again.";
    }
}