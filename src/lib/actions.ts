'use server';

interface FetchResult {
  success: boolean;
  data: string | null;
  error: string | null;
}

export async function fetchUrlContent(url: string): Promise<FetchResult> {
  try {
    const response = await fetch(url, {
        headers: {
            'User-Agent': 'ResponseParser/1.0',
            'Accept': '*/*'
        }
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}: ${response.statusText}`);
    }

    const data = await response.text();
    return { success: true, data, error: null };
  } catch (error) {
    if (error instanceof Error) {
        if (error.message.includes('fetch failed')) {
            return { success: false, data: null, error: `Could not resolve host: ${url}. Please check the URL and your network connection.` };
        }
      return { success: false, data: null, error: error.message };
    }
    return { success: false, data: null, error: 'An unknown error occurred during fetch.' };
  }
}
