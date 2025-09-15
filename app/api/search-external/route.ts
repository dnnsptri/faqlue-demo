import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { query } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    // Search the Design on Stock website
    const searchUrl = `https://www.designonstock.com/search?q=${encodeURIComponent(query)}`;
    
    try {
      // Fetch the search results page
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; FAQlue-Bot/1.0)',
        },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(10000), // 10 seconds
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();
      
      // Parse the HTML to extract search results
      const results = parseSearchResults(html, query);
      
      return NextResponse.json({
        success: true,
        query,
        results,
        searchUrl,
        totalResults: results.length
      });

    } catch (fetchError) {
      console.error('External search failed:', fetchError);
      
      // Return a fallback result with just the search URL
      return NextResponse.json({
        success: true,
        query,
        results: [{
          title: `Zoekresultaten voor "${query}"`,
          description: `Bekijk alle resultaten voor "${query}" op de Design on Stock website`,
          url: searchUrl,
          isFallback: true
        }],
        searchUrl,
        totalResults: 1,
        fallback: true
      });
    }

  } catch (error) {
    console.error('Search external error:', error);
    return NextResponse.json(
      { error: "Failed to search external website" },
      { status: 500 }
    );
  }
}

function parseSearchResults(html: string, query: string) {
  const results: Array<{
    title: string;
    description: string;
    url: string;
    isFallback?: boolean;
  }> = [];

  try {
    // Look for common search result patterns
    // This is a simplified parser - you might need to adjust based on the actual website structure
    
    // Look for title links and descriptions
    const titleRegex = /<h[1-6][^>]*>.*?<a[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>.*?<\/h[1-6]>/gi;
    const descriptionRegex = /<p[^>]*class="[^"]*description[^"]*"[^>]*>(.*?)<\/p>/gi;
    
    let match;
    const titles: Array<{url: string, title: string}> = [];
    
    // Extract titles and URLs
    while ((match = titleRegex.exec(html)) !== null) {
      const url = match[1].startsWith('http') ? match[1] : `https://www.designonstock.com${match[1]}`;
      const title = match[2].replace(/<[^>]*>/g, '').trim();
      if (title && title.length > 10) {
        titles.push({ url, title });
      }
    }
    
    // Extract descriptions
    const descriptions: string[] = [];
    while ((match = descriptionRegex.exec(html)) !== null) {
      const description = match[1].replace(/<[^>]*>/g, '').trim();
      if (description && description.length > 20) {
        descriptions.push(description);
      }
    }
    
    // Combine titles with descriptions
    for (let i = 0; i < Math.min(titles.length, 5); i++) {
      const title = titles[i];
      const description = descriptions[i] || `Relevante informatie over ${query} op Design on Stock`;
      
      results.push({
        title: title.title,
        description,
        url: title.url
      });
    }
    
    // If no results found, create a fallback
    if (results.length === 0) {
      results.push({
        title: `Zoekresultaten voor "${query}"`,
        description: `Bekijk alle resultaten voor "${query}" op de Design on Stock website`,
        url: `https://www.designonstock.com/search?q=${encodeURIComponent(query)}`,
        isFallback: true
      });
    }
    
  } catch (parseError) {
    console.error('Error parsing search results:', parseError);
    
    // Fallback result
    results.push({
      title: `Zoekresultaten voor "${query}"`,
      description: `Bekijk alle resultaten voor "${query}" op de Design on Stock website`,
      url: `https://www.designonstock.com/search?q=${encodeURIComponent(query)}`,
      isFallback: true
    });
  }
  
  return results;
}
