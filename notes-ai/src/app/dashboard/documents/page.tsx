"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FileText, Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Document {
  id: string;
  title: string;
  subject: string;
  course_code?: string;
  summary: string;
  topics: string[];
  created_at: string;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [allSubjects, setAllSubjects] = useState<string[]>([]);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await fetch("/api/documents");
        const data = await response.json();
        
        if (data.documents) {
          setDocuments(data.documents);
          setFilteredDocuments(data.documents);
          
          // Extract unique subjects
          const subjects = [...new Set(data.documents.map((doc: Document) => doc.subject))];
          setAllSubjects(subjects);
        }
      } catch (error) {
        console.error("Error fetching documents:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  useEffect(() => {
    // Apply filters and search
    let filtered = [...documents];
    
    if (subjectFilter) {
      filtered = filtered.filter(doc => doc.subject === subjectFilter);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(doc => 
        doc.title.toLowerCase().includes(query) ||
        doc.subject.toLowerCase().includes(query) ||
        (doc.course_code && doc.course_code.toLowerCase().includes(query)) ||
        doc.topics.some(topic => topic.toLowerCase().includes(query))
      );
    }
    
    setFilteredDocuments(filtered);
  }, [documents, searchQuery, subjectFilter]);

  const clearFilters = () => {
    setSearchQuery("");
    setSubjectFilter("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">My Documents</h1>
        
        <Link href="/dashboard/upload">
          <Button size="sm" className="shrink-0">
            Upload New Document
          </Button>
        </Link>
      </div>
      
      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, subject, or topic..."
              className="pl-9"
            />
          </div>
          
          <div className="md:w-64">
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">All Subjects</option>
              {allSubjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>
          
          {(searchQuery || subjectFilter) && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center gap-1 md:self-center"
              onClick={clearFilters}
            >
              <X className="h-4 w-4" />
              Clear Filters
            </Button>
          )}
        </div>
        
        {/* Filter stats */}
        <div className="mt-2 text-sm text-gray-500">
          Showing {filteredDocuments.length} of {documents.length} documents
        </div>
      </div>
      
      {/* Documents List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <p>Loading documents...</p>
          </div>
        ) : filteredDocuments.length > 0 ? (
          <div className="divide-y">
            {filteredDocuments.map((doc) => (
              <Link key={doc.id} href={`/dashboard/documents/${doc.id}`}>
                <div className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 mt-1">
                      <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{doc.title}</h3>
                      <p className="text-sm text-gray-500">
                        {doc.subject} {doc.course_code ? `• ${doc.course_code}` : ''}
                      </p>
                      
                      <p className="mt-1 text-sm text-gray-700 line-clamp-2">{doc.summary}</p>
                      
                      <div className="mt-2 flex flex-wrap gap-2">
                        {doc.topics.slice(0, 3).map((topic, i) => (
                          <span 
                            key={i} 
                            className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800"
                          >
                            {topic}
                          </span>
                        ))}
                        {doc.topics.length > 3 && (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                            +{doc.topics.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500 shrink-0">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            {documents.length > 0 ? (
              <div>
                <p className="text-gray-500 mb-4">No documents match your filters.</p>
                <Button variant="outline" onClick={clearFilters} className="flex items-center gap-1">
                  <X className="h-4 w-4" />
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div>
                <p className="text-gray-500 mb-4">You haven't uploaded any documents yet.</p>
                <Link href="/dashboard/upload">
                  <Button>Upload Your First Document</Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 