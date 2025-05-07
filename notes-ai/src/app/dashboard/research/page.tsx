"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import ReactMarkdown from 'react-markdown';
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
      // Scroll to the bottom of the messages after response is received
      setTimeout(() => {
        scrollToBottom();
      }, 100);
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
                    <div className="space-y-2 w-full text-justify">
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
                        className="bg-card rounded-lg border border-border p-4 w-full h-[32rem] overflow-y-auto"
                      >
                        <div className="prose prose-invert max-w-none">
                          {message.content === "I'm researching and analyzing your request. This may take a moment..." ? (
                            <div className="space-y-4">
                              <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <div className="flex flex-col">
                                  <span>{message.content}</span>
                                  <span className="text-xs text-muted-foreground">
                                    Researching: {formatTime(researchTime)}
                                  </span>
                                </div>
                              </div>
                              {/* Show thinking process while loading */}
                              {extractThinkingProcess(message.content) && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  transition={{ duration: 0.3 }}
                                  className="bg-card/50 rounded-lg border border-border w-full"
                                >
                                  <div className="p-4">
                                    <h3 className="text-sm font-semibold mb-2">AI Thinking Process</h3>
                                    <div className="max-h-[200px] overflow-y-auto">
                                      <pre className="whitespace-pre-wrap text-sm text-muted-foreground">
                                        {extractThinkingProcess(message.content)}
                                      </pre>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </div>
                          ) : message.animationCompleted ? (
                            <div className="space-y-4">
                              {/* Show thinking process first */}
                              {extractThinkingProcess(message.content) && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  transition={{ duration: 0.3 }}
                                  className="bg-card/50 rounded-lg border border-border w-full"
                                >
                                  <div className="p-4">
                                    <h3 className="text-sm font-semibold mb-2">AI Thinking Process</h3>
                                    <div className="max-h-[200px] overflow-y-auto">
                                      <pre className="whitespace-pre-wrap text-sm text-muted-foreground">
                                        {extractThinkingProcess(message.content)}
                                      </pre>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                              {/* Show final answer */}
                              <div className="prose prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-em:text-foreground prose-code:text-foreground prose-pre:bg-card/50 prose-pre:border prose-pre:border-border prose-pre:rounded-lg prose-pre:p-4 prose-pre:overflow-x-auto prose-pre:my-4 prose-blockquote:border-primary prose-blockquote:border-l-4 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:my-4 prose-a:text-primary prose-a:hover:underline prose-ul:list-disc prose-ul:pl-4 prose-ul:my-4 prose-ol:list-decimal prose-ol:pl-4 prose-ol:my-4 prose-li:ml-4 prose-hr:my-8 prose-hr:border-t prose-hr:border-border">
                                <ReactMarkdown 
                                  components={{
                                    h1: ({...props}) => <h1 className="text-3xl font-bold my-6" {...props} />,
                                    h2: ({...props}) => <h2 className="text-2xl font-bold my-5" {...props} />,
                                    h3: ({...props}) => <h3 className="text-xl font-semibold my-4" {...props} />,
                                    p: ({...props}) => <p className="my-4" {...props} />,
                                    ul: ({...props}) => <ul className="list-disc pl-5 my-4 space-y-2" {...props} />,
                                    ol: ({...props}) => <ol className="list-decimal pl-5 my-4 space-y-2" {...props} />,
                                    li: ({...props}) => <li className="ml-4" {...props} />,
                                    a: ({href, ...props}) => (
                                      <a 
                                        href={href} 
                                        className="text-primary hover:underline" 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        {...props} 
                                      />
                                    ),
                                    em: ({...props}) => <em className="italic" {...props} />,
                                    strong: ({...props}) => <strong className="font-bold" {...props} />,
                                    code: ({...props}) => <code className="bg-card/50 px-1 py-0.5 rounded text-sm" {...props} />,
                                    pre: ({...props}) => <pre className="bg-card/50 p-4 rounded-md overflow-x-auto my-4 text-sm" {...props} />,
                                    blockquote: ({...props}) => <blockquote className="border-l-4 border-primary pl-4 italic my-4" {...props} />,
                                  }}
                                >
                                  {extractMainContent(message.content)}
                                </ReactMarkdown>
                              </div>
                            </div>
                          ) : (
                            <motion.div 
                              className="prose prose-invert max-w-none"
                              layout
                              transition={{ duration: 0.3 }}
                            >
                              <div className="prose prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-em:text-foreground prose-code:text-foreground prose-pre:bg-card/50 prose-pre:border prose-pre:border-border prose-pre:rounded-lg prose-pre:p-4 prose-pre:overflow-x-auto prose-pre:my-4 prose-blockquote:border-primary prose-blockquote:border-l-4 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:my-4 prose-a:text-primary prose-a:hover:underline prose-ul:list-disc prose-ul:pl-4 prose-ul:my-4 prose-ol:list-decimal prose-ol:pl-4 prose-ol:my-4 prose-li:ml-4 prose-hr:my-8 prose-hr:border-t prose-hr:border-border">
                                <ReactMarkdown 
                                  components={{
                                    h1: ({...props}) => <h1 className="text-3xl font-bold my-6" {...props} />,
                                    h2: ({...props}) => <h2 className="text-2xl font-bold my-5" {...props} />,
                                    h3: ({...props}) => <h3 className="text-xl font-semibold my-4" {...props} />,
                                    p: ({...props}) => <p className="my-4" {...props} />,
                                    ul: ({...props}) => <ul className="list-disc pl-5 my-4 space-y-2" {...props} />,
                                    ol: ({...props}) => <ol className="list-decimal pl-5 my-4 space-y-2" {...props} />,
                                    li: ({...props}) => <li className="ml-4" {...props} />,
                                    a: ({href, ...props}) => (
                                      <a 
                                        href={href} 
                                        className="text-primary hover:underline" 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        {...props} 
                                      />
                                    ),
                                    em: ({...props}) => <em className="italic" {...props} />,
                                    strong: ({...props}) => <strong className="font-bold" {...props} />,
                                    code: ({...props}) => <code className="bg-card/50 px-1 py-0.5 rounded text-sm" {...props} />,
                                    pre: ({...props}) => <pre className="bg-card/50 p-4 rounded-md overflow-x-auto my-4 text-sm" {...props} />,
                                    blockquote: ({...props}) => <blockquote className="border-l-4 border-primary pl-4 italic my-4" {...props} />,
                                  }}
                                >
                                  {extractMainContent(message.content)}
                                </ReactMarkdown>
                              </div>
                            </motion.div>
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