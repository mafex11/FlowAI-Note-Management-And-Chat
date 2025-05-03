"use client";

import { useState, useEffect, useRef, Suspense, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  ArrowLeft, 
  Download, 
  Trash2, 
  MessageSquare,
  Info,
  Tag,
  X
} from "lucide-react";

// Dynamically import R3F components with SSR disabled and no suspense
const Canvas = dynamic(() => import("@react-three/fiber").then(mod => mod.Canvas), { 
  ssr: false,
  loading: () => <div className="h-full flex items-center justify-center">Loading visualization...</div>
});
const OrbitControls = dynamic(() => import("@react-three/drei").then(mod => mod.OrbitControls), { ssr: false });
const Text = dynamic(() => import("@react-three/drei").then(mod => mod.Text), { ssr: false });
const Line = dynamic(() => import("@react-three/drei").then(mod => mod.Line), { ssr: false });

interface DocumentData {
  id: string;
  title: string;
  subject: string;
  course_code?: string;
  summary: string;
  topics: string[];
  content: string;
  file_url: string;
  created_at: string;
}

// Separate component for the 3D scene
function FlowchartScene({ topics }: { topics: string[] }) {
  return (
    <Canvas camera={{ position: [0, 0, 5] }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <OrbitControls />
      {topics.map((topic, index) => (
        <group key={index} position={[index * 2 - (topics.length - 1), 0, 0]}>
          <Text
            position={[0, 0, 0]}
            fontSize={0.5}
            color="black"
            anchorX="center"
            anchorY="middle"
          >
            {topic}
          </Text>
        </group>
      ))}
    </Canvas>
  );
}

function TopicNode({ topic, isSelected, onClick }: { topic: Topic; isSelected: boolean; onClick: () => void }) {
  return (
    <group position={topic.position} onClick={onClick}>
      <mesh>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color={isSelected ? "#ffffff" : "#666666"} />
      </mesh>
      <Text
        position={[0, 0.8, 0]}
        fontSize={0.3}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        {topic.name}
      </Text>
    </group>
  );
}

export default function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const [document, setDocument] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'topics' | 'content'>('summary');
  
  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const response = await fetch(`/api/documents/${resolvedParams.id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch document');
        }
        
        const data = await response.json();
        setDocument(data.document);
      } catch (error) {
        console.error('Error fetching document:', error);
        setError('Failed to load document. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDocument();
  }, [resolvedParams.id]);
  
  const handleDelete = async () => {
    if (!document) return;
    
    setDeleting(true);
    
    try {
      const response = await fetch(`/api/documents/${document.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete document');
      }
      
      router.push('/dashboard/documents');
    } catch (error) {
      console.error('Error deleting document:', error);
      setError('Failed to delete document. Please try again.');
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <p>Loading document...</p>
      </div>
    );
  }
  
  if (error || !document) {
    return (
      <div className="h-96 flex flex-col items-center justify-center">
        <p className="text-red-500 mb-4">{error || 'Document not found'}</p>
        <Link href="/dashboard/documents">
          <Button variant="outline">Back to Documents</Button>
        </Link>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 bg-background">
      {/* Header with actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/documents">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">{document.title}</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <a href={document.file_url} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Download className="h-4 w-4" />
              Download
            </Button>
          </a>
          <Link href={`/dashboard/chat?documentId=${document.id}`}>
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              Chat
            </Button>
          </Link>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => setShowDeleteModal(true)}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>
      
      {/* Document metadata */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {document.subject} {document.course_code ? `• ${document.course_code}` : ''}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Uploaded on {new Date(document.created_at).toLocaleDateString()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-muted-foreground" />
          <div className="flex flex-wrap gap-1">
            {document.topics.slice(0, 3).map((topic, i) => (
              <span 
                key={i} 
                className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground"
              >
                {topic}
              </span>
            ))}
            {document.topics.length > 3 && (
              <span className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                +{document.topics.length - 3} more
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* 3D Flowchart */}
      <div className="h-[400px] bg-card rounded-lg shadow-sm border border-border">
        <Suspense fallback={<div className="h-full flex items-center justify-center text-muted-foreground">Loading visualization...</div>}>
          <FlowchartScene topics={document.topics} />
        </Suspense>
      </div>
      
      {/* Content Tabs */}
      <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
        <div className="flex gap-4 mb-6">
          <Button
            variant={activeTab === 'summary' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('summary')}
          >
            Summary
          </Button>
          <Button
            variant={activeTab === 'topics' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('topics')}
          >
            Topics
          </Button>
          <Button
            variant={activeTab === 'content' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('content')}
          >
            Content
          </Button>
        </div>
        
        <div className="prose prose-invert max-w-none">
          {activeTab === 'summary' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Summary</h2>
              <p className="text-muted-foreground">{document.summary}</p>
            </div>
          )}
          
          {activeTab === 'topics' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Topics</h2>
              <div className="flex flex-wrap gap-2">
                {document.topics.map((topic, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {activeTab === 'content' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Content</h2>
              <div className="whitespace-pre-wrap text-muted-foreground">
                {document.content}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 max-w-md w-full mx-4 border border-border">
            <h3 className="text-lg font-semibold mb-2 text-foreground">Delete Document</h3>
            <p className="text-muted-foreground mb-4">
              Are you sure you want to delete this document? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 