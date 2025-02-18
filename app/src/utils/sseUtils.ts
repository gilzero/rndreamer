import { DOMAIN } from '../../constants';
import EventSource from 'react-native-sse';
import { ChatError } from './errorUtils';

export interface SSEConnectionCallbacks {
  onConnectionStatus?: (status: 'connecting' | 'connected' | 'disconnected' | 'reconnecting') => void;
}

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

export async function createSSEConnection(
  url: string,
  body: string,
  callbacks: SSEConnectionCallbacks,
  retryCount: number = 0
): Promise<EventSource> {
  const { onConnectionStatus } = callbacks;

  try {
    if (onConnectionStatus) {
      onConnectionStatus(retryCount === 0 ? 'connecting' : 'reconnecting');
    }

    const es = new EventSource(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body,
    });

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        es.close();
        reject(new ChatError('Connection timeout', 'CONNECTION_TIMEOUT'));
      }, 10000); // 10 second timeout

      es.addEventListener('open', () => {
        clearTimeout(timeout);
        if (onConnectionStatus) {
          onConnectionStatus('connected');
        }
        resolve(es);
      });

      es.addEventListener('error', async () => {
        clearTimeout(timeout);
        es.close();
        
        if (retryCount < MAX_RETRIES) {
          const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
          if (onConnectionStatus) {
            onConnectionStatus('reconnecting');
          }
          
          try {
            await new Promise(resolve => setTimeout(resolve, delay));
            const newEs = await createSSEConnection(url, body, callbacks, retryCount + 1);
            resolve(newEs);
          } catch (retryError) {
            reject(retryError);
          }
        } else {
          if (onConnectionStatus) {
            onConnectionStatus('disconnected');
          }
          reject(new ChatError('Max retry attempts reached', 'MAX_RETRIES_EXCEEDED'));
        }
      });
    });
  } catch (error) {
    if (error instanceof ChatError) {
      throw error;
    }
    throw new ChatError('Failed to establish connection', 'CONNECTION_ERROR');
  }
}

export function getEventSource({
  headers,
  body,
  type
}: {
  headers?: Record<string, string>,
  body: unknown,
  type: string
}): EventSource {
  try {
    return new EventSource(`${DOMAIN}/chat/${type}`, {
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      method: 'POST',
      body: JSON.stringify(body),
    });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to create EventSource: ${error.message}`);
    }
    throw new Error('Failed to create EventSource: Unknown error');
  }
} 