"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Upload, FileText, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";

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
          // Don't fetch if not authenticated
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
          // Get recent documents (last 5)
          const recent = data.documents.slice(0, 5);
          setRecentDocuments(recent);
          
          // Calculate document stats
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
        <Link href="/auth/signin">
          <Button>Sign In</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        {session && (
          <div className="text-sm">
            Signed in as: <span className="font-medium">{session.user?.email}</span>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded-lg text-red-700 mb-6">
          {error}
        </div>
      )}
      
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/dashboard/upload">
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-medium">Upload Notes</h3>
              <p className="text-sm text-gray-500 mt-1">Upload PDF notes and study materials</p>
            </div>
          </div>
        </Link>
        
        <Link href="/dashboard/documents">
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-medium">Browse Documents</h3>
              <p className="text-sm text-gray-500 mt-1">View and manage your uploaded notes</p>
            </div>
          </div>
        </Link>
        
        <Link href="/dashboard/chat">
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-medium">Universal Chat</h3>
              <p className="text-sm text-gray-500 mt-1">Ask questions about your study materials</p>
            </div>
          </div>
        </Link>
      </div>
      
      {/* Document Statistics */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Document Statistics</h2>
        
        {loading ? (
          <div className="h-20 flex items-center justify-center">
            <p>Loading statistics...</p>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <p className="text-2xl font-bold">{documentStats.total}</p>
              <p className="text-sm text-gray-500">Total Documents</p>
            </div>
            
            {Object.keys(documentStats.bySubject).length > 0 ? (
              <div>
                <h3 className="text-sm font-medium mb-2">Documents by Subject</h3>
                <div className="space-y-2">
                  {Object.entries(documentStats.bySubject).map(([subject, count]) => (
                    <div key={subject} className="flex justify-between items-center">
                      <span>{subject}</span>
                      <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-medium">
                        {count} {count === 1 ? 'document' : 'documents'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No documents have been uploaded yet.</p>
            )}
          </>
        )}
      </div>
      
      {/* Recent Documents */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Recent Documents</h2>
          {recentDocuments.length > 0 && (
            <Link href="/dashboard/documents">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          )}
        </div>
        
        {loading ? (
          <div className="h-20 flex items-center justify-center">
            <p>Loading documents...</p>
          </div>
        ) : recentDocuments.length > 0 ? (
          <div className="space-y-2">
            {recentDocuments.map((doc: any) => (
              <Link key={doc.id} href={`/dashboard/documents/${doc.id}`}>
                <div className="p-3 border rounded-lg hover:bg-gray-50 transition-colors flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{doc.title}</h3>
                    <p className="text-sm text-gray-500">
                      {doc.subject} {doc.course_code ? `• ${doc.course_code}` : ''}
                    </p>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(doc.created_at).toLocaleDateString()}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-500 mb-4">No documents have been uploaded yet.</p>
            <Link href="/dashboard/upload">
              <Button>Upload Your First Document</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
} 