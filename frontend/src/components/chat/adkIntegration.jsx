/**
 * Google ADK Integration
 * 
 * הקובץ הזה מכיל את כל הלוגיקה לאינטגרציה עם Google ADK שלך
 * החלף את ה-MOCK functions בקריאות אמיתיות ל-ADK שלך
 */

// ==================================================
// הגדרות - עדכן את זה לפי ה-ADK שלך
// ==================================================
const ADK_ENDPOINT = '/adk-api/run_sse';
const APP_NAME = 'procurementAgent';

export async function sendMessageToADK(message, sessionId, username, language = 'he') {
  try {
    const response = await fetch(ADK_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        appName: APP_NAME,
        userId: username,
        sessionId: await getOrCreateBackendSession(sessionId, username),
        newMessage: {
          role: 'user',
          parts: [{ text: message }]
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ADK Error Response:', errorText);
      throw new Error(`ADK Error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    // Handle SSE response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponseText = '';
    let suggestedEntities = null;
    let metadata = {};
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // Append new chunk to buffer
      buffer += decoder.decode(value, { stream: true });

      // Split by newline to get messages
      const lines = buffer.split('\n');

      // Keep the last line in the buffer as it might be incomplete
      // (unless the chunk ended exactly with \n, but split gives empty string in that case which is safe to keep)
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim().startsWith('data:')) {
          try {
            const dataStr = line.trim().slice(5).trim();
            if (!dataStr) continue;

            const data = JSON.parse(dataStr);

            // Accumulate text content from the stream
            if (data.content) {
              if (Array.isArray(data.content)) {
                data.content.forEach(part => {
                  if (part.text) fullResponseText += part.text;
                });
              } else if (typeof data.content === 'string') {
                fullResponseText += data.content;
              } else if (data.content.parts && Array.isArray(data.content.parts)) {
                // Handle standard Genkit "parts" structure
                data.content.parts.forEach(part => {
                  if (part.text) fullResponseText += part.text;
                });
              } else if (data.content.text) {
                fullResponseText += data.content.text;
              }
            }

            // Capture other metadata or structured data if available
            if (data.entity) suggestedEntities = data.entity;
            if (data.metadata) metadata = { ...metadata, ...data.metadata };

          } catch (e) {
            console.warn('Error parsing SSE data chunk:', e);
            // Don't throw, just skip this chunk so the stream continues
          }
        }
      }
    }

    return {
      response: fullResponseText,
      suggested_entities: suggestedEntities || detectEntityCreation({ response: fullResponseText }),
      metadata: metadata
    };

  } catch (error) {
    console.error('Error calling ADK:', error);
    throw error;
  }
}

// Helper to manage backend session mapping
// Maps local conversation ID (UUID) to ADK backend session ID
async function getOrCreateBackendSession(localSessionId, userId) {
  const storageKey = `adk_session_${localSessionId}`;
  const storedSessionId = localStorage.getItem(storageKey);

  if (storedSessionId) {
    return storedSessionId;
  }

  // Create new session on backend
  try {
    const response = await fetch(`${ADK_ENDPOINT.replace('/run_sse', '')}/apps/${APP_NAME}/users/${userId}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });

    if (!response.ok) {
      console.error('Failed to create session', await response.text());
      throw new Error('Failed to create backend session');
    }

    const sessionData = await response.json();
    const newSessionId = sessionData.id;

    localStorage.setItem(storageKey, newSessionId);
    return newSessionId;
  } catch (e) {
    console.error('Session creation error:', e);
    // Fallback: try to use local ID if creation fails? (unlikely to work based on testing)
    throw e;
  }
}


// ==================================================
// פענוח תשובה מה-ADK
// ==================================================
function parseADKResponse(adkData) {
  // TODO: התאם את זה למבנה התשובה של ה-ADK שלך

  return {
    response: adkData.response || adkData.message || (typeof adkData === 'string' ? adkData : ''),
    suggested_entities: adkData.suggested_entities || detectEntityCreation(adkData),
    metadata: {
      intent: adkData.intent,
      confidence: adkData.confidence,
      entities_detected: adkData.entities,
    }
  };
}

// ==================================================
// זיהוי אוטומטי של צורך ביצירת entities
// ==================================================
function detectEntityCreation(adkData) {
  // אם ה-ADK לא מחזיר suggested_entities במפורש,
  // ננסה לזהות אוטומטית מהתשובה

  const response = adkData.response?.toLowerCase() || '';

  // דוגמה: אם ה-ADK אומר "creating order" או "יצרתי הזמנה"
  if (response.includes('creating order') || response.includes('יצרתי הזמנה')) {
    // חפש מידע על ההזמנה בתשובה
    return {
      entity_name: 'Order',
      records: extractOrderData(adkData)
    };
  }

  // דוגמה: עדכון מלאי
  if (response.includes('updating inventory') || response.includes('עדכנתי מלאי')) {
    return {
      entity_name: 'Inventory',
      records: extractInventoryData(adkData)
    };
  }

  return null;
}

// ==================================================
// פונקציות עזר לחילוץ מידע
// ==================================================
function extractOrderData(adkData) {
  // TODO: התאם לפי המבנה של התשובות שלך
  if (adkData.order_details) {
    return {
      supplier: adkData.order_details.supplier,
      items: adkData.order_details.items,
      total_amount: adkData.order_details.total,
      status: 'pending',
      order_date: new Date().toISOString()
    };
  }
  return null;
}

function extractInventoryData(adkData) {
  // TODO: התאם לפי המבנה של התשובות שלך
  if (adkData.inventory_updates) {
    return adkData.inventory_updates.map(item => ({
      product_name: item.product,
      quantity: item.quantity,
      last_updated: new Date().toISOString()
    }));
  }
  return null;
}

// ==================================================
// MOCK Response (למחיקה כשמשלבים ADK אמיתי)
// ==================================================
async function mockADKResponse(message, language) {
  // סימולציה של זמן תגובה
  await new Promise(resolve => setTimeout(resolve, 1000));

  const lowerMessage = message.toLowerCase();
  const isHebrew = language === 'he';

  // תשובות לפי כוונה
  if (lowerMessage.includes('הזמנ') || lowerMessage.includes('order')) {
    return {
      response: isHebrew
        ? 'יש לך כרגע 12 הזמנות פתוחות. 3 מהן ממתינות לאישור, 5 בתהליך משלוח ו-4 צפויות להגיע היום.'
        : 'You have 12 open orders. 3 are awaiting approval, 5 are in shipping, and 4 are expected today.',
      suggested_entities: null,
      metadata: {
        intent: 'check_orders',
        confidence: 0.95
      }
    };
  }

  if (lowerMessage.includes('מלאי') || lowerMessage.includes('inventory')) {
    return {
      response: isHebrew
        ? 'מצב המלאי תקין. 5 פריטים מתקרבים לרמת מלאי מינימום:\n• נייר A4 - 50 חבילות\n• טונר - 3 יחידות\n• כפפות - 20 זוגות'
        : 'Inventory status is good. 5 items are approaching minimum stock:\n• A4 Paper - 50 packs\n• Toner - 3 units\n• Gloves - 20 pairs',
      suggested_entities: null,
      metadata: {
        intent: 'check_inventory',
        confidence: 0.92
      }
    };
  }

  if (lowerMessage.includes('צור הזמנה') || lowerMessage.includes('create order')) {
    return {
      response: isHebrew
        ? 'בטח! יצרתי הזמנה חדשה. מה הפרטים?'
        : 'Sure! Created a new order. What are the details?',
      suggested_entities: {
        entity_name: 'Order',
        records: {
          status: 'draft',
          created_date: new Date().toISOString(),
          items: []
        }
      },
      metadata: {
        intent: 'create_order',
        confidence: 0.88
      }
    };
  }

  // תשובה ברירת מחדל
  return {
    response: isHebrew
      ? 'אני כאן לעזור בניהול הזמנות, מלאי ורכש. במה אוכל לסייע?'
      : 'I\'m here to help with orders, inventory, and procurement. How can I assist?',
    suggested_entities: null,
    metadata: {
      intent: 'general',
      confidence: 0.5
    }
  };
}

// ==================================================
// פונקציות עזר נוספות
// ==================================================

/**
 * בדיקה אם ה-ADK זמין
 */
export async function checkADKHealth() {
  try {
    // TODO: החלף בקריאת health check אמיתית
    /*
    const response = await fetch(`${ADK_ENDPOINT}/health`);
    return response.ok;
    */
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * ניקוי session (אם נדרש)
 */
export async function clearSession(sessionId) {
  try {
    // TODO: אם ה-ADK שלך תומך בניקוי sessions
    /*
    await fetch(`${ADK_ENDPOINT}/sessions/${sessionId}`, {
      method: 'DELETE',
    });
    */
    console.log(`Session ${sessionId} cleared`);
  } catch (error) {
    console.error('Error clearing session:', error);
  }
}