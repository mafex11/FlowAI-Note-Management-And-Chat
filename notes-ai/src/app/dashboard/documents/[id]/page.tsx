"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Html, Text, Line } from "@react-three/drei";
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

interface TopicNode {
  name: string;
  position: [number, number, number];
  connections: number[];
}

// Function to calculate 3D positions for topics
function calculateTopicPositions(topics: string[]): TopicNode[] {
  const nodes: TopicNode[] = [];
  const numTopics = topics.length;
  
  // Position topics in a 3D space
  for (let i = 0; i < numTopics; i++) {
    // Calculate position on a sphere
    const phi = Math.acos(-1 + (2 * i) / numTopics);
    const theta = Math.sqrt(numTopics * Math.PI) * phi;
    
    const x = 5 * Math.sin(phi) * Math.cos(theta);
    const y = 5 * Math.sin(phi) * Math.sin(theta);
    const z = 5 * Math.cos(phi);
    
    nodes.push({
      name: topics[i],
      position: [x, y, z],
      connections: []
    });
  }
  
  // Create connections between topics (connections are represented as indices)
  for (let i = 0; i < numTopics; i++) {
    // Connect to 2-3 nearby nodes for a more meaningful graph
    const numConnections = Math.min(2 + Math.floor(Math.random() * 2), numTopics - 1);
    
    const potentialConnections = Array.from({length: numTopics}, (_, idx) => idx)
      .filter(idx => idx !== i)
      .sort(() => Math.random() - 0.5)
      .slice(0, numConnections);
    
    nodes[i].connections = potentialConnections;
  }
  
  return nodes;
}

// 3D Topic Node component
function TopicNode({ node, selected, onClick }: { 
  node: TopicNode, 
  selected: boolean,
  onClick: () => void
}) {
  return (
    <group position={node.position}>
      <Suspense fallback={null}>
        <Html>
          <div 
            className={`px-3 py-1.5 rounded-full text-sm font-medium shadow-lg cursor-pointer transition-all 
              ${selected ? 'bg-primary text-white scale-110' : 'bg-white text-gray-800 hover:bg-gray-100'}`}
            onClick={onClick}
          >
            {node.name}
          </div>
        </Html>
      </Suspense>
    </group>
  );
}

// Connection Line component
function ConnectionLine({ start, end, selected }: { 
  start: [number, number, number], 
  end: [number, number, number],
  selected: boolean
}) {
  return (
    <Line
      points={[start, end]}
      color={selected ? "#2563eb" : "#d1d5db"}
      lineWidth={selected ? 2 : 1}
    />
  );
}

// Main 3D graph component
function TopicGraph({ topics }: { topics: string[] }) {
  const [nodes, setNodes] = useState<TopicNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<number | null>(null);
  
  useEffect(() => {
    if (topics.length > 0) {
      setNodes(calculateTopicPositions(topics));
    }
  }, [topics]);
  
  return (
    <Canvas camera={{ position: [0, 0, 15], fov: 60 }}>
      <ambientLight intensity={0.8} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      
      {/* Nodes */}
      {nodes.map((node, i) => (
        <TopicNode 
          key={i} 
          node={node} 
          selected={selectedNode === i}
          onClick={() => setSelectedNode(selectedNode === i ? null : i)} 
        />
      ))}
      
      {/* Connections */}
      {nodes.map((node, i) => (
        node.connections.map((connectedIdx, j) => (
          <ConnectionLine 
            key={`${i}-${j}`} 
            start={node.position} 
            end={nodes[connectedIdx].position} 
            selected={selectedNode === i || selectedNode === connectedIdx}
          />
        ))
      ))}
      
      {/* Controls */}
      <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
    </Canvas>
  );
}

export default function DocumentDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [document, setDocument] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'topics' | 'content'>('summary');
  
  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const response = await fetch(`/api/documents/${params.id}`);
        
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
  }, [params.id]);
  
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
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/documents">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">{document.title}</h1>
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
            className="flex items-center gap-1 text-red-500 hover:text-red-700 hover:bg-red-50"
            onClick={() => setShowDeleteModal(true)}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>
      
      {/* Document metadata */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-700">
              {document.subject} {document.course_code ? `• ${document.course_code}` : ''}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-700">
              Uploaded on {new Date(document.created_at).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-gray-500" />
            <div className="flex flex-wrap gap-1">
              {document.topics.slice(0, 3).map((topic, i) => (
                <span 
                  key={i} 
                  className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800"
                >
                  {topic}
                </span>
              ))}
              {document.topics.length > 3 && (
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">
                  +{document.topics.length - 3} more
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* 3D Flowchart */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Topic Connections</h2>
          <p className="text-sm text-gray-500">Interactive 3D visualization of topics and their relationships</p>
        </div>
        
        <div className="h-96 w-full bg-gray-50">
          {document.topics.length > 0 ? (
            <TopicGraph topics={document.topics} />
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-500">No topics available for visualization</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Document Content Tabs */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="border-b flex">
          <button
            className={`px-4 py-3 text-sm font-medium flex-1 text-center ${
              activeTab === 'summary'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('summary')}
          >
            Summary
          </button>
          <button
            className={`px-4 py-3 text-sm font-medium flex-1 text-center ${
              activeTab === 'topics'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('topics')}
          >
            Topics
          </button>
          <button
            className={`px-4 py-3 text-sm font-medium flex-1 text-center ${
              activeTab === 'content'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('content')}
          >
            Content
          </button>
        </div>
        
        <div className="p-6">
          {activeTab === 'summary' && (
            <div className="prose max-w-none">
              <p>{document.summary}</p>
            </div>
          )}
          
          {activeTab === 'topics' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Key topics extracted from your document:
              </p>
              <div className="flex flex-wrap gap-2">
                {document.topics.map((topic, i) => (
                  <span 
                    key={i} 
                    className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-800"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {activeTab === 'content' && (
            <div className="prose max-w-none">
              <pre className="text-sm bg-gray-50 p-4 rounded-md overflow-auto max-h-96 whitespace-pre-wrap">
                {document.content}
              </pre>
            </div>
          )}
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Delete Document</h3>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8" 
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <p className="mb-6">Are you sure you want to delete "{document.title}"? This action cannot be undone.</p>
            
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
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 