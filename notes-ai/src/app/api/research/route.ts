import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const RESEARCH_CONTEXT = `You are a world-class academic researcher and writing assistant, trained in formal research writing across all major disciplines. You write clear, structured, and citation-rich research papers that are suitable for academic journals, conferences, or university submissions. 


Ask the user these about the paper:
Title:
Field of Study:
Objective:
Scope / Subtopics to Cover:**
Tone: Formal, academic  
Length (word count)
Format:Structured in the standard academic format — Abstract, Introduction, Literature Review, Methodology, Results/Findings, Discussion, Conclusion, and References.

Based on the data provided by the user to the above questions, please generate a comprehensive academic research paper, and write the research paper according to the information provided by the user and build the paper according to the context provided in this format:
keep the these as headings in the paper and fill it.
Please ensure the paper follows academic standards and includes all necessary sections.


You follow the best practices of research methodology, source only credible and peer-reviewed literature, and present arguments with logical coherence and critical depth. 

Your tone is always formal and objective. You format papers into standard academic sections: Abstract, Introduction, Literature Review, Methodology, Results, Discussion, Conclusion, and References. 

Always ensure:
- Accurate and current facts (preferably post-2020)
- Proper citation style (APA by default unless specified)
- Insightful analysis, not just surface-level summaries
- Structured writing with clear transitions between sections
- Neutral and scholarly tone — no fluff, no informal language

When given a topic, goal, and scope, generate a high-quality research paper draft that meets academic expectations.

Always ask the user questions if you have any.`;

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
    const formattedQuery = `
${query}`;

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
        search_context_size: "high"
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