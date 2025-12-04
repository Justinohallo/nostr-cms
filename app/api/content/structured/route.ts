import { NextRequest, NextResponse } from 'next/server';
import { verifyEvent, SimplePool, Event } from 'nostr-tools';
import { getSessionFromRequest } from '@/lib/auth/session';

const relayUrl = process.env.NOSTR_RELAY_URL || 'wss://relay.damus.io';

// Structured content interface
interface StructuredContentItem {
  id: string;
  name: string;
  content: string;
  createdAt: string;
}

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
    const dTag = event.tags.find((tag) => tag[0] === 'd');
    const name = dTag ? dTag[1] : 'unknown';

    // Publish to Nostr relay (server-side)
    const pool = new SimplePool();
    const relays = [relayUrl];

    try {
      // pool.publish returns an array of promises (one per relay)
      const publishPromises = pool.publish(relays, event);
      
      // Wait for all relays to confirm receipt
      const results = await Promise.allSettled(publishPromises);
      
      // Check if at least one relay accepted the event
      const hasSuccess = results.some(
        (result) => result.status === 'fulfilled' && result.value !== null
      );
      
      if (!hasSuccess) {
        console.error('Failed to publish to any relay:', results);
        throw new Error('Failed to publish event to relay');
      }
      
      // Give relay a moment to index the event before closing
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      pool.close(relays);

      // Return generic response
      return NextResponse.json({
        success: true,
        id: event.id,
        name,
        content: event.content,
        createdAt: new Date(event.created_at * 1000).toISOString(),
      });
    } catch (error) {
      pool.close(relays);
      console.error('Error publishing to relay:', error);
      throw error;
    }
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

    // Fetch from Nostr relay (server-side)
    const pool = new SimplePool();
    const relays = [relayUrl];

    return new Promise<NextResponse>((resolve) => {
      const events: StructuredContentItem[] = [];

      // Build filter
      const filter: any = {
        kinds: [30000], // Structured content kind
        authors: [publicKey],
      };

      // If name specified, filter by d tag
      if (name) {
        filter['#d'] = [name]; // Filter by d tag value
      }

      const sub = pool.subscribeEose(relays, filter, {
        onevent: (event: Event) => {
          // Extract name from d tag
          const dTag = event.tags.find((tag) => tag[0] === 'd');
          const contentName = dTag ? dTag[1] : 'unknown';

          events.push({
            id: event.id,
            name: contentName,
            content: event.content,
            createdAt: new Date(event.created_at * 1000).toISOString(),
          });
        },
        onclose: () => {
          pool.close(relays);

          // Return generic response
          resolve(
            NextResponse.json({
              items: events.sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime()
              ),
            })
          );
        },
        maxWait: 5000,
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        sub.close();
        pool.close(relays);
        resolve(
          NextResponse.json({
            items: events.sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            ),
          })
        );
      }, 5000);
    });
  } catch (error) {
    console.error('Error fetching structured content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch structured content' },
      { status: 500 }
    );
  }
}

