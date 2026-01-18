# מדריך אינטגרציה עם Google ADK

## סקירה כללית
הצ'אט בוט מוכן לאינטגרציה עם Google ADK שלך. כל הקוד המוכן לשימוש נמצא בקובץ `adkIntegration.js`.

---

## איך לבצע את האינטגרציה

### שלב 1: עדכון הגדרות ה-ADK

פתח את הקובץ `components/chat/adkIntegration.js` ועדכן:

```javascript
const ADK_ENDPOINT = 'YOUR_ADK_ENDPOINT_HERE'; // כתובת ה-endpoint של ה-ADK שלך
const ADK_API_KEY = 'YOUR_API_KEY_HERE'; // מפתח API אם נדרש
```

---

### שלב 2: שילוב הקריאה ל-ADK

בפונקציה `sendMessageToADK`, החלף את הקוד ב-TODO בקריאה אמיתית:

```javascript
const response = await fetch(ADK_ENDPOINT, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${ADK_API_KEY}`,
  },
  body: JSON.stringify({
    message: message,
    session_id: sessionId,
    username: username,
    language: language,
  })
});

const data = await response.json();
return parseADKResponse(data);
```

---

### שלב 3: התאמת מבנה התשובה

התאם את הפונקציה `parseADKResponse` למבנה התשובה שה-ADK שלך מחזיר:

```javascript
function parseADKResponse(adkData) {
  return {
    response: adkData.response,  // הטקסט לתצוגה למשתמש
    suggested_entities: adkData.suggested_entities,  // entities ליצירה (אופציונלי)
    metadata: {
      intent: adkData.intent,
      confidence: adkData.confidence,
    }
  };
}
```

---

## יצירת Entities אוטומטית

אם ה-ADK מזהה שצריך ליצור entities במערכת, החזר אובייקט בפורמט:

```javascript
suggested_entities: {
  entity_name: 'Order',  // שם ה-entity שהגדרת ב-Base44
  records: {
    supplier: 'ספק א',
    items: [...],
    total_amount: 5000,
    status: 'pending'
  }
  // או אם יש כמה records:
  // records: [{...}, {...}, {...}]
}
```

המערכת תיצור אוטומטית את הרשומות ותציג הודעת אישור למשתמש.

---

## דוגמת תשובה מלאה מה-ADK

```json
{
  "response": "יצרתי לך הזמנה חדשה מספר 12345 אצל ספק א' בסכום 5000 ש\"ח",
  "intent": "create_order",
  "confidence": 0.95,
  "suggested_entities": {
    "entity_name": "Order",
    "records": {
      "order_number": "12345",
      "supplier": "ספק א'",
      "total_amount": 5000,
      "status": "pending",
      "items": [
        {"product": "נייר A4", "quantity": 100},
        {"product": "עטים", "quantity": 50}
      ]
    }
  }
}
```

---

## פרמטרים שנשלחים ל-ADK

המערכת שולחת ל-ADK:

- **message**: תוכן ההודעה מהמשתמש
- **session_id**: מזהה ייחודי לשיחה (מאפשר המשכיות)
- **username**: שם/מייל המשתמש המחובר
- **language**: שפה זוהה אוטומטית ('he' או 'en')

---

## תמיכה בעברית ואנגלית

המערכת מזהה אוטומטית את השפה בכל הודעה לפי תווים עבריים.
ודא שה-ADK שלך מחזיר תשובות בשפה המתאימה.

---

## טיפים לאינטגרציה

1. **טיפול בשגיאות**: ודא שיש try-catch סביב הקריאה ל-ADK
2. **Timeout**: הוסף timeout לקריאות שלוקחות זמן
3. **Retry Logic**: במקרה של כשל רשת, נסה מספר פעמים
4. **Logging**: הוסף לוגים לבדיקה ודיבוג

---

## בדיקה

לאחר האינטגרציה, בדוק:
- ✅ שליחת הודעות בעברית
- ✅ שליחת הודעות באנגלית
- ✅ יצירת entities אוטומטית
- ✅ המשכיות שיחות (session_id)
- ✅ טיפול בשגיאות

---

## צריך עזרה?

אם יש בעיות באינטגרציה, בדוק:
1. Console בדפדפן לשגיאות
2. Network tab - האם הקריאה ל-ADK עוברת?
3. מבנה התשובה מה-ADK - האם תואם למצופה?