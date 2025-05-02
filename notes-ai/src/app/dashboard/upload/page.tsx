"use client";

import { useState, useRef, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, X, AlertCircle, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await response.json();
          throw new Error(data.error || "Failed to upload file.");
        } else {
          const text = await response.text();
          console.error("Non-JSON error response:", text);
          throw new Error(`Server error (${response.status}): Failed to upload file.`);
        }
      }
      
      const data = await response.json();
      
      // Redirect to document page
      router.push(`/dashboard/documents/${data.document.id}`);
    } catch (error: any) {
      console.error("Upload error:", error);
      setError(error.message || "An error occurred during upload.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Upload Notes</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6">
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
                Title *
              </label>
              <Input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter document title"
                required
              />
            </div>
            
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                Subject <span className="text-gray-400 font-normal">(Optional - AI will detect)</span>
              </label>
              <Input
                id="subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Mathematics, Physics, Computer Science"
              />
            </div>
            
            <div>
              <label htmlFor="courseCode" className="block text-sm font-medium text-gray-700 mb-1">
                Course Code <span className="text-gray-400 font-normal">(Optional - AI will detect)</span>
              </label>
              <Input
                id="courseCode"
                type="text"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                placeholder="e.g. CS101, MATH201"
              />
            </div>
          </div>
          
          {error && (
            <div className="rounded-md bg-red-50 p-3 flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}
          
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={uploading || !file}
              className="flex items-center"
            >
              {uploading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload & Process
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
      
      <div className="mt-8 bg-yellow-50 rounded-lg p-4 border border-yellow-200">
        <h3 className="font-medium text-yellow-800 mb-2">Processing Information</h3>
        <p className="text-sm text-yellow-700">
          After uploading, your PDF will be processed to extract text, generate summaries, 
          identify key topics, and create a 3D flowchart. Our AI will automatically categorize 
          your document by subject and course code. This may take a few moments depending 
          on the size and complexity of your document.
        </p>
      </div>
    </div>
  );
} 