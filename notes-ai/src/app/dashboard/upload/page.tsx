"use client";

import { useState, useRef, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, X, AlertCircle, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== "application/pdf") {
        setError("Please upload a PDF file.");
        return;
      }
      setFile(selectedFile);
      setError("");
      
      // Auto-fill title from filename if not already set
      if (!title) {
        const filename = selectedFile.name.replace(/\.[^/.]+$/, ""); // Remove extension
        setTitle(filename);
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type !== "application/pdf") {
        setError("Please upload a PDF file.");
        return;
      }
      setFile(droppedFile);
      setError("");
      
      // Auto-fill title from filename if not already set
      if (!title) {
        const filename = droppedFile.name.replace(/\.[^/.]+$/, ""); // Remove extension
        setTitle(filename);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }
    
    if (!title) {
      setError("Please enter a title for your document.");
      return;
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB.");
      return;
    }
    
    setUploading(true);
    setError("");
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    
    // These fields are optional now - AI will detect them
    if (subject) {
      formData.append("subject", subject);
    }
    if (courseCode) {
      formData.append("courseCode", courseCode);
    }
    
    try {
      console.log("Starting upload for file:", file.name, "size:", file.size);
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        console.error("Upload failed with status:", response.status);
        
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await response.json();
          console.error("Error response data:", data);
          
          // Display a more user-friendly error
          let errorMessage = data.error || "Failed to upload file.";
          
          // Format specific error messages
          if (errorMessage.includes("Cloudinary")) {
            errorMessage = "Failed to upload to storage. Please try again later.";
          } else if (errorMessage.includes("PDF parsing failed")) {
            errorMessage = "We couldn't process this PDF file. The file might be password-protected, corrupted, or in an unsupported format.";
          } else if (errorMessage.includes("max_file_size")) {
            errorMessage = "The file is too large. Please upload a file smaller than 10MB.";
          }
          
          throw new Error(errorMessage);
        } else {
          const text = await response.text();
          console.error("Non-JSON error response:", text);
          throw new Error(`Server error (${response.status}): Failed to upload file.`);
        }
      }
      
      const data = await response.json();
      console.log("Upload successful, document ID:", data.document.id);
      
      // Redirect to document page
      router.push(`/dashboard/documents/${data.document.id}`);
    } catch (error: unknown) {
      console.error("Upload error:", error);
      
      // Provide more helpful error messages based on error type
      let errorMessage = error instanceof Error ? error.message : "An error occurred during upload.";
      
      // Common error scenarios and better messages
      if (errorMessage.includes("NetworkError") || errorMessage.includes("Failed to fetch")) {
        errorMessage = "Network error: Please check your internet connection and try again.";
      } else if (errorMessage.includes("CORS")) {
        errorMessage = "Security error: Your browser blocked the upload request.";
      } else if (errorMessage.includes("timeout") || errorMessage.includes("timed out")) {
        errorMessage = "Upload timed out: The file may be too large or the server is busy.";
      } else if (errorMessage.includes("500")) {
        errorMessage = "Server error: The upload server encountered a problem. Please try again later.";
      }
      
      setError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-white">
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
                <BreadcrumbPage>Upload Notes</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex-1 p-6 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* File Upload Area */}
              <div 
                className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                  isDragging 
                    ? 'border-primary bg-primary/5' 
                    : file 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-300 hover:border-primary hover:bg-gray-50'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf"
                  className="hidden"
                />
                
                {file ? (
                  <div className="flex flex-col items-center">
                    <div className="flex items-center mb-2">
                      <FileText className="h-12 w-12 text-green-500" />
                      <button 
                        type="button" 
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile();
                        }}
                        className="ml-2 p-1 rounded-full hover:bg-gray-200"
                      >
                        <X className="h-4 w-4 text-gray-500" />
                      </button>
                    </div>
                    <p className="font-medium text-green-600">{file.name}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <>
                    <Upload className="h-12 w-12 text-gray-400 mb-2" />
                    <p className="font-medium text-gray-700">
                      Drag & drop your PDF file here
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      or click to browse your files
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      Only PDF files are supported
                    </p>
                  </>
                )}
              </div>
              
              {/* AI Detection Note */}
              <div className="flex items-start p-3 bg-blue-50 rounded-lg border border-blue-200">
                <Brain className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <p className="text-sm text-blue-700">
                    <span className="font-medium">AI-powered detection:</span> Our system will automatically detect the subject and course code from your document content.
                    The fields below are optional - you can provide them if you want to override the AI detection.
                  </p>
                </div>
              </div>
              
              {/* Document Details */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    Document Title
                  </label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter document title"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                      Subject (Optional)
                    </label>
                    <Input
                      id="subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g., Mathematics"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="courseCode" className="block text-sm font-medium text-gray-700 mb-1">
                      Course Code (Optional)
                    </label>
                    <Input
                      id="courseCode"
                      value={courseCode}
                      onChange={(e) => setCourseCode(e.target.value)}
                      placeholder="e.g., MATH101"
                    />
                  </div>
                </div>
              </div>
              
              {error && (
                <div className="flex items-center p-3 bg-red-50 rounded-lg border border-red-200">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
              
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={uploading || !file}
                  className="min-w-[120px]"
                >
                  {uploading ? "Uploading..." : "Upload"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 