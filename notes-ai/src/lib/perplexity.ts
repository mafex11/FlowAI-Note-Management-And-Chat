import axios from 'axios';

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

if (!PERPLEXITY_API_KEY) {
  console.warn('Missing PERPLEXITY_API_KEY environment variable');
}

export async function queryPerplexity(
  prompt: string,
  context?: string,
  model: string = 'sonar-pro'
) {
  try {
    console.log(`Calling Perplexity API with model: ${model}`);
    
    const payload = {
      model,
      messages: [
        {
          role: 'system',
          content: context 
            ? `You are a helpful AI assistant specialized in analyzing student notes. Use the following context to answer the question: ${context}`
            : 'You are a helpful AI assistant specialized in analyzing student notes.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1024
    };
    
    console.log('Perplexity API request payload:', JSON.stringify(payload));
    
    const response = await axios.post(
      PERPLEXITY_API_URL,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${PERPLEXITY_API_KEY}`
        }
      }
    );
    
    console.log('Perplexity API response status:', response.status);
    
    if (!response.data.choices || !response.data.choices[0]) {
      console.error('Unexpected API response structure:', response.data);
      throw new Error('Invalid response format from Perplexity API');
    }
    
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error calling Perplexity API:', error);
    if (error.response) {
      console.error('API response:', error.response.data);
      console.error('Status code:', error.response.status);
    }
    throw new Error('Failed to get response from Perplexity AI: ' + (error.message || 'Unknown error'));
  }
}

export async function extractTopicsAndSummarize(text: string) {
  const prompt = `
    Analyze the following student notes. Please do the following:
    1. Identify and list the main topics covered.
    2. Create a brief summary of the content.
    3. Determine the most likely academic subject for these notes (e.g., Mathematics, Physics, Computer Science, etc.)
    4. If possible, determine a course code that might be associated with these notes (e.g., CS101, MATH201, etc.)
    
    Return your response in valid JSON format with the following structure:
    {
      "topics": ["topic1", "topic2", "topic3"],
      "summary": "A concise summary of the notes",
      "subject": "The determined subject",
      "courseCode": "The determined course code or null if not applicable"
    }

    Here are the notes to analyze:
    ${text.substring(0, 8000)} // Limiting text length to avoid token limits
  `;

  try {
    const result = await queryPerplexity(prompt);
    console.log('Raw Perplexity result:', result);
    
    try {
      // Attempt to parse the JSON response
      const parsedResult = JSON.parse(result);
      console.log('Successfully parsed Perplexity result as JSON');
      
      // Ensure the result has the expected structure
      return {
        topics: Array.isArray(parsedResult.topics) ? parsedResult.topics : [],
        summary: parsedResult.summary || 'No summary available',
        subject: parsedResult.subject || 'General',
        courseCode: parsedResult.courseCode || null
      };
    } catch (parseError) {
      console.error('Error parsing Perplexity response:', parseError);
      console.error('Raw response:', result);
      
      // Attempt to extract JSON from the response if it contains non-JSON text
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const extractedJson = JSON.parse(jsonMatch[0]);
          console.log('Successfully extracted and parsed JSON from response');
          
          return {
            topics: Array.isArray(extractedJson.topics) ? extractedJson.topics : [],
            summary: extractedJson.summary || 'No summary available',
            subject: extractedJson.subject || 'General',
            courseCode: extractedJson.courseCode || null
          };
        } catch (secondParseError) {
          console.error('Failed to extract JSON from response');
        }
      }
      
      // Return default values if JSON parsing fails
      return {
        topics: [],
        summary: 'Failed to extract topics and summarize content',
        subject: 'General',
        courseCode: null
      };
    }
  } catch (error) {
    console.error('Error in extractTopicsAndSummarize:', error);
    return {
      topics: [],
      summary: 'Failed to extract topics and summarize content',
      subject: 'General',
      courseCode: null
    };
  }
}

export async function answerQuestion(question: string, documents: any[]) {
  // Combine all relevant documents into context
  const context = documents.map(doc => {
    return `Document title: ${doc.title}\nContent: ${doc.content.substring(0, 1000)}...\n\n`;
  }).join('');

  const prompt = `
    Answer the following question based on the provided documents. 
    If the information isn't in the documents, acknowledge that and provide a general response.
    Cite which document(s) you used for your answer.
    
    Question: ${question}
  `;

  try {
    return await queryPerplexity(prompt, context);
  } catch (error) {
    console.error('Error in answerQuestion:', error);
    return "I'm sorry, I encountered an error while processing your question. Please try again later.";
  }
} 