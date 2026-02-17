import { query, getClient } from './db';

/**
 * Add a strike to a staff member and handle auto-actions
 */
export async function addStrike(
  staffId: number,
  reason: string,
  issuedBy: string
): Promise<{ strikeId: number; autoAction?: string }> {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    // Add strike to database
    const strikeResult = await client.query(
      'INSERT INTO strikes (staff_id, reason, issued_by) VALUES ($1, $2, $3) RETURNING id',
      [staffId, reason, issuedBy]
    );
    const strikeId = strikeResult.rows[0].id;
    
    // Get current strike count (non-removed strikes)
    const countResult = await client.query(
      'SELECT COUNT(*) as count FROM strikes WHERE staff_id = $1 AND is_removed = false',
      [staffId]
    );
    const strikeCount = parseInt(countResult.rows[0].count);
    
    // Update staff strikes count
    await client.query(
      'UPDATE staff SET strikes = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [strikeCount, staffId]
    );
    
    let autoAction: string | undefined;
    
    // Check if reached 3 strikes
    if (strikeCount >= 3) {
      const staffResult = await client.query(
        'SELECT id, name, is_senior_support, is_support FROM staff WHERE id = $1',
        [staffId]
      );
      const staff = staffResult.rows[0];
      
      if (staff.is_senior_support) {
        // Demote from Senior Support
        await client.query(
          'UPDATE staff SET is_senior_support = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
          [staffId]
        );
        await client.query(
          `INSERT INTO audit_log (staff_id, action, details, old_value, new_value, performed_by) 
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            staffId,
            'AUTO_DEMOTE',
            'Automatically demoted due to 3 strikes',
            'is_senior_support: true',
            'is_senior_support: false',
            'SYSTEM'
          ]
        );
        autoAction = 'DEMOTED';
      } else if (staff.is_support) {
        // Remove from Support
        await client.query(
          'UPDATE staff SET is_support = false, is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
          [staffId]
        );
        await client.query(
          `INSERT INTO audit_log (staff_id, action, details, old_value, new_value, performed_by) 
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            staffId,
            'AUTO_REMOVE',
            'Automatically removed due to 3 strikes',
            'is_support: true, is_active: true',
            'is_support: false, is_active: false',
            'SYSTEM'
          ]
        );
        autoAction = 'REMOVED';
      }
    }
    
    await client.query('COMMIT');
    return { strikeId, autoAction };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Remove a strike
 */
export async function removeStrike(
  strikeId: number,
  removedBy: string
): Promise<void> {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    // Mark strike as removed
    await client.query(
      'UPDATE strikes SET is_removed = true, removed_date = CURRENT_TIMESTAMP, removed_by = $1 WHERE id = $2',
      [removedBy, strikeId]
    );
    
    // Get staff_id from the strike
    const strikeResult = await client.query(
      'SELECT staff_id FROM strikes WHERE id = $1',
      [strikeId]
    );
    const staffId = strikeResult.rows[0]?.staff_id;
    
    if (staffId) {
      // Recalculate strike count
      const countResult = await client.query(
        'SELECT COUNT(*) as count FROM strikes WHERE staff_id = $1 AND is_removed = false',
        [staffId]
      );
      const strikeCount = parseInt(countResult.rows[0].count);
      
      // Update staff strikes count
      await client.query(
        'UPDATE staff SET strikes = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [strikeCount, staffId]
      );
    }
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get all strikes for a staff member
 */
export async function getStaffStrikes(staffId: number) {
  const result = await query(
    `SELECT * FROM strikes 
     WHERE staff_id = $1 
     ORDER BY issued_date DESC`,
    [staffId]
  );
  return result.rows;
}

/**
 * Get active strikes count
 */
export async function getActiveStrikesCount(staffId: number): Promise<number> {
  const result = await query(
    'SELECT COUNT(*) as count FROM strikes WHERE staff_id = $1 AND is_removed = false',
    [staffId]
  );
  return parseInt(result.rows[0].count);
}
