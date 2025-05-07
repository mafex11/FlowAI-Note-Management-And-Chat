"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
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
import { Loader2, ChevronDown, ChevronUp, ExternalLink, Send, ChevronLeft, History } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { format } from "date-fns";

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

interface ChatHistory {
  _id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
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
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

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

  // Load chat history
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const res = await fetch('/api/chats');
        if (res.ok) {
          const data = await res.json();
          setChatHistory(data);
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
      }
    };

    loadChatHistory();
  }, []);

  // Save chat when it's complete
  const saveChat = async (messages: Message[]) => {
    try {
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          title: messages[0].content.slice(0, 50) + '...'
        }),
      });

      if (res.ok) {
        const newChat = await res.json();
        setChatHistory(prev => [newChat, ...prev]);
      }
    } catch (error) {
      console.error('Error saving chat:', error);
    }
  };

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
    const updatedMessages = [...messages, { role: "user", content: userMessage }];
    setMessages(updatedMessages);

    // Add AI thinking message
    const thinkingMessage = { 
      role: "assistant", 
      content: "I'm researching and analyzing your request. This may take a moment...",
      animationCompleted: true,
      startTime: Date.now()
    };
    setMessages(prev => [...prev, thinkingMessage]);

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
      
      // Remove the thinking message and add AI response
      const finalMessages = updatedMessages.concat([{
        role: "assistant",
        content: data.choices[0].message.content,
        citations: data.citations,
        usage: data.usage,
        animationCompleted: false
      }]);
      
      setMessages(finalMessages);
      
      // Save the chat
      await saveChat(finalMessages);
    } catch (err) {
      console.error(err);
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

  // Add chat history sidebar
  const renderChatHistory = () => (
    <motion.div
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -300, opacity: 0 }}
      className="fixed left-0 top-16 bottom-0 w-80 bg-card border-r border-border p-4 overflow-y-auto"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Chat History</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsHistoryOpen(false)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-2">
        {chatHistory.map((chat) => (
          <Button
            key={chat._id}
            variant="ghost"
            className="w-full justify-start text-left"
            onClick={() => {
              setMessages(chat.messages);
              setIsHistoryOpen(false);
            }}
          >
            <div className="flex flex-col items-start">
              <span className="font-medium truncate w-full">{chat.title}</span>
              <span className="text-xs text-muted-foreground">
                {format(new Date(chat.updatedAt), 'MMM d, yyyy h:mm a')}
              </span>
            </div>
          </Button>
        ))}
      </div>
    </motion.div>
  );

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
        <div className="ml-auto px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
          >
            <History className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="flex-1 flex flex-col bg-background">
        <AnimatePresence>
          {isHistoryOpen && renderChatHistory()}
        </AnimatePresence>

        {/* Guidelines */}
        {messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="max-w-4xl w-full space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-2">Research Guidelines</h2>
                <p className="text-muted-foreground">Follow these guidelines to get the best research results</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-card/50 rounded-lg p-4 border border-border">
                  <h3 className="text-base font-semibold mb-1">Be Specific and Contextual</h3>
                  <p className="text-sm text-muted-foreground">
                    Provide clear, detailed information about your research topic, including specific aspects you want to explore.
                  </p>
                </div>
                <div className="bg-card/50 rounded-lg p-4 border border-border">
                  <h3 className="text-base font-semibold mb-1">Avoid Few-Shot Prompting</h3>
                  <p className="text-sm text-muted-foreground">
                    Focus on a single, well-defined research question rather than multiple examples or scenarios.
                  </p>
                </div>
                <div className="bg-card/50 rounded-lg p-4 border border-border">
                  <h3 className="text-base font-semibold mb-1">Provide Relevant Context</h3>
                  <p className="text-sm text-muted-foreground">
                    Include important background information, relevant theories, or specific methodologies you want to explore.
                  </p>
                </div>
                <div className="bg-card/50 rounded-lg p-4 border border-border">
                  <h3 className="text-base font-semibold mb-1">Think Like a Professor</h3>
                  <p className="text-sm text-muted-foreground">
                    Frame your questions with academic rigor, considering theoretical frameworks and scholarly perspectives.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chat Messages */}
        <div className={`flex-1 overflow-y-auto p-6 pb-24 ${messages.length === 0 ? 'hidden' : ''}`}>
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
                        className={`bg-card rounded-lg border border-border p-4 w-full ${
                          message.content === "I'm researching and analyzing your request. This may take a moment..."
                            ? "h-auto"
                            : "h-[32rem]"
                        } overflow-y-auto`}
                      >
                        <div className="prose prose-invert max-w-none">
                          {message.content === "I'm researching and analyzing your request. This may take a moment..." ? (
                            <div className="space-y-4 w-full">
                              <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <div className="flex flex-col w-full">
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
                            <motion.div 
                              className="space-y-4"
                              initial={{ height: "auto" }}
                              animate={{ height: "32rem" }}
                              transition={{ duration: 0.5, ease: "easeInOut" }}
                            >
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
                            </motion.div>
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