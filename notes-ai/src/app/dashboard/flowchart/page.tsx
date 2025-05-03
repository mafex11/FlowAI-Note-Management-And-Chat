"use client";

import { useEffect, useState } from "react";
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
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// Dynamically import the Canvas component with no SSR
const Canvas = dynamic(() => import("@react-three/fiber").then(mod => mod.Canvas), { ssr: false });
const OrbitControls = dynamic(() => import("@react-three/drei").then(mod => mod.OrbitControls), { ssr: false });
const Text = dynamic(() => import("@react-three/drei").then(mod => mod.Text), { ssr: false });

interface Topic {
  id: string;
  name: string;
  connections: string[];
  position: [number, number, number];
}

interface FlowchartData {
  topics: Topic[];
  connections: {
    from: string;
    to: string;
    strength: number;
  }[];
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

function ConnectionLine({ from, to, strength }: { from: [number, number, number]; to: [number, number, number]; strength: number }) {
  const points = [from, to];
  const color = strength > 0.7 ? "#ffffff" : strength > 0.4 ? "#cccccc" : "#999999";
  
  return (
    <line>
      <bufferGeometry attach="geometry" />
      <lineBasicMaterial color={color} linewidth={strength * 2} />
    </line>
  );
}

function FlowchartScene({ data, selectedTopic, onTopicSelect }: { 
  data: FlowchartData; 
  selectedTopic: string | null;
  onTopicSelect: (id: string) => void;
}) {
  return (
    <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
      
      {/* Render topics */}
      {data.topics.map((topic) => (
        <TopicNode
          key={topic.id}
          topic={topic}
          isSelected={selectedTopic === topic.id}
          onClick={() => onTopicSelect(topic.id)}
        />
      ))}
      
      {/* Render connections */}
      {data.connections.map((connection, index) => (
        <ConnectionLine
          key={index}
          from={data.topics.find(t => t.id === connection.from)?.position || [0, 0, 0]}
          to={data.topics.find(t => t.id === connection.to)?.position || [0, 0, 0]}
          strength={connection.strength}
        />
      ))}
    </Canvas>
  );
}

export default function FlowchartPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [flowchartData, setFlowchartData] = useState<FlowchartData | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  useEffect(() => {
    const fetchFlowchartData = async () => {
      try {
        if (status !== "authenticated") {
          if (status === "unauthenticated") {
            setError("Not authenticated - please sign in");
          }
          return;
        }

        setLoading(true);
        const response = await fetch("/api/flowchart");
        
        if (!response.ok) {
          throw new Error(`Failed to fetch flowchart data: ${response.status}`);
        }
        
        const data = await response.json();
        setFlowchartData(data);
      } catch (error) {
        console.error("Error fetching flowchart data:", error);
        setError("Failed to fetch flowchart data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchFlowchartData();
    }
  }, [status]);

  if (status === "loading") {
    return <div className="p-8 text-center text-white">Loading authentication status...</div>;
  }

  if (status === "unauthenticated") {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-4 text-white">Access Denied</h1>
        <p className="mb-4 text-gray-300">You must be signed in to view this page.</p>
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
                <BreadcrumbPage className="text-foreground">Topic Flowchart</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex-1 p-6 bg-background">
        {error && (
          <div className="bg-destructive/20 p-4 rounded-lg text-destructive mb-6">
            {error}
          </div>
        )}
        
        <div className="h-[calc(100vh-12rem)] bg-card rounded-lg shadow-sm overflow-hidden border border-border">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Generating topic flowchart...</p>
              </div>
            </div>
          ) : flowchartData ? (
            <FlowchartScene 
              data={flowchartData} 
              selectedTopic={selectedTopic}
              onTopicSelect={setSelectedTopic}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-muted-foreground">No flowchart data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 