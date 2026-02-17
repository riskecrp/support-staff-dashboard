import { NextApiRequest, NextApiResponse } from 'next';
import { query, getClient } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  if (!id || Array.isArray(id)) {
    return res.status(400).json({ success: false, error: 'Invalid staff ID' });
  }
  
  if (req.method === 'GET') {
    return handleGet(id, req, res);
  } else if (req.method === 'PUT') {
    return handlePut(id, req, res);
  } else if (req.method === 'DELETE') {
    return handleDelete(id, req, res);
  } else {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }
}

async function handleGet(id: string, req: NextApiRequest, res: NextApiResponse) {
  try {
    const result = await query('SELECT * FROM staff WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Staff member not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error fetching staff member:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

async function handlePut(id: string, req: NextApiRequest, res: NextApiResponse) {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    const { name, is_support, is_senior_support, performed_by = 'ADMIN' } = req.body;
    
    // Get current state
    const currentResult = await client.query('SELECT * FROM staff WHERE id = $1', [id]);
    if (currentResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'Staff member not found'
      });
    }
    const current = currentResult.rows[0];
    
    // Build update query dynamically
    const updates: string[] = [];
    const params: any[] = [];
    let paramCount = 0;
    const changes: string[] = [];
    
    if (name !== undefined && name !== current.name) {
      paramCount++;
      updates.push(`name = $${paramCount}`);
      params.push(name);
      changes.push(`Name changed from "${current.name}" to "${name}"`);
      
      // Log name change to aliases table
      await client.query(
        'INSERT INTO name_aliases (staff_id, old_name, new_name) VALUES ($1, $2, $3)',
        [id, current.name, name]
      );
    }
    
    if (is_support !== undefined && is_support !== current.is_support) {
      paramCount++;
      updates.push(`is_support = $${paramCount}`);
      params.push(is_support);
      changes.push(`Support status changed from ${current.is_support} to ${is_support}`);
    }
    
    if (is_senior_support !== undefined && is_senior_support !== current.is_senior_support) {
      paramCount++;
      updates.push(`is_senior_support = $${paramCount}`);
      params.push(is_senior_support);
      changes.push(`Senior Support status changed from ${current.is_senior_support} to ${is_senior_support}`);
    }
    
    if (updates.length === 0) {
      await client.query('ROLLBACK');
      return res.status(200).json({
        success: true,
        data: current,
        message: 'No changes made'
      });
    }
    
    // Add updated_at
    paramCount++;
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    
    // Add id parameter
    paramCount++;
    params.push(id);
    
    const sql = `UPDATE staff SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    const result = await client.query(sql, params);
    
    // Log to audit
    await client.query(
      `INSERT INTO audit_log (staff_id, action, details, performed_by) 
       VALUES ($1, $2, $3, $4)`,
      [
        id,
        'UPDATE_STAFF',
        changes.join('; '),
        performed_by
      ]
    );
    
    await client.query('COMMIT');
    
    return res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error updating staff member:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    client.release();
  }
}

async function handleDelete(id: string, req: NextApiRequest, res: NextApiResponse) {
  try {
    const { performed_by = 'ADMIN' } = req.body;
    
    // Soft delete - set is_active to false, is_support to false
    const result = await query(
      `UPDATE staff 
       SET is_active = false, is_support = false, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 
       RETURNING *`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Staff member not found'
      });
    }
    
    // Log to audit
    await query(
      `INSERT INTO audit_log (staff_id, action, details, performed_by) 
       VALUES ($1, $2, $3, $4)`,
      [
        id,
        'REMOVE_STAFF',
        `Staff member removed (soft delete)`,
        performed_by
      ]
    );
    
    return res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error deleting staff member:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
