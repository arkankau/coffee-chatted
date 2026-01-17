/**
 * AI Client wrapper for making JSON-only API calls
 * Uses OpenAI-compatible API endpoints
 */

const API_KEY = import.meta.env.VITE_AI_API_KEY;
const API_BASE = import.meta.env.VITE_AI_API_BASE || 'https://api.openai.com/v1';

export function hasAIKey(): boolean {
  return !!API_KEY && API_KEY.trim().length > 0;
}

export function getAPIKey(): string | null {
  return API_KEY || null;
}

/**
 * Extracts first JSON object from text by finding matching braces
 */
function extractJSON(text: string): string | null {
  const trimmed = text.trim();
  
  // Find first {
  const startIdx = trimmed.indexOf('{');
  if (startIdx === -1) return null;
  
  // Find matching closing brace
  let depth = 0;
  let inString = false;
  let escapeNext = false;
  
  for (let i = startIdx; i < trimmed.length; i++) {
    const char = trimmed[i];
    
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    
    if (char === '\\') {
      escapeNext = true;
      continue;
    }
    
    if (char === '"') {
      inString = !inString;
      continue;
    }
    
    if (inString) continue;
    
    if (char === '{') {
      depth++;
    } else if (char === '}') {
      depth--;
      if (depth === 0) {
        return trimmed.substring(startIdx, i + 1);
      }
    }
  }
  
  return null;
}

/**
 * Calls AI API with a user prompt and expects JSON response
 * @param prompt - User prompt requesting JSON output
 * @returns Parsed JSON object or throws error
 */
export async function callAIJson(prompt: string): Promise<any> {
  if (!hasAIKey()) {
    throw new Error('AI API key not configured');
  }

  console.log('--- AI API CALL START ---');
  console.log('Model:', import.meta.env.VITE_AI_MODEL || 'gpt-4o-mini');
  console.log('Prompt length:', prompt.length);

  try {
    const response = await fetch(`${API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: import.meta.env.VITE_AI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error('AI API Error Response:', errorText);
      throw new Error(`AI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('AI API Response Status:', response.status);
    
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error('AI API Response empty content');
      throw new Error('AI API returned no content');
    }

    console.log('AI Response Content:', content);

    // Try to parse JSON directly first
    let jsonText = content.trim();
    
    // If wrapped in markdown code blocks, extract
    if (jsonText.startsWith('```')) {
      const lines = jsonText.split('\n');
      const startLine = lines.findIndex((l: string) => l.includes('{'));
      const endLine = lines.findLastIndex((l: string) => l.includes('}'));
      if (startLine >= 0 && endLine >= startLine) {
        jsonText = lines.slice(startLine, endLine + 1).join('\n');
      }
    }
    
    // Extract first JSON object if needed
    const extracted = extractJSON(jsonText);
    const finalText = extracted || jsonText;
    
    const parsed = JSON.parse(finalText);
    console.log('--- AI API CALL SUCCESS ---');
    return parsed;
  } catch (error) {
    console.error('--- AI API CALL FAILED ---');
    console.error(error);
    throw error;
  }
}
