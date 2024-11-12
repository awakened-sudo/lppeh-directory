// src/app/api/firms/route.ts
import { NextResponse } from 'next/server';
import { searchFirms, scrapeAllStates } from '@/lib/scraper';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state');
    
    if (!state) {
      // If no state provided, return all firms
      const { firms, errors } = await scrapeAllStates();
      return NextResponse.json({
        firms,
        errors,
        total: firms.length,
        timestamp: new Date().toISOString()
      });
    }

    // Search for specific state
    const firms = await searchFirms(state);
    
    return NextResponse.json({
      firms,
      total: firms.length,
      timestamp: new Date().toISOString(),
      state
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch firms data',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}