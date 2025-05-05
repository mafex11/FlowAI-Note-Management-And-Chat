"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
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
import { Loader2, ChevronDown, ChevronUp, ExternalLink, Send } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";

interface Message {
  role: "user" | "assistant";
  content: string;
  citations?: string[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    citation_tokens: number;
    num_search_queries: number;
    reasoning_tokens: number;
  };
  animationCompleted?: boolean;
  startTime?: number;
}

export default function ResearchPage() {
  const { status } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isThinkingOpen, setIsThinkingOpen] = useState(false);
  const [researchTime, setResearchTime] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (loading) {
      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        setResearchTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        setResearchTime(0);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [loading]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput("");
    setLoading(true);

    // Scroll to the input box
    const inputBox = document.querySelector('form');
    inputBox?.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Add user message to chat
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);

    // Add AI thinking message
    setMessages(prev => [...prev, { 
      role: "assistant", 
      content: "I'm researching and analyzing your request. This may take a moment...",
      animationCompleted: true,
      startTime: Date.now()
    }]);

    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: userMessage,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to get research response");
      }

      const data = await res.json();
      
      // Remove the thinking message and add AI response to chat
      setMessages(prev => {
        const messagesWithoutThinking = prev.slice(0, -1);
        return [...messagesWithoutThinking, {
          role: "assistant",
          content: data.choices[0].message.content,
          citations: data.citations,
          usage: data.usage,
          animationCompleted: false
        }];
      });
    } catch (err) {
      console.error(err);
      // Remove the thinking message and add error message
      setMessages(prev => {
        const messagesWithoutThinking = prev.slice(0, -1);
        return [...messagesWithoutThinking, {
          role: "assistant",
          content: "Sorry, I encountered an error while processing your request. Please try again.",
          animationCompleted: false
        }];
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAnimationComplete = (messageIndex: number) => {
    setMessages(prev => prev.map((msg, idx) => 
      idx === messageIndex ? { ...msg, animationCompleted: true } : msg
    ));
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

      <div className="flex-1 flex flex-col bg-background">
        {/* Guidelines */}
        <div className="border-b border-border bg-card/50">
          <div className="max-w-4xl mx-auto p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Be Specific and Contextual</h3>
                <p className="text-sm text-muted-foreground">
                  Provide clear, detailed information about your research topic, including specific aspects you want to explore.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Avoid Few-Shot Prompting</h3>
                <p className="text-sm text-muted-foreground">
                  Focus on a single, well-defined research question rather than multiple examples or scenarios.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Provide Relevant Context</h3>
                <p className="text-sm text-muted-foreground">
                  Include important background information, relevant theories, or specific methodologies you want to explore.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Think Like a Professor</h3>
                <p className="text-sm text-muted-foreground">
                  Frame your questions with academic rigor, considering theoretical frameworks and scholarly perspectives.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 pb-24">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <motion.div
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border"
                  }`}
                >
                  {message.role === "assistant" ? (
                    <div className="space-y-2 w-full">
                      {/* Thinking Process */}
                      {extractThinkingProcess(message.content) && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          transition={{ duration: 0.3 }}
                          className="bg-card/50 rounded-lg border border-border w-full"
                        >
                          <Collapsible
                            open={isThinkingOpen}
                            onOpenChange={setIsThinkingOpen}
                          >
                            <CollapsibleTrigger className="flex w-full items-center justify-between p-2">
                              <span className="text-sm text-muted-foreground">AI Thinking Process</span>
                              {isThinkingOpen ? (
                                <ChevronUp className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              )}
                            </CollapsibleTrigger>
                            <CollapsibleContent className="p-2">
                              <div className="max-h-[300px] overflow-y-auto">
                                <pre className="whitespace-pre-wrap text-sm text-muted-foreground">
                                  {extractThinkingProcess(message.content)}
                                </pre>
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        </motion.div>
                      )}

                      {/* Main Content */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                        className="bg-card rounded-lg border border-border p-4 w-full"
                      >
                        <div className="prose prose-invert max-w-none">
                          {message.content === "I'm researching and analyzing your request. This may take a moment..." ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <div className="flex flex-col">
                                <span>{message.content}</span>
                                <span className="text-xs text-muted-foreground">
                                  Researching: {formatTime(researchTime)}
                                </span>
                              </div>
                            </div>
                          ) : message.animationCompleted ? (
                            <div className="prose prose-invert max-w-none prose-pre:bg-card/50 prose-pre:border prose-pre:border-border prose-pre:rounded-lg prose-pre:p-4 prose-pre:overflow-x-auto prose-headings:font-semibold prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-em:text-foreground prose-code:text-foreground prose-code:bg-card/50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-table:border prose-table:border-border prose-th:border prose-th:border-border prose-td:border prose-td:border-border prose-th:bg-card/50 prose-th:p-2 prose-td:p-2 prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic" dangerouslySetInnerHTML={{ 
                              __html: extractMainContent(message.content)
                                // Clean up extra backticks and asterisks
                                .replace(/```{3,}/g, '```')
                                .replace(/\*{3,}/g, '**')
                                .replace(/_{3,}/g, '__')
                                // Headers with proper spacing
                                .replace(/^# (.*?)$/gm, '<h1 class="text-3xl font-bold mt-8 mb-4">$1</h1>')
                                .replace(/^## (.*?)$/gm, '<h2 class="text-2xl font-bold mt-6 mb-3">$1</h2>')
                                .replace(/^### (.*?)$/gm, '<h3 class="text-xl font-bold mt-5 mb-2">$1</h3>')
                                .replace(/^#### (.*?)$/gm, '<h4 class="text-lg font-bold mt-4 mb-2">$1</h4>')
                                .replace(/^##### (.*?)$/gm, '<h5 class="text-base font-bold mt-3 mb-1">$1</h5>')
                                .replace(/^###### (.*?)$/gm, '<h6 class="text-sm font-bold mt-2 mb-1">$1</h6>')
                                // Bold and Italic with proper spacing
                                .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
                                .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
                                .replace(/_(.*?)_/g, '<em class="italic">$1</em>')
                                // Code blocks with language support
                                .replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
                                  const language = lang || 'plaintext';
                                  return `<pre class="language-${language}"><code class="language-${language}">${code.trim()}</code></pre>`;
                                })
                                // Inline code
                                .replace(/`([^`]+)`/g, '<code class="bg-card/50 px-1 py-0.5 rounded">$1</code>')
                                // Lists with proper indentation
                                .replace(/^\s*[-*+]\s+(.*?)$/gm, '<li class="ml-4">$1</li>')
                                .replace(/(<li class="ml-4">.*?<\/li>)/gs, '<ul class="list-disc pl-4 my-4">$1</ul>')
                                // Ordered lists
                                .replace(/^\s*\d+\.\s+(.*?)$/gm, '<li class="ml-4">$1</li>')
                                .replace(/(<li class="ml-4">.*?<\/li>)/gs, '<ol class="list-decimal pl-4 my-4">$1</ol>')
                                // Blockquotes with proper styling
                                .replace(/^\s*>\s+(.*?)$/gm, '<blockquote class="border-l-4 border-primary pl-4 italic my-4">$1</blockquote>')
                                // Links with proper styling
                                .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')
                                // Tables with proper alignment
                                .replace(/\|(.*?)\|/g, (match) => {
                                  const cells = match.split('|').filter(cell => cell.trim());
                                  return `<td class="border border-border p-2">${cells.join('</td><td class="border border-border p-2">')}</td>`;
                                })
                                .replace(/<td.*?>(.*?)<\/td>/g, '<td class="border border-border p-2">$1</td>')
                                // LaTeX expressions
                                .replace(/\\\((.*?)\\\)/g, '<span class="math-inline">$1</span>')
                                .replace(/\\\[(.*?)\\\]/g, '<div class="math-block my-4">$1</div>')
                                // Horizontal rule
                                .replace(/^---$/gm, '<hr class="my-8 border-t border-border"/>')
                                // Clean up extra newlines
                                .replace(/\n{3,}/g, '\n\n')
                                // Convert remaining newlines to breaks
                                .replace(/\n/g, '<br/>')
                            }} />
                          ) : (
                            <div className="prose prose-invert max-w-none min-h-[100px] transition-all duration-300 ease-in-out">
                              <TextGenerateEffect
                                words={extractMainContent(message.content)
                                  // Clean up extra backticks and asterisks
                                  .replace(/```{3,}/g, '```')
                                  .replace(/\*{3,}/g, '**')
                                  .replace(/_{3,}/g, '__')
                                  // Headers with proper spacing
                                  .replace(/^# (.*?)$/gm, '<h1 class="text-3xl font-bold mt-8 mb-4">$1</h1>')
                                  .replace(/^## (.*?)$/gm, '<h2 class="text-2xl font-bold mt-6 mb-3">$1</h2>')
                                  .replace(/^### (.*?)$/gm, '<h3 class="text-xl font-bold mt-5 mb-2">$1</h3>')
                                  .replace(/^#### (.*?)$/gm, '<h4 class="text-lg font-bold mt-4 mb-2">$1</h4>')
                                  .replace(/^##### (.*?)$/gm, '<h5 class="text-base font-bold mt-3 mb-1">$1</h5>')
                                  .replace(/^###### (.*?)$/gm, '<h6 class="text-sm font-bold mt-2 mb-1">$1</h6>')
                                  // Bold and Italic with proper spacing
                                  .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
                                  .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
                                  .replace(/_(.*?)_/g, '<em class="italic">$1</em>')
                                  // Code blocks with language support
                                  .replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
                                    const language = lang || 'plaintext';
                                    return `<pre class="language-${language} bg-card/50 border border-border rounded-lg p-4 overflow-x-auto my-4"><code class="language-${language}">${code.trim().replace(/\n/g, '<br/>')}</code></pre>`;
                                  })
                                  // Inline code
                                  .replace(/`([^`]+)`/g, '<code class="bg-card/50 px-1 py-0.5 rounded">$1</code>')
                                  // Lists with proper indentation
                                  .replace(/^\s*[-*+]\s+(.*?)$/gm, '<li class="ml-4">$1</li>')
                                  .replace(/(<li class="ml-4">.*?<\/li>)/g, '<ul class="list-disc pl-4 my-4">$1</ul>')
                                  // Ordered lists
                                  .replace(/^\s*\d+\.\s+(.*?)$/gm, '<li class="ml-4">$1</li>')
                                  .replace(/(<li class="ml-4">.*?<\/li>)/g, '<ol class="list-decimal pl-4 my-4">$1</ol>')
                                  // Blockquotes with proper styling
                                  .replace(/^\s*>\s+(.*?)$/gm, '<blockquote class="border-l-4 border-primary pl-4 italic my-4">$1</blockquote>')
                                  // Links with proper styling
                                  .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')
                                  // Tables with proper alignment
                                  .replace(/\|(.*?)\|/g, (match) => {
                                    const cells = match.split('|').filter(cell => cell.trim());
                                    return `<td class="border border-border p-2">${cells.join('</td><td class="border border-border p-2">')}</td>`;
                                  })
                                  .replace(/<td.*?>(.*?)<\/td>/g, '<td class="border border-border p-2">$1</td>')
                                  // LaTeX expressions
                                  .replace(/\\\((.*?)\\\)/g, '<span class="math-inline">$1</span>')
                                  .replace(/\\\[(.*?)\\\]/g, '<div class="math-block my-4">$1</div>')
                                  // Horizontal rule
                                  .replace(/^---$/gm, '<hr class="my-8 border-t border-border"/>')
                                  // Clean up extra newlines and ensure proper spacing
                                  .replace(/\n{3,}/g, '\n\n')
                                  // Convert remaining newlines to proper spacing
                                  .replace(/\n\n/g, '</p><p class="my-4">')
                                  .replace(/\n/g, '<br/>')
                                  // Fix nested headers
                                  .replace(/<h[1-6].*?>(.*?)<\/h[1-6]><\/p>/g, '<h1>$1</h1>')
                                  .replace(/<h[1-6].*?>(.*?)<\/h[1-6]><br\/>/g, '<h1>$1</h1>')}
                                className="text-foreground"
                                duration={0.5}
                              />
                            </div>
                          )}
                        </div>
                      </motion.div>

                      {/* Citations */}
                      {message.citations && message.citations.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.2 }}
                          className="mt-4 pt-4 border-t border-border w-full"
                        >
                          <h3 className="text-sm font-semibold mb-2">Citations</h3>
                          <div className="space-y-1">
                            {message.citations.map((citation, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-sm">
                                <span className="text-muted-foreground">[{idx + 1}]</span>
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
                        </motion.div>
                      )}

                      {/* Usage Stats */}
                      {message.usage && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.3 }}
                          className="mt-4 pt-4 border-t border-border w-full"
                        >
                          <h3 className="text-sm font-semibold mb-2">Usage Statistics</h3>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <p className="text-muted-foreground">Prompt Tokens</p>
                              <p>{message.usage.prompt_tokens}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Completion Tokens</p>
                              <p>{message.usage.completion_tokens}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Total Tokens</p>
                              <p>{message.usage.total_tokens}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Search Queries</p>
                              <p>{message.usage.num_search_queries}</p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  ) : (
                    <div className="prose prose-invert max-w-none">
                      {message.content}
                    </div>
                  )}
                </motion.div>
              </motion.div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Form - Now sticky */}
        <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="max-w-4xl mx-auto p-4">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Textarea
                placeholder="Type your message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="min-h-[60px] bg-card border-border resize-none"
                onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    const form = e.currentTarget.form;
                    if (form) {
                      form.requestSubmit();
                    }
                  }
                }}
              />
              <Button type="submit" disabled={loading} className="px-4">
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 