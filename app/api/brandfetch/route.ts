import { NextRequest, NextResponse } from 'next/server';

const BRANDFETCH_API_URL = 'https://api.brandfetch.io/v2/brands';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const domain = searchParams.get('domain');

  if (!domain) {
    return NextResponse.json(
      { error: 'Domain parameter is required' },
      { status: 400 }
    );
  }

  const apiKey = process.env.NEXT_PUBLIC_BRANDFETCH_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Brandfetch API key is not configured' },
      { status: 500 }
    );
  }

  try {
    // Clean the input - if it looks like a domain, use it; otherwise try adding .com
    let searchDomain = domain.trim().toLowerCase();

    // If it doesn't contain a dot, it's probably a company name, try adding .com
    if (!searchDomain.includes('.')) {
      // Remove spaces and special characters for company names
      searchDomain = searchDomain.replace(/\s+/g, '') + '.com';
    }

    // Remove protocol if present
    searchDomain = searchDomain.replace(/^https?:\/\//, '').replace(/^www\./, '');

    console.log(`Searching for domain: ${searchDomain}`);

    const response = await fetch(`${BRANDFETCH_API_URL}/${searchDomain}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: `Brand not found for "${domain}". Try using the exact company domain (e.g., apple.com, nike.com)` },
          { status: 404 }
        );
      }
      if (response.status === 400) {
        return NextResponse.json(
          { error: `Invalid domain format. Please enter a valid domain like "apple.com" or company name like "apple"` },
          { status: 400 }
        );
      }
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'Invalid API key. Please check your Brandfetch API key in settings.' },
          { status: 401 }
        );
      }
      throw new Error(`Brandfetch API error: ${response.status}`);
    }

    const data = await response.json();

    // Process and structure the response
    const processedData = {
      name: data.name || domain,
      domain: data.domain || domain,
      description: data.description,
      logos: data.logos || [],
      colors: data.colors || [],
      fonts: data.fonts || [],
    };

    return NextResponse.json(processedData);
  } catch (error) {
    console.error('Brandfetch API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch brand data' },
      { status: 500 }
    );
  }
}