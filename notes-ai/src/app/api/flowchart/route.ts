import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Document } from "@/lib/models";
import { perplexity } from "@/lib/perplexity";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get all documents for the user
    const documents = await Document.find({ user: session.user.id });

    if (!documents.length) {
      return new NextResponse("No documents found", { status: 404 });
    }

    // Combine all topics from all documents
    const allTopics = documents.reduce((acc: string[], doc) => {
      return [...acc, ...doc.topics];
    }, []);

    // Remove duplicates
    const uniqueTopics = [...new Set(allTopics)];

    if (uniqueTopics.length === 0) {
      return new NextResponse("No topics found in documents", { status: 404 });
    }

    // Generate connections between topics using AI
    const prompt = `Given these topics from study materials: ${uniqueTopics.join(", ")}, 
    analyze their relationships and create a JSON structure with:
    1. Topics as nodes with positions in 3D space
    2. Connections between related topics with strength values (0-1)
    Consider:
    - Prerequisites and dependencies
    - Conceptual relationships
    - Topic hierarchies
    Return only the JSON structure in this exact format:
    {
      "topics": [
        {
          "name": "topic name",
          "position": [x, y, z]
        }
      ],
      "connections": [
        {
          "from": "topic name",
          "to": "topic name",
          "strength": 0.5
        }
      ]
    }`;

    const response = await perplexity.chat.completions.create({
      model: "sonar-medium-online",
      messages: [
        {
          role: "system",
          content: "You are a helpful AI that analyzes relationships between academic topics and creates 3D flowchart data. Always return valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    if (!response.choices?.[0]?.message?.content) {
      throw new Error("No response from AI model");
    }

    let flowchartData;
    try {
      flowchartData = JSON.parse(response.choices[0].message.content);
    } catch (parseError) {
      console.error("Failed to parse AI response:", response.choices[0].message.content);
      throw new Error("Invalid response format from AI model");
    }

    // Validate the data structure
    if (!Array.isArray(flowchartData.topics) || !Array.isArray(flowchartData.connections)) {
      throw new Error("Invalid data structure from AI model");
    }

    // Transform and validate the data
    const validatedData = {
      topics: flowchartData.topics.map((topic: any, index: number) => ({
        id: `topic-${index}`,
        name: topic.name || `Topic ${index + 1}`,
        connections: [],
        position: Array.isArray(topic.position) && topic.position.length === 3
          ? topic.position
          : [Math.random() * 10 - 5, Math.random() * 10 - 5, Math.random() * 10 - 5],
      })),
      connections: flowchartData.connections
        .filter((conn: any) => 
          conn.from && 
          conn.to && 
          typeof conn.strength === 'number'
        )
        .map((conn: any) => ({
          from: conn.from,
          to: conn.to,
          strength: Math.min(Math.max(conn.strength, 0), 1),
        })),
    };

    // Ensure we have at least some connections
    if (validatedData.connections.length === 0) {
      // Create some default connections if none were generated
      for (let i = 0; i < validatedData.topics.length - 1; i++) {
        validatedData.connections.push({
          from: validatedData.topics[i].name,
          to: validatedData.topics[i + 1].name,
          strength: 0.5,
        });
      }
    }

    return NextResponse.json(validatedData);
  } catch (error) {
    console.error("Error generating flowchart:", error);
    return new NextResponse(
      JSON.stringify({ 
        error: "Failed to generate flowchart", 
        details: error instanceof Error ? error.message : "Unknown error" 
      }), 
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
} 