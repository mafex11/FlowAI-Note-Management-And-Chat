import mongoose, { Schema, Document } from 'mongoose';

export interface IDocument extends Document {
  title: string;
  content: string;
  original_text: string;
  user: mongoose.Types.ObjectId;
  file_url: string;
  cloudinary_id: string;
  subject: string;
  course_code?: string;
  summary: string;
  topics: string[];
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema<IDocument>({
  title: { 
    type: String, 
    required: true,
    trim: true
  },
  content: { 
    type: String, 
    required: true 
  },
  original_text: {
    type: String,
    required: true
  },
  user: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  file_url: {
    type: String,
    required: true
  },
  cloudinary_id: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  course_code: {
    type: String,
    trim: true
  },
  summary: {
    type: String,
    required: true
  },
  topics: [{
    type: String,
    required: true
  }],
}, {
  timestamps: true
});

export default mongoose.models.Document || mongoose.model<IDocument>('Document', DocumentSchema); 