import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const RESEARCH_CONTEXT = `You are an expert academic researcher. Write a high-quality research paper on by asking the user for these and building the paper upon that:

Title:
Field of Study:
Objective:
Scope / Subtopics to Cover:**
Tone: Formal, academic  
Length (word count)
Format:** Structured in the standard academic format — Abstract, Introduction, Literature Review, Methodology, Results/Findings, Discussion, Conclusion, and References.

Use up-to-date, peer-reviewed sources. If statistics or findings are referenced, cite them clearly (APA or MLA style). Write in a professional tone suitable for a journal or academic conference. Ensure clarity, coherence, and critical thinking throughout.`;

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { query } = await req.json();

    if (!query) {
      return new NextResponse("Query is required", { status: 400 });
    }

    // Format the query as a structured research request
    const formattedQuery = `Based on the following research request, please generate a comprehensive academic research paper:

${query}

Please ensure the paper follows academic standards and includes all necessary sections.`;

    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.PERPLEXITY_API_KEY}`,
      },
      body: JSON.stringify({
        model: "sonar-deep-research",
        messages: [
          {
            role: "system",
            content: RESEARCH_CONTEXT
          },
          {
            role: "user",
            content: formattedQuery,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to get response from Perplexity API");
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in research API:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 