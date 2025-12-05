import { NextRequest, NextResponse } from 'next/server';
import { verifyEvent, Event } from 'nostr-tools';
import { getSessionFromRequest } from '@/lib/auth/session';
import { publishEvent, subscribeToEvents } from '@/lib/nostr/relay';
import { transformEventToItem, sortItemsByDate, StructuredContentItem } from '@/lib/nostr/events';

// POST - Create/update structured content
// Accepts a signed event from the client
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { 
          error: 'UNAUTHORIZED',
          message: 'You must be logged in to publish content.'
        },
        { status: 401 }
      );
    }

    const { event } = await request.json();

    if (!event) {
      return NextResponse.json(
        { error: 'Event is required' },
        { status: 400 }
      );
    }

    // Verify event signature
    if (!verifyEvent(event)) {
      return NextResponse.json(
        { error: 'Invalid event signature' },
        { status: 400 }
      );
    }

    // Verify event author matches authenticated user
    if (event.pubkey !== session.publicKey) {
      return NextResponse.json(
        { error: 'Event author does not match authenticated user' },
        { status: 403 }
      );
    }

    // Verify event kind is structured content (30000)
    if (event.kind !== 30000) {
      return NextResponse.json(
        { error: 'Invalid event kind. Expected 30000 (structured content)' },
        { status: 400 }
      );
    }

    // Extract name from d tag
    const name = transformEventToItem(event).name;

    // Publish to Nostr relay
    await publishEvent(event);

    // Return success response
    return NextResponse.json({
      success: true,
      id: event.id,
      name,
      content: event.content,
      createdAt: new Date(event.created_at * 1000).toISOString(),
    });
  } catch (error) {
    console.error('Error creating structured content:', error);
    
    // Return more specific error message
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Failed to create structured content';
    
    return NextResponse.json(
      { 
        error: 'FAILED_TO_PUBLISH',
        message: errorMessage 
      },
      { status: 500 }
    );
  }
}

// GET - Fetch structured content
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name'); // Optional: filter by name

    // Check authentication
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { 
          error: 'UNAUTHORIZED',
          message: 'You must be logged in to fetch content.'
        },
        { status: 401 }
      );
    }

    const publicKey = session.publicKey;

    // Build filter
    const filter: {
      kinds: number[];
      authors: string[];
      '#d'?: string[];
    } = {
      kinds: [30000],
      authors: [publicKey],
    };

    // If name specified, filter by d tag
    if (name) {
      filter['#d'] = [name];
    }

    // Fetch from Nostr relay
    const items = await subscribeToEvents(filter, transformEventToItem);
    const sortedItems = sortItemsByDate(items);

    return NextResponse.json({ items: sortedItems });
  } catch (error) {
    console.error('Error fetching structured content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch structured content' },
      { status: 500 }
    );
  }
}

