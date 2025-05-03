"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface ResearchResponse {
  id: string;
  model: string;
  created: number;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    citation_tokens: number;
    num_search_queries: number;
    reasoning_tokens: number;
  };
  citations: string[];
  choices: {
    message: {
      content: string;
    };
  }[];
}

export default function ResearchPage() {
  const { data: session, status } = useSession();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [response, setResponse] = useState<ResearchResponse | null>(null);
  const [isThinkingOpen, setIsThinkingOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError("");
    setResponse(null);

    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: query.trim(),
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to get research response");
      }

      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setError("Failed to get research response. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const extractThinkingProcess = (content: string) => {
    const thinkMatch = content.match(/<think>([\s\S]*?)<\/think>/);
    return thinkMatch ? thinkMatch[1].trim() : "";
  };

  const extractMainContent = (content: string) => {
    return content.replace(/<think>[\s\S]*?<\/think>/, "").trim();
  };

  if (status === "loading") {
    return <div className="p-8 text-center text-foreground">Loading authentication status...</div>;
  }

  if (status === "unauthenticated") {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-4 text-foreground">Access Denied</h1>
        <p className="mb-4 text-muted-foreground">You must be signed in to view this page.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border bg-background">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard" className="text-muted-foreground hover:text-foreground">
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-foreground">Research Paper</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex-1 p-6 bg-background">
        <div className="max-w-4xl mx-auto space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              placeholder="Enter your research query..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="min-h-[100px] bg-card border-border"
            />
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Research...
                </>
              ) : (
                "Generate Research Paper"
              )}
            </Button>
          </form>

          {error && (
            <div className="bg-destructive/20 p-4 rounded-lg text-destructive">
              {error}
            </div>
          )}

          {response && (
            <div className="space-y-6">
              {/* Thinking Process */}
              <Collapsible
                open={isThinkingOpen}
                onOpenChange={setIsThinkingOpen}
                className="bg-card rounded-lg border border-border"
              >
                <CollapsibleTrigger className="flex w-full items-center justify-between p-4">
                  <span className="text-foreground font-medium">AI Thinking Process</span>
                  {isThinkingOpen ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent className="p-4 border-t border-border">
                  <div className="prose prose-invert max-w-none">
                    <pre className="whitespace-pre-wrap text-muted-foreground">
                      {extractThinkingProcess(response.choices[0].message.content)}
                    </pre>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Main Content */}
              <div className="bg-card rounded-lg border border-border p-6">
                <div className="prose prose-invert max-w-none">
                  <div dangerouslySetInnerHTML={{ 
                    __html: extractMainContent(response.choices[0].message.content)
                      .replace(/\n/g, '<br/>')
                      .replace(/#{1,6} (.*?)(?=\n|$)/g, '<h1>$1</h1>')
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\*(.*?)\*/g, '<em>$1</em>')
                  }} />
                </div>
              </div>

              {/* Citations */}
              <div className="bg-card rounded-lg border border-border p-6">
                <h2 className="text-xl font-semibold mb-4 text-foreground">Citations</h2>
                <div className="space-y-2">
                  {response.citations.map((citation, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-muted-foreground">[{index + 1}]</span>
                      <a
                        href={citation}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        {citation}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              {/* Usage Stats */}
              <div className="bg-card rounded-lg border border-border p-6">
                <h2 className="text-xl font-semibold mb-4 text-foreground">Usage Statistics</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Prompt Tokens</p>
                    <p className="text-foreground">{response.usage.prompt_tokens}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Completion Tokens</p>
                    <p className="text-foreground">{response.usage.completion_tokens}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Tokens</p>
                    <p className="text-foreground">{response.usage.total_tokens}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Citation Tokens</p>
                    <p className="text-foreground">{response.usage.citation_tokens}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Search Queries</p>
                    <p className="text-foreground">{response.usage.num_search_queries}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Reasoning Tokens</p>
                    <p className="text-foreground">{response.usage.reasoning_tokens}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 