"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

interface DocumentStats {
  total: number;
  bySubject: {
    [key: string]: number;
  };
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [recentDocuments, setRecentDocuments] = useState([]);
  const [documentStats, setDocumentStats] = useState<DocumentStats>({
    total: 0,
    bySubject: {},
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Log session status
    console.log("Dashboard - Session status:", status);
    console.log("Dashboard - Session data:", session);
  }, [session, status]);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        if (status !== "authenticated") {
          if (status === "unauthenticated") {
            setError("Not authenticated - please sign in");
          }
          return;
        }

        setLoading(true);
        const response = await fetch("/api/documents");
        
        if (!response.ok) {
          throw new Error(`Failed to fetch documents: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.documents) {
          const recent = data.documents.slice(0, 5);
          setRecentDocuments(recent);
          
          const stats: DocumentStats = {
            total: data.documents.length,
            bySubject: {},
          };
          
          data.documents.forEach((doc: any) => {
            if (stats.bySubject[doc.subject]) {
              stats.bySubject[doc.subject]++;
            } else {
              stats.bySubject[doc.subject] = 1;
            }
          });
          
          setDocumentStats(stats);
        }
      } catch (error) {
        console.error("Error fetching documents:", error);
        setError("Failed to fetch documents. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchDocuments();
    }
  }, [status, session]);

  if (status === "loading") {
    return <div className="p-8 text-center">Loading authentication status...</div>;
  }

  if (status === "unauthenticated") {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="mb-4">You must be signed in to view this page.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-black">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard">
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Overview</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex-1 p-6 bg-black">
        {error && (
          <div className="bg-red-50 p-4 rounded-lg text-red-700 mb-6">
            {error}
          </div>
        )}
        
        {/* Document Statistics */}
        <div className="grid auto-rows-min gap-4 md:grid-cols-3 mb-6">
          <div className="p-6 rounded-xl bg-red shadow-sm">
            <h3 className="text-lg font-semibold mb-2">Total Documents</h3>
            <p className="text-3xl font-bold">{documentStats.total}</p>
          </div>
          <div className="p-6 rounded-xl bg-white shadow-sm">
            <h3 className="text-lg font-semibold mb-2">Subjects</h3>
            <p className="text-3xl font-bold">{Object.keys(documentStats.bySubject).length}</p>
          </div>
          <div className="p-6 rounded-xl bg-white shadow-sm">
            <h3 className="text-lg font-semibold mb-2">Recent Activity</h3>
            <p className="text-3xl font-bold">{recentDocuments.length}</p>
          </div>
        </div>

        {/* Recent Documents */}
        <div className="rounded-xl bg-white shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Documents</h2>
          {loading ? (
            <div className="h-20 flex items-center justify-center">
              <p>Loading documents...</p>
            </div>
          ) : recentDocuments.length > 0 ? (
            <div className="space-y-4">
              {recentDocuments.map((doc: any) => (
                <div key={doc.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <h3 className="font-medium">{doc.title}</h3>
                  <p className="text-sm text-gray-500">
                    {doc.subject} {doc.course_code ? `• ${doc.course_code}` : ''}
                  </p>
                  <p className="mt-1 text-sm text-gray-700">{doc.summary}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {doc.topics.slice(0, 3).map((topic: string, i: number) => (
                      <span 
                        key={i} 
                        className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500 mb-4">No documents have been uploaded yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 