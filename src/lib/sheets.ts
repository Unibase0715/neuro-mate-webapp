// Spreadsheet configuration
const SPREADSHEET_ID = '1sXkkcOQ4iKLkemKCriLELZsms5d0jSoZ-17LimuyC_E';
const SHEET_NAME = 'シート1'; // Default sheet name
const MEMBER_RANGE = `${SHEET_NAME}!C:E`; // member_id, name, status columns
const HISTORY_SHEET_NAME = '相談履歴'; // Consultation history sheet
const LINE_LINK_SHEET_NAME = 'LINE連携'; // LINE user linkage sheet
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

// LINE linkage interface
export interface LineMemberLink {
  line_user_id: string;
  member_id: string;
  member_name: string;
  linked_at: string;
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

/**
 * Link LINE user to member ID
 * @param lineUserId - LINE user ID
 * @param memberId - Member ID
 * @param memberName - Member name
 * @param apiKey - Google API Key
 */
export async function linkLineUserToMember(
  lineUserId: string,
  memberId: string,
  memberName: string,
  apiKey: string
): Promise<void> {
  try {
    const timestamp = new Date().toISOString();
    const rowData = [lineUserId, memberId, memberName, timestamp];

    const url = `${SHEETS_API_BASE}/${SPREADSHEET_ID}/values/${encodeURIComponent(`${LINE_LINK_SHEET_NAME}!A:D`)}:append?valueInputOption=RAW&key=${apiKey}`;
    
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
      console.error('Failed to link LINE user:', response.status, await response.text());
      throw new Error('LINE連携の保存に失敗しました');
    }
  } catch (error) {
    console.error('Error linking LINE user to member:', error);
    throw error;
  }
}

/**
 * Get linked member from LINE user ID
 * @param lineUserId - LINE user ID
 * @param apiKey - Google API Key
 * @returns LineMemberLink object if found, null otherwise
 */
export async function getLinkedMember(
  lineUserId: string,
  apiKey: string
): Promise<LineMemberLink | null> {
  try {
    const url = `${SHEETS_API_BASE}/${SPREADSHEET_ID}/values/${encodeURIComponent(`${LINE_LINK_SHEET_NAME}!A:D`)}?key=${apiKey}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const rows = data.values;
    
    if (!rows || rows.length === 0) {
      return null;
    }

    // Skip header row and search for LINE user ID
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const [userId, memberId, memberName, linkedAt] = row;
      
      if (userId === lineUserId) {
        return {
          line_user_id: userId,
          member_id: memberId,
          member_name: memberName,
          linked_at: linkedAt,
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting linked member:', error);
    return null;
  }
}

/**
 * Get all active members with LINE linkage
 * @param apiKey - Google API Key
 * @returns Array of linked members with active status
 */
export async function getAllLinkedActiveMembers(
  apiKey: string
): Promise<Array<{ line_user_id: string; member_id: string; member_name: string }>> {
  try {
    // Get all LINE linkages
    const linkUrl = `${SHEETS_API_BASE}/${SPREADSHEET_ID}/values/${encodeURIComponent(`${LINE_LINK_SHEET_NAME}!A:D`)}?key=${apiKey}`;
    const linkResponse = await fetch(linkUrl);
    if (!linkResponse.ok) {
      return [];
    }
    const linkData = await linkResponse.json();
    const linkRows = linkData.values;
    
    if (!linkRows || linkRows.length === 0) {
      return [];
    }

    // Get all members with status
    const memberUrl = `${SHEETS_API_BASE}/${SPREADSHEET_ID}/values/${encodeURIComponent(MEMBER_RANGE)}?key=${apiKey}`;
    const memberResponse = await fetch(memberUrl);
    if (!memberResponse.ok) {
      return [];
    }
    const memberData = await memberResponse.json();
    const memberRows = memberData.values;
    
    if (!memberRows || memberRows.length === 0) {
      return [];
    }

    // Build member status map
    const memberStatusMap = new Map<string, string>();
    for (let i = 1; i < memberRows.length; i++) {
      const row = memberRows[i];
      const [memberId, name, status] = row;
      memberStatusMap.set(memberId, status);
    }

    // Filter linked members with active status
    const activeLinkedMembers = [];
    for (let i = 1; i < linkRows.length; i++) {
      const row = linkRows[i];
      const [lineUserId, memberId, memberName] = row;
      
      const status = memberStatusMap.get(memberId);
      if (status === 'active') {
        activeLinkedMembers.push({
          line_user_id: lineUserId,
          member_id: memberId,
          member_name: memberName,
        });
      }
    }

    return activeLinkedMembers;
  } catch (error) {
    console.error('Error getting all linked active members:', error);
    return [];
  }
}
