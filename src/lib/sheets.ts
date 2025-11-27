// Spreadsheet configuration
const SPREADSHEET_ID = '1sXkkcOQ4iKLkemKCriLELZsms5d0jSoZ-17LimuyC_E';
const SHEET_NAME = 'シート1'; // Default sheet name
const MEMBER_RANGE = `${SHEET_NAME}!C:E`; // member_id, name, status columns
const HISTORY_SHEET_NAME = '相談履歴'; // Consultation history sheet
const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

// Member interface
export interface Member {
  member_id: string;
  name: string;
  status: 'active' | 'inactive';
}

// Consultation history interface
export interface ConsultationHistory {
  timestamp: string;
  member_id: string;
  member_name: string;
  consultation_type: string;
  content: string;
  ai_response: string;
}



/**
 * Verify member ID and check status
 * @param memberId - Member ID to verify (e.g., UNI-001)
 * @param apiKey - Google API Key
 * @returns Member object if found and active, null otherwise
 */
export async function verifyMemberId(
  memberId: string,
  apiKey: string
): Promise<Member | null> {
  try {
    const url = `${SHEETS_API_BASE}/${SPREADSHEET_ID}/values/${encodeURIComponent(MEMBER_RANGE)}?key=${apiKey}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Google Sheets API error: ${response.status}`);
    }

    const data = await response.json();
    const rows = data.values;
    
    if (!rows || rows.length === 0) {
      return null;
    }

    // Skip header row and search for member_id
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const [id, name, status] = row;
      
      if (id === memberId) {
        return {
          member_id: id,
          name: name || '',
          status: (status as 'active' | 'inactive') || 'inactive',
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Error verifying member ID:', error);
    throw new Error('会員情報の確認に失敗しました');
  }
}

/**
 * Save consultation history to spreadsheet
 * @param history - Consultation history data
 * @param apiKey - Google API Key
 */
export async function saveConsultationHistory(
  history: ConsultationHistory,
  apiKey: string
): Promise<void> {
  try {
    // Prepare row data
    const rowData = [
      history.timestamp,
      history.member_id,
      history.member_name,
      history.consultation_type,
      history.content,
      history.ai_response,
    ];

    const url = `${SHEETS_API_BASE}/${SPREADSHEET_ID}/values/${encodeURIComponent(`${HISTORY_SHEET_NAME}!A:F`)}:append?valueInputOption=RAW&key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [rowData],
      }),
    });

    if (!response.ok) {
      console.error('Failed to save history:', response.status, await response.text());
    }
  } catch (error) {
    console.error('Error saving consultation history:', error);
    // Don't throw error - history saving failure shouldn't block consultation
  }
}

/**
 * Get member consultation history
 * @param memberId - Member ID
 * @param apiKey - Google API Key
 * @returns Array of consultation history
 */
export async function getMemberHistory(
  memberId: string,
  apiKey: string
): Promise<ConsultationHistory[]> {
  try {
    const url = `${SHEETS_API_BASE}/${SPREADSHEET_ID}/values/${encodeURIComponent(`${HISTORY_SHEET_NAME}!A:F`)}?key=${apiKey}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const rows = data.values;
    
    if (!rows || rows.length === 0) {
      return [];
    }

    // Skip header row and filter by member_id
    const history: ConsultationHistory[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const [timestamp, id, name, type, content, aiResponse] = row;
      
      if (id === memberId) {
        history.push({
          timestamp,
          member_id: id,
          member_name: name,
          consultation_type: type,
          content,
          ai_response: aiResponse,
        });
      }
    }

    return history;
  } catch (error) {
    console.error('Error getting member history:', error);
    return [];
  }
}
