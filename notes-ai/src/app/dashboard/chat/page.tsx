"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Send, 
  FileText, 
  Bot, 
  User, 
  Search,
  RefreshCw,
  X 
} from "lucide-react";

interface Document {
  id: string;
  title: string;
  subject: string;
  course_code?: string;
}

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export default function ChatPage() {
  const searchParams = useSearchParams();
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [sending, setSending] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Get the document ID from the URL query parameter
  useEffect(() => {
    const documentId = searchParams.get("documentId");
    if (documentId) {
      setSelectedDocuments([documentId]);
    }
  }, [searchParams]);
  
  // Fetch all documents
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await fetch("/api/documents");
        const data = await response.json();
        
        if (data.documents) {
          setDocuments(data.documents);
        }
      } catch (error) {
        console.error("Error fetching documents:", error);
      }
    };

    fetchDocuments();
  }, []);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const filteredDocuments = documents.filter((doc) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      doc.title.toLowerCase().includes(query) ||
      doc.subject.toLowerCase().includes(query) ||
      (doc.course_code && doc.course_code.toLowerCase().includes(query))
    );
  });

  const toggleDocumentSelection = (docId: string) => {
    if (selectedDocuments.includes(docId)) {
      setSelectedDocuments(selectedDocuments.filter(id => id !== docId));
    } else {
      setSelectedDocuments([...selectedDocuments, docId]);
    }
  };

  const clearDocumentSelection = () => {
    setSelectedDocuments([]);
  };

  const handleSendMessage = async () => {
    if (!question.trim()) return;
    
    // Create a new message from the user
    const userMessage: Message = {
      id: Date.now().toString(),
      content: question,
      role: 'user',
      timestamp: new Date(),
    };
    
    // Add user message to chat
    setMessages((prev) => [...prev, userMessage]);
    
    // Clear input field
    setQuestion("");
    
    // Set loading state
    setSending(true);
    
    try {
      // Call the chat API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: userMessage.content,
          specificDocumentIds: selectedDocuments.length > 0 ? selectedDocuments : undefined,
        }),
      });
      
      const data = await response.json();
      
      // Create assistant message
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.answer,
        role: 'assistant',
        timestamp: new Date(),
      };
      
      // Add assistant message to chat
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, there was an error processing your question. Please try again.",
        role: 'assistant',
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <h1 className="text-2xl font-bold mb-4">Universal Chat</h1>
      
      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Document Selector */}
        <div className="w-64 bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
          <div className="p-3 border-b">
            <h3 className="text-sm font-medium">Your Documents</h3>
            <p className="text-xs text-gray-500">Select documents to include in your chat context</p>
          </div>
          
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documents"
                className="pl-8 h-8 text-sm"
              />
            </div>
          </div>
          
          {selectedDocuments.length > 0 && (
            <div className="p-3 border-b bg-primary/5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">{selectedDocuments.length} selected</span>
                <button 
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                  onClick={clearDocumentSelection}
                >
                  <X className="h-3 w-3" />
                  Clear
                </button>
              </div>
            </div>
          )}
          
          <div className="flex-1 overflow-y-auto">
            {filteredDocuments.length > 0 ? (
              <div className="divide-y">
                {filteredDocuments.map((doc) => (
                  <div 
                    key={doc.id}
                    className={`p-3 hover:bg-gray-50 cursor-pointer ${
                      selectedDocuments.includes(doc.id) ? 'bg-primary/5' : ''
                    }`}
                    onClick={() => toggleDocumentSelection(doc.id)}
                  >
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5">
                        <div className={`h-4 w-4 rounded border flex items-center justify-center ${
                          selectedDocuments.includes(doc.id) 
                            ? 'bg-primary border-primary text-white' 
                            : 'border-gray-300'
                        }`}>
                          {selectedDocuments.includes(doc.id) && (
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{doc.title}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {doc.subject} {doc.course_code ? `• ${doc.course_code}` : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center">
                <p className="text-sm text-gray-500">No documents found</p>
              </div>
            )}
          </div>
          
          {documents.length === 0 && (
            <div className="p-4 text-center border-t">
              <p className="text-sm text-gray-500 mb-2">No documents yet</p>
              <Link href="/dashboard/upload">
                <Button size="sm" className="w-full">Upload a Document</Button>
              </Link>
            </div>
          )}
        </div>
        
        {/* Chat Area */}
        <div className="flex-1 bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <Bot className="h-12 w-12 text-primary/20 mb-4" />
                <h3 className="text-lg font-medium mb-2">Ask anything about your notes</h3>
                <p className="text-gray-500 max-w-md mb-6">
                  The AI will search through your selected documents and provide relevant answers
                  based on your study materials.
                </p>
                
                <div className="space-y-2 text-left w-full max-w-md">
                  <p className="text-sm font-medium">Try asking:</p>
                  <button
                    className="w-full text-left p-3 rounded-md border hover:bg-gray-50 text-sm"
                    onClick={() => {
                      setQuestion("What are the main topics covered in my notes?");
                      setTimeout(handleSendMessage, 100);
                    }}
                  >
                    What are the main topics covered in my notes?
                  </button>
                  <button
                    className="w-full text-left p-3 rounded-md border hover:bg-gray-50 text-sm"
                    onClick={() => {
                      setQuestion("Explain the concept of [specific topic] in simple terms");
                      setTimeout(() => setQuestion(""), 100);
                    }}
                  >
                    Explain the concept of [specific topic] in simple terms
                  </button>
                  <button
                    className="w-full text-left p-3 rounded-md border hover:bg-gray-50 text-sm"
                    onClick={() => {
                      setQuestion("What are the connections between [topic A] and [topic B]?");
                      setTimeout(() => setQuestion(""), 100);
                    }}
                  >
                    What are the connections between [topic A] and [topic B]?
                  </button>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === 'user'
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {message.role === 'user' ? (
                          <>
                            <span className="text-xs font-medium">You</span>
                            <User className="h-3 w-3" />
                          </>
                        ) : (
                          <>
                            <Bot className="h-3 w-3" />
                            <span className="text-xs font-medium">NotesAI</span>
                          </>
                        )}
                      </div>
                      <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                      <div className="mt-1 text-xs opacity-70 text-right">
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
          
          {/* Input Area */}
          <div className="p-3 border-t">
            <div className="flex gap-2">
              <Input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  selectedDocuments.length > 0
                    ? "Ask a question about your selected documents..."
                    : "Ask a question about all your documents..."
                }
                disabled={sending}
                className="flex-1"
              />
              <Button
                type="button"
                onClick={handleSendMessage}
                disabled={!question.trim() || sending}
                className="shrink-0"
              >
                {sending ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            <div className="mt-2 text-xs text-gray-500">
              {selectedDocuments.length > 0 ? (
                <span>
                  Answering based on {selectedDocuments.length} selected document
                  {selectedDocuments.length !== 1 ? 's' : ''}
                </span>
              ) : (
                <span>Answering based on all your documents</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 