import mongoose from 'mongoose';
import { zlib } from 'zlib';
import { promisify } from 'util';

const compress = promisify(zlib.gzip);
const decompress = promisify(zlib.gunzip);

interface IMessage {
  role: "user" | "assistant";
  content: string;
  citations?: string[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    citation_tokens: number;
    num_search_queries: number;
    reasoning_tokens: number;
  };
  timestamp: Date;
}

interface IChat {
  userId: string;
  title: string;
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
  metadata: {
    totalTokens: number;
    lastMessageDate: Date;
  };
}

const chatSchema = new mongoose.Schema<IChat>({
  userId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  messages: [{
    role: { type: String, required: true },
    content: { type: String, required: true },
    citations: [String],
    usage: {
      prompt_tokens: Number,
      completion_tokens: Number,
      total_tokens: Number,
      citation_tokens: Number,
      num_search_queries: Number,
      reasoning_tokens: Number
    },
    timestamp: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  metadata: {
    totalTokens: { type: Number, default: 0 },
    lastMessageDate: { type: Date, default: Date.now }
  }
});

// Pre-save middleware to compress message content
chatSchema.pre('save', async function(next) {
  try {
    // Compress each message's content
    for (const message of this.messages) {
      if (message.content) {
        const compressed = await compress(message.content);
        message.content = compressed.toString('base64');
      }
    }
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Method to decompress message content
chatSchema.methods.decompressMessages = async function() {
  const decompressedMessages = [...this.messages];
  for (const message of decompressedMessages) {
    if (message.content) {
      const buffer = Buffer.from(message.content, 'base64');
      message.content = (await decompress(buffer)).toString();
    }
  }
  return decompressedMessages;
};

// Static method to find and decompress chats
chatSchema.statics.findAndDecompress = async function(query: any) {
  const chats = await this.find(query);
  for (const chat of chats) {
    chat.messages = await chat.decompressMessages();
  }
  return chats;
};

export const Chat = mongoose.models.Chat || mongoose.model<IChat>('Chat', chatSchema); 